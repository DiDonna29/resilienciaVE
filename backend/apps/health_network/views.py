import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import HealthCenter
from .serializers import (
    HealthCenterListSerializer,
    HealthCenterDetailSerializer,
    HealthCenterCreateSerializer,
    HealthCenterStatusUpdateSerializer,
    HealthCenterSuppliesSerializer,
)
from shared.permissions import IsSuperAdmin, IsOwnerOrSuperAdmin, IsVerifiedHealthWorker
from shared.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)

@extend_schema(tags=['health-network'])
class HealthCenterListView(APIView):
    """
    GET  /api/v1/health-network/  — List health centers (public)
    POST /api/v1/health-network/  — Register a new health center (authenticated)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        parameters=[
            OpenApiParameter('status', str, description='operational, critical, closed'),
            OpenApiParameter('type', str, description='hospital, clinic, medical_post'),
            OpenApiParameter('state_ve', str, description='Venezuelan state name'),
        ],
        responses={200: HealthCenterListSerializer(many=True)},
        summary='List all health centers with optional filters',
    )
    def get(self, request):
        queryset = HealthCenter.objects.select_related('registered_by').all()

        status_filter = request.query_params.get('status')
        if status_filter in [choice[0] for choice in HealthCenter.STATUS_CHOICES]:
            queryset = queryset.filter(status=status_filter)

        type_filter = request.query_params.get('type')
        if type_filter in [choice[0] for choice in HealthCenter.TYPE_CHOICES]:
            queryset = queryset.filter(type=type_filter)

        state = request.query_params.get('state_ve', '').strip()
        if state:
            queryset = queryset.filter(state_ve__iexact=state)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = HealthCenterListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        request=HealthCenterCreateSerializer,
        responses={201: HealthCenterDetailSerializer},
        summary='Register a new health center',
    )
    def post(self, request):
        serializer = HealthCenterCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        health_center = serializer.save()
        logger.info('Health center registered: %s by user %s', health_center.name, request.user.email)
        return Response(HealthCenterDetailSerializer(health_center).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['health-network'])
class HealthCenterDetailView(APIView):
    """
    GET   /api/v1/health-network/<uuid:pk>/  — Get health center details (public)
    PATCH /api/v1/health-network/<uuid:pk>/  — Update health center status (SuperAdmin/Owner)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsOwnerOrSuperAdmin()]

    @extend_schema(
        responses={200: HealthCenterDetailSerializer},
        summary='Get details of a specific health center',
    )
    def get(self, request, pk):
        try:
            health_center = HealthCenter.objects.select_related('registered_by').get(pk=pk)
        except HealthCenter.DoesNotExist:
            return Response({'detail': 'Centro de salud no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(HealthCenterDetailSerializer(health_center).data)

    @extend_schema(
        request=HealthCenterStatusUpdateSerializer,
        responses={200: HealthCenterDetailSerializer},
        summary='Update health center status',
    )
    def patch(self, request, pk):
        try:
            health_center = HealthCenter.objects.get(pk=pk)
        except HealthCenter.DoesNotExist:
            return Response({'detail': 'Centro de salud no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, health_center)

        serializer = HealthCenterStatusUpdateSerializer(health_center, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        logger.info('Health center status updated: %s to status %s', updated.name, updated.status)
        return Response(HealthCenterDetailSerializer(updated).data)


@extend_schema(tags=['health-network'])
class HealthCenterSuppliesUpdateView(APIView):
    """
    PUT /api/v1/health-network/<uuid:pk>/supplies/  — Update list of missing supplies (Owner, HealthWorker, or SuperAdmin)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=HealthCenterSuppliesSerializer,
        responses={200: HealthCenterDetailSerializer},
        summary='Update the list of missing supplies for a health center',
    )
    def put(self, request, pk):
        try:
            health_center = HealthCenter.objects.get(pk=pk)
        except HealthCenter.DoesNotExist:
            return Response({'detail': 'Centro de salud no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions: must be Owner, SuperAdmin or Verified Health Worker
        is_owner = health_center.registered_by == request.user
        is_super = request.user.role == 'SUPERADMIN'
        is_health = request.user.is_verified_health_worker
        
        if not (is_owner or is_super or is_health):
            return Response(
                {'detail': 'No tienes permisos para modificar los insumos de este centro de salud.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = HealthCenterSuppliesSerializer(health_center, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        return Response(HealthCenterDetailSerializer(updated).data)
