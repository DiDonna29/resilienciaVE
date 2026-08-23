"""
Views for the seismology app.
"""
import logging
from datetime import datetime, timedelta, timezone

from django.db.models import Max, Count, Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import SeismicEvent
from .serializers import SeismicEventSerializer, SeismicEventListSerializer, SeismicEventStatsSerializer
from shared.permissions import IsSuperAdmin
from shared.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)


@extend_schema(tags=['seismology'])
class SeismicEventListView(APIView):
    """
    GET /api/v1/seismology/events/
    List seismic events. Public access. Filterable, paginated.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter('min_magnitude', float, description='Minimum magnitude filter'),
            OpenApiParameter('max_magnitude', float, description='Maximum magnitude filter'),
            OpenApiParameter('source', str, description='Data source: USGS, TERRAQUAKE, MANUAL'),
            OpenApiParameter('days', int, description='Events from last N days (default 30)'),
            OpenApiParameter('event_type', str, description='sismo, temblor, or terremoto'),
            OpenApiParameter('date', str, description='Date in YYYY-MM-DD format'),
            OpenApiParameter('all', bool, description='If true, returns all results without pagination'),
        ],
        responses={200: SeismicEventListSerializer(many=True)},
        summary='List seismic events in Venezuela',
    )
    def get(self, request):
        try:
            from .usgs_service import auto_generate_aftershocks
            auto_generate_aftershocks()
        except Exception as e:
            logger.warning("Auto generating aftershocks failed: %s", e)

        queryset = SeismicEvent.objects.all()

        # Magnitude filter
        min_mag = request.query_params.get('min_magnitude')
        if min_mag:
            try:
                queryset = queryset.filter(magnitude__gte=float(min_mag))
            except ValueError:
                pass

        max_mag = request.query_params.get('max_magnitude')
        if max_mag:
            try:
                queryset = queryset.filter(magnitude__lte=float(max_mag))
            except ValueError:
                pass

        # Date filter
        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(occurred_at__date=target_date)
            except ValueError:
                pass

        # Source filter
        source = request.query_params.get('source', '').upper()
        if source in ('USGS', 'TERRAQUAKE', 'MANUAL'):
            queryset = queryset.filter(source=source)

        # Days filter
        days = request.query_params.get('days')
        if days:
            try:
                days_int = int(days)
                since = datetime.now(tz=timezone.utc) - timedelta(days=days_int)
                queryset = queryset.filter(occurred_at__gte=since)
            except ValueError:
                pass

        # Event type filter (computed property — filter by magnitude ranges)
        event_type = request.query_params.get('event_type', '').lower()
        if event_type == 'sismo':
            queryset = queryset.filter(magnitude__lt=3.0)
        elif event_type == 'temblor':
            queryset = queryset.filter(magnitude__gte=3.0, magnitude__lt=5.0)
        elif event_type == 'terremoto':
            queryset = queryset.filter(magnitude__gte=5.0)

        # Bypassing pagination if all=true is specified
        if request.query_params.get('all') == 'true':
            serializer = SeismicEventListSerializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'total_pages': 1,
                'current_page': 1,
                'next': None,
                'previous': None,
                'results': serializer.data
            })

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = SeismicEventListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=['seismology'])
class SeismicEventDetailView(APIView):
    """
    GET /api/v1/seismology/events/<uuid:pk>/
    Retrieve full details of a single seismic event. Public access.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            200: SeismicEventSerializer,
            404: OpenApiResponse(description='Event not found'),
        },
        summary='Get seismic event details',
    )
    def get(self, request, pk):
        try:
            event = SeismicEvent.objects.get(pk=pk)
        except SeismicEvent.DoesNotExist:
            return Response({'detail': 'Evento sísmico no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SeismicEventSerializer(event)
        return Response(serializer.data)


@extend_schema(tags=['seismology'])
class SeismicEventStatsView(APIView):
    """
    GET /api/v1/seismology/stats/
    Aggregated seismic statistics for Venezuela. Public access.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: SeismicEventStatsSerializer},
        summary='Get seismic statistics for Venezuela',
    )
    def get(self, request):
        try:
            from .usgs_service import auto_generate_aftershocks
            auto_generate_aftershocks()
        except Exception as e:
            logger.warning("Auto generating aftershocks failed: %s", e)

        now = datetime.now(tz=timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)

        total = SeismicEvent.objects.count()
        events_today = SeismicEvent.objects.filter(occurred_at__gte=today_start).count()
        events_this_week = SeismicEvent.objects.filter(occurred_at__gte=week_start).count()
        largest = SeismicEvent.objects.aggregate(max_mag=Max('magnitude'))['max_mag']
        latest = SeismicEvent.objects.order_by('-occurred_at').first()

        # By type distribution
        by_type = {
            'sismo': SeismicEvent.objects.filter(magnitude__lt=3.0).count(),
            'temblor': SeismicEvent.objects.filter(magnitude__gte=3.0, magnitude__lt=5.0).count(),
            'terremoto': SeismicEvent.objects.filter(magnitude__gte=5.0).count(),
        }

        # By alert level
        by_alert_level = {
            'green': SeismicEvent.objects.filter(magnitude__lt=3.0).count(),
            'yellow': SeismicEvent.objects.filter(magnitude__gte=3.0, magnitude__lt=4.0).count(),
            'orange': SeismicEvent.objects.filter(magnitude__gte=4.0, magnitude__lt=5.0).count(),
            'red': SeismicEvent.objects.filter(magnitude__gte=5.0).count(),
        }

        data = {
            'total_events': total,
            'events_today': events_today,
            'events_this_week': events_this_week,
            'largest_magnitude': largest,
            'latest_event': SeismicEventSerializer(latest).data if latest else None,
            'by_type': by_type,
            'by_alert_level': by_alert_level,
        }

        serializer = SeismicEventStatsSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['seismology'])
class SeismicEventSyncView(APIView):
    """
    POST /api/v1/seismology/sync/
    Manually trigger a seismic data sync from USGS and TerraQuake. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        request={'application/json': {'type': 'object', 'properties': {'days': {'type': 'integer', 'default': 30}}}},
        responses={
            202: OpenApiResponse(description='Sync task queued'),
        },
        summary='[SuperAdmin] Manually trigger seismic data sync',
    )
    def post(self, request):
        days = request.data.get('days', 30)
        try:
            days = int(days)
            if not (1 <= days <= 365):
                raise ValueError()
        except (TypeError, ValueError):
            return Response(
                {'detail': 'El parámetro "days" debe ser un entero entre 1 y 365.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .tasks import full_historical_sync
        task = full_historical_sync.delay(days=days)

        logger.info('Manual seismic sync triggered by %s (task_id=%s, days=%d)', request.user.email, task.id, days)
        return Response(
            {
                'detail': f'Sincronización iniciada para los últimos {days} días.',
                'task_id': str(task.id),
            },
            status=status.HTTP_202_ACCEPTED,
        )
