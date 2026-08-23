import socket
import logging
import requests
import time
from django.conf import settings
from django.db import connection
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from apps.users.serializers import UserProfileSerializer
from apps.crisis_directory.models import CrisisResource
from apps.crisis_directory.serializers import CrisisResourceDetailSerializer
from shared.permissions import IsSuperAdmin

logger = logging.getLogger(__name__)
User = get_user_model()

@extend_schema(tags=['admin'])
class AdminHealthCheckDetailView(APIView):
    """
    GET /api/v1/admin-panel/health/
    Detailed health check: DB latency, Redis connectivity. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(summary='Get detailed system health and latency info')
    def get(self, request):
        health_info = {
            'status': 'healthy',
            'timestamp': time.time(),
            'database': {'status': 'unknown', 'latency_ms': None},
            'cache': {'status': 'unknown', 'latency_ms': None},
        }

        # Test Database Latency
        start_time = time.perf_counter()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            health_info['database']['status'] = 'healthy'
            health_info['database']['latency_ms'] = round((time.perf_counter() - start_time) * 1000, 2)
        except Exception as e:
            health_info['status'] = 'unhealthy'
            health_info['database']['status'] = 'unhealthy'
            health_info['database']['error'] = str(e)

        # Test Redis Latency
        start_time = time.perf_counter()
        try:
            from django.core.cache import cache
            cache.set('health_check_key', 'healthy_val', timeout=10)
            val = cache.get('health_check_key')
            if val == 'healthy_val':
                health_info['cache']['status'] = 'healthy'
                health_info['cache']['latency_ms'] = round((time.perf_counter() - start_time) * 1000, 2)
            else:
                health_info['cache']['status'] = 'corrupted'
        except Exception as e:
            health_info['status'] = 'unhealthy'
            health_info['cache']['status'] = 'unhealthy'
            health_info['cache']['error'] = str(e)

        return Response(health_info)


@extend_schema(tags=['admin'])
class SecurityHeadersCheckView(APIView):
    """
    GET /api/v1/admin-panel/security-headers/
    Analyzes current Django security header settings. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(summary='Check security headers and HSTS status')
    def get(self, request):
        sec_checks = {
            'SECURE_SSL_REDIRECT': getattr(settings, 'SECURE_SSL_REDIRECT', False),
            'SESSION_COOKIE_SECURE': getattr(settings, 'SESSION_COOKIE_SECURE', False),
            'CSRF_COOKIE_SECURE': getattr(settings, 'CSRF_COOKIE_SECURE', False),
            'SECURE_HSTS_SECONDS': getattr(settings, 'SECURE_HSTS_SECONDS', 0),
            'SECURE_HSTS_INCLUDE_SUBDOMAINS': getattr(settings, 'SECURE_HSTS_INCLUDE_SUBDOMAINS', False),
            'SECURE_HSTS_PRELOAD': getattr(settings, 'SECURE_HSTS_PRELOAD', False),
            'SECURE_CONTENT_TYPE_NOSNIFF': getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', False),
            'X_FRAME_OPTIONS': getattr(settings, 'X_FRAME_OPTIONS', 'None'),
            'SECURE_BROWSER_XSS_FILTER': getattr(settings, 'SECURE_BROWSER_XSS_FILTER', False),
        }

        # Calculate a simple safety grade (e.g. A+, A, B, C, F)
        passed_count = sum(1 for v in sec_checks.values() if v)
        if passed_count >= 8:
            grade = 'A+'
        elif passed_count >= 6:
            grade = 'A'
        elif passed_count >= 4:
            grade = 'B'
        elif passed_count >= 2:
            grade = 'C'
        else:
            grade = 'F'

        return Response({
            'security_grade': grade,
            'passed_checks': passed_count,
            'total_checks': len(sec_checks),
            'details': sec_checks
        })


@extend_schema(tags=['admin'])
class CORSConfigView(APIView):
    """
    GET /api/v1/admin-panel/cors/
    Returns CORS allowed origins and settings. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(summary='Retrieve CORS config and allowed headers')
    def get(self, request):
        return Response({
            'CORS_ALLOWED_ORIGINS': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
            'CORS_ALLOW_CREDENTIALS': getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
            'CORS_ALLOW_HEADERS': getattr(settings, 'CORS_ALLOW_HEADERS', []),
        })


@extend_schema(tags=['admin'])
class DNSCheckerView(APIView):
    """
    GET /api/v1/admin-panel/dns-checker/?domain=resilienciavzla.com
    Performs DNS records lookup using Google DNS public API. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        parameters=[OpenApiParameter('domain', str, required=True, description='Domain to check')],
        summary='Scan DNS records for a domain'
    )
    def get(self, request):
        domain = request.query_params.get('domain', '').strip()
        if not domain:
            return Response({'detail': 'El parámetro domain es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        record_types = ['A', 'AAAA', 'MX', 'TXT', 'NS']
        dns_results = {}

        for r_type in record_types:
            try:
                url = f"https://dns.google/resolve?name={domain}&type={r_type}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    data = resp.json()
                    answers = data.get('Answer', [])
                    dns_results[r_type] = [ans.get('data') for ans in answers]
                else:
                    dns_results[r_type] = []
            except Exception as e:
                dns_results[r_type] = [f"Error lookup: {str(e)}"]

        return Response({
            'domain': domain,
            'records': dns_results,
            'timestamp': time.time()
        })


@extend_schema(tags=['admin'])
class OpenPortCheckerView(APIView):
    """
    GET /api/v1/admin-panel/port-scanner/
    Scans common ports (80, 443, 8000, 5432, 6379) on localhost. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(summary='Scan common ports on host machine')
    def get(self, request):
        target_host = '127.0.0.1'
        ports_to_check = {
            80: 'HTTP / Web Server',
            443: 'HTTPS / Secure Web Server',
            8000: 'Django DRF Backend',
            5432: 'PostgreSQL Database',
            6379: 'Redis Cache/Broker',
        }
        scan_results = []

        for port, service in ports_to_check.items():
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.0)
            result = sock.connect_ex((target_host, port))
            sock.close()
            
            scan_results.append({
                'port': port,
                'service': service,
                'status': 'open' if result == 0 else 'closed'
            })

        return Response({
            'target': target_host,
            'scan_results': scan_results,
            'timestamp': time.time()
        })


@extend_schema(tags=['admin'])
class SSLLabsCheckView(APIView):
    """
    GET /api/v1/admin-panel/ssl-labs/?host=resilienciavzla.com
    Proxies request to SSL Labs analysis API. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        parameters=[OpenApiParameter('host', str, required=True, description='Host domain to analyze')],
        summary='Query SSL Labs API for domain grading'
    )
    def get(self, request):
        host = request.query_params.get('host', '').strip()
        if not host:
            return Response({'detail': 'El parámetro host es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = f"https://api.ssllabs.com/api/v2/analyze?host={host}"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                return Response(resp.json())
            return Response({'detail': 'Error al conectar con SSL Labs API.'}, status=resp.status_code)
        except Exception as e:
            return Response({'detail': f'Error de conexión: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(tags=['admin'])
class SQLInjectionProbeView(APIView):
    """
    POST /api/v1/admin-panel/sql-injection-probe/
    Demonstrates Django ORM security by testing input parameter sanitization. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        request=OpenApiResponse(description='JSON data with probe query'),
        summary='Test ORM protection against SQL injection'
    )
    def post(self, request):
        probe_input = request.data.get('probe_query', "1' OR '1'='1")
        
        # Test 1: Fetching filtered users using safe Django ORM parameter query
        # This will query for exactly the email/first_name matching the input.
        # It is fully safe.
        start_time = time.perf_counter()
        try:
            # Safe query: Django parameters are escaped automatically
            safe_results = User.objects.filter(first_name=probe_input)
            safe_query_sql = str(safe_results.query)
            safe_count = safe_results.count()
            latency_safe = round((time.perf_counter() - start_time) * 1000, 3)
        except Exception as e:
            safe_query_sql = str(e)
            safe_count = 0
            latency_safe = 0.0

        return Response({
            'probe_input_tested': probe_input,
            'orm_sanitized_sql': safe_query_sql,
            'results_found': safe_count,
            'query_latency_ms': latency_safe,
            'orm_status': 'PROTECTED (Input treated strictly as parameter string)'
        })


@extend_schema(tags=['admin'])
class PendingVerificationsView(APIView):
    """
    GET   /api/v1/admin-panel/verifications/  — List citizens (all or filter by pending)
    PATCH /api/v1/admin-panel/verifications/<uuid:user_id>/ — Verify user flags (SuperAdmin only)
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        parameters=[
            OpenApiParameter('pending_only', str, description='true/false'),
        ],
        responses={200: UserProfileSerializer(many=True)},
        summary='List all citizens and their verification status'
    )
    def get(self, request):
        queryset = User.objects.filter(role='CITIZEN')
        
        pending_only = request.query_params.get('pending_only', '').lower() == 'true'
        if pending_only:
            queryset = queryset.filter(
                Q(is_verified_health_worker=False) &
                Q(is_verified_shelter_manager=False) &
                Q(is_verified_org_donor=False)
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = UserProfileSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=['admin'])
class ToggleUserVerificationFlagsView(APIView):
    """
    PATCH /api/v1/admin-panel/verifications/<uuid:user_id>/
    Allows SuperAdmin to enable or disable verification flags on CITIZEN users.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        request=OpenApiResponse(description='JSON keys: is_verified_health_worker, is_verified_shelter_manager, is_verified_org_donor (Booleans)'),
        responses={200: UserProfileSerializer},
        summary='Toggle citizen verification flags'
    )
    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, role='CITIZEN')
        except User.DoesNotExist:
            return Response({'detail': 'Ciudadano no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if 'is_verified_health_worker' in request.data:
            user.is_verified_health_worker = bool(request.data['is_verified_health_worker'])
        if 'is_verified_shelter_manager' in request.data:
            user.is_verified_shelter_manager = bool(request.data['is_verified_shelter_manager'])
        if 'is_verified_org_donor' in request.data:
            user.is_verified_org_donor = bool(request.data['is_verified_org_donor'])

        user.save()
        logger.info('SuperAdmin updated verification flags for user %s: Health: %s, Shelter: %s, Donor: %s',
                    user.email, user.is_verified_health_worker, user.is_verified_shelter_manager, user.is_verified_org_donor)
        return Response(UserProfileSerializer(user).data)


@extend_schema(tags=['admin'])
class ModerationQueueView(APIView):
    """
    GET /api/v1/admin-panel/moderation-queue/
    Lists all unapproved crisis directory resources. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        responses={200: CrisisResourceDetailSerializer(many=True)},
        summary='List resources pending moderation review'
    )
    def get(self, request):
        # We list all where is_approved=False
        queryset = CrisisResource.objects.select_related('submitted_by').filter(is_approved=False)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = CrisisResourceDetailSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=['admin'])
class ApproveCrisisResourceView(APIView):
    """
    POST /api/v1/admin-panel/approve-resource/<uuid:pk>/
    Approve or reject a submitted crisis resource. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        request=OpenApiResponse(description='JSON keys: approve (Boolean)'),
        responses={200: OpenApiResponse(description='Success message')},
        summary='Approve or delete a flagged resource'
    )
    def post(self, request, pk):
        try:
            resource = CrisisResource.objects.get(pk=pk)
        except CrisisResource.DoesNotExist:
            return Response({'detail': 'Recurso no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        approve = bool(request.data.get('approve', False))
        if approve:
            resource.is_approved = True
            # Clear moderation flags as it is verified
            resource.moderation_flags = []
            resource.save()
            logger.info('Crisis resource %s approved by SuperAdmin %s', resource.name, request.user.email)
            return Response({'detail': 'Recurso aprobado con éxito.'})
        else:
            resource.delete()
            logger.info('Crisis resource %s rejected and deleted by SuperAdmin %s', resource.name, request.user.email)
            return Response({'detail': 'Recurso rechazado y eliminado.'})

from .models import SystemModule

@extend_schema(tags=['admin', 'modules'])
class SystemModuleListView(APIView):
    """
    GET /api/v1/admin-panel/modules/
    PATCH /api/v1/admin-panel/modules/
    Manage dynamic modules configuration.
    """
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [] # Public to know what modules to render
        return [IsAuthenticated(), IsSuperAdmin()]
        
    @extend_schema(summary='Get all system modules')
    def get(self, request):
        modules = SystemModule.objects.all()
        data = [{'id': m.id, 'name': m.name, 'slug': m.slug, 'is_active': m.is_active} for m in modules]
        return Response(data)
        
    @extend_schema(summary='Update a system module status')
    def patch(self, request):
        slug = request.data.get('slug')
        is_active = request.data.get('is_active')
        
        try:
            module = SystemModule.objects.get(slug=slug)
            module.is_active = bool(is_active)
            module.save()
            return Response({'detail': f'Módulo {slug} actualizado.', 'is_active': module.is_active})
        except SystemModule.DoesNotExist:
            return Response({'detail': 'Módulo no encontrado.'}, status=404)

