"""
Views for the missing_people app.
"""
import logging
from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import MissingPerson
from .serializers import (
    MissingPersonCreateSerializer,
    MissingPersonListSerializer,
    MissingPersonDetailSerializer,
    MarkAsFoundSerializer,
    DuplicateCheckSerializer,
    MissingPersonStatsSerializer,
)
from shared.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)


@extend_schema(tags=['missing-people'])
class MissingPersonListView(APIView):
    """
    GET  /api/v1/missing-people/       — List missing persons (public, filterable, paginated)
    POST /api/v1/missing-people/       — Report a new missing person (authenticated)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        parameters=[
            OpenApiParameter('status', str, description='Filter by status: missing, found, deceased'),
            OpenApiParameter('state_ve', str, description='Filter by Venezuelan state'),
            OpenApiParameter('search', str, description='Search by full name or cedula'),
        ],
        responses={200: MissingPersonListSerializer(many=True)},
        summary='List missing persons',
    )
    def get(self, request):
        queryset = MissingPerson.objects.select_related('reported_by').all()

        # Status filter
        status_filter = request.query_params.get('status')
        if status_filter in ('missing', 'found', 'deceased'):
            queryset = queryset.filter(status=status_filter)
        else:
            # Default to showing missing persons
            queryset = queryset.filter(status='missing')

        # State filter
        state = request.query_params.get('state_ve', '').strip()
        if state:
            queryset = queryset.filter(state_ve__iexact=state)

        # Search
        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(full_name__icontains=search) | Q(cedula__icontains=search)
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = MissingPersonListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        request=MissingPersonCreateSerializer,
        responses={
            201: MissingPersonDetailSerializer,
            400: OpenApiResponse(description='Validation error or duplicate detected'),
        },
        summary='Report a new missing person',
    )
    def post(self, request):
        serializer = MissingPersonCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        person = serializer.save()
        logger.info(
            'Missing person reported: %s (age=%d) by user %s',
            person.full_name, person.age, request.user.email,
        )
        return Response(
            MissingPersonDetailSerializer(person).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['missing-people'])
class MissingPersonDetailView(APIView):
    """
    GET /api/v1/missing-people/<uuid:pk>/
    Retrieve full details of a missing person report. Public access.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            200: MissingPersonDetailSerializer,
            404: OpenApiResponse(description='Person not found'),
        },
        summary='Get missing person details',
    )
    def get(self, request, pk):
        try:
            person = MissingPerson.objects.select_related(
                'reported_by', 'located_by'
            ).get(pk=pk)
        except MissingPerson.DoesNotExist:
            return Response(
                {'detail': 'Persona no encontrada en el registro.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = MissingPersonDetailSerializer(person)
        return Response(serializer.data)


@extend_schema(tags=['missing-people'])
class MissingPersonStatsView(APIView):
    """
    GET /api/v1/missing-people/stats/
    Aggregated missing persons statistics. Public access.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: MissingPersonStatsSerializer},
        summary='Get missing persons statistics',
    )
    def get(self, request):
        total = MissingPerson.objects.count()
        missing_count = MissingPerson.objects.filter(status='missing').count()
        found_count = MissingPerson.objects.filter(status='found').count()
        deceased_count = MissingPerson.objects.filter(status='deceased').count()

        last_updated_obj = MissingPerson.objects.order_by('-updated_at').first()
        last_updated = last_updated_obj.updated_at if last_updated_obj else None

        # Per-state breakdown (missing persons only)
        by_state_qs = (
            MissingPerson.objects
            .filter(status='missing')
            .values('state_ve')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        by_state = {row['state_ve']: row['count'] for row in by_state_qs}

        data = {
            'total': total,
            'missing': missing_count,
            'found': found_count,
            'deceased': deceased_count,
            'last_updated': last_updated,
            'by_state': by_state,
        }
        serializer = MissingPersonStatsSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['missing-people'])
class MarkAsFoundView(APIView):
    """
    PUT /api/v1/missing-people/<uuid:pk>/mark-found/
    Mark a missing person as found or deceased. Authenticated users only.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=MarkAsFoundSerializer,
        responses={
            200: MissingPersonDetailSerializer,
            400: OpenApiResponse(description='Validation error'),
            404: OpenApiResponse(description='Person not found'),
            409: OpenApiResponse(description='Person already marked as found/deceased'),
        },
        summary='Mark a missing person as found or deceased',
    )
    def put(self, request, pk):
        try:
            person = MissingPerson.objects.get(pk=pk)
        except MissingPerson.DoesNotExist:
            return Response(
                {'detail': 'Persona no encontrada en el registro.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if person.status != 'missing':
            return Response(
                {
                    'detail': f'Esta persona ya está marcada como "{person.get_status_display()}". '
                               'No se puede modificar un registro ya resuelto.'
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = MarkAsFoundSerializer(
            person,
            data=request.data,
            context={'request': request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_person = serializer.save()
        logger.info(
            'Missing person %s (%s) marked as %s by %s',
            person.full_name, person.id, updated_person.status, request.user.email,
        )
        return Response(MissingPersonDetailSerializer(updated_person).data)


@extend_schema(tags=['missing-people'])
class DuplicateCheckView(APIView):
    """
    POST /api/v1/missing-people/check-duplicate/
    Pre-check whether a person is likely already in the missing persons registry.
    Useful to show a warning before the full report submission.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=DuplicateCheckSerializer,
        responses={200: OpenApiResponse(description='Duplicate check result')},
        summary='Check for potential duplicate missing person report',
    )
    def post(self, request):
        serializer = DuplicateCheckSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        from .utils import check_duplicate
        result = check_duplicate(
            full_name=serializer.validated_data['full_name'],
            age=serializer.validated_data['age'],
            cedula=serializer.validated_data.get('cedula'),
        )

        response_data = {
            'is_duplicate': result['is_duplicate'],
            'similarity': result['similarity'],
            'match_reason': result['match_reason'],
        }

        if result['existing_person']:
            person = result['existing_person']
            response_data['existing_person'] = {
                'id': str(person.id),
                'full_name': person.full_name,
                'age': person.age,
                'state_ve': person.state_ve,
                'status': person.status,
                'created_at': person.created_at.isoformat(),
            }
        else:
            response_data['existing_person'] = None

        return Response(response_data)
