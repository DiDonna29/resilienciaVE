"""
Views for the rescue_zones app.
"""
import logging
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import RescueZone, VolunteerRequest
from .serializers import (
    RescueZoneCreateSerializer,
    RescueZoneListSerializer,
    RescueZoneDetailSerializer,
    RescueZoneStatusUpdateSerializer,
    SupplyUpdateSerializer,
    VolunteerRequestSerializer,
)
from shared.permissions import IsSuperAdmin, IsOwnerOrSuperAdmin
from shared.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)


@extend_schema(tags=['rescue-zones'])
class RescueZoneListView(APIView):
    """
    GET  /api/v1/rescue-zones/  — List rescue zones (public)
    POST /api/v1/rescue-zones/  — Report a new rescue zone (authenticated)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        parameters=[
            OpenApiParameter('status', str, description='active, attended, closed'),
            OpenApiParameter('risk_type', str, description='collapse, landslide, flood, fire, other'),
            OpenApiParameter('state_ve', str, description='Venezuelan state name'),
        ],
        responses={200: RescueZoneListSerializer(many=True)},
        summary='List rescue zones',
    )
    def get(self, request):
        queryset = RescueZone.objects.select_related('reported_by').all()

        status_filter = request.query_params.get('status')
        if status_filter in ('active', 'attended', 'closed'):
            queryset = queryset.filter(status=status_filter)

        risk_type = request.query_params.get('risk_type')
        if risk_type in ('collapse', 'landslide', 'flood', 'fire', 'other'):
            queryset = queryset.filter(risk_type=risk_type)

        state = request.query_params.get('state_ve', '').strip()
        if state:
            queryset = queryset.filter(state_ve__iexact=state)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = RescueZoneListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        request=RescueZoneCreateSerializer,
        responses={201: RescueZoneDetailSerializer},
        summary='Report a new rescue zone',
    )
    def post(self, request):
        serializer = RescueZoneCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        zone = serializer.save()
        logger.info('Rescue zone reported: %s by %s', zone.name, request.user.email)
        return Response(RescueZoneDetailSerializer(zone).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['rescue-zones'])
class RescueZoneDetailView(APIView):
    """
    GET   /api/v1/rescue-zones/<uuid:pk>/  — Get zone details (public)
    PATCH /api/v1/rescue-zones/<uuid:pk>/  — Update status (SuperAdmin only)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsSuperAdmin()]

    @extend_schema(
        responses={200: RescueZoneDetailSerializer},
        summary='Get rescue zone details',
    )
    def get(self, request, pk):
        try:
            zone = RescueZone.objects.select_related('reported_by').prefetch_related('volunteer_requests').get(pk=pk)
        except RescueZone.DoesNotExist:
            return Response({'detail': 'Zona de rescate no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(RescueZoneDetailSerializer(zone).data)

    @extend_schema(
        request=RescueZoneStatusUpdateSerializer,
        responses={200: RescueZoneDetailSerializer},
        summary='[SuperAdmin] Update rescue zone status',
    )
    def patch(self, request, pk):
        try:
            zone = RescueZone.objects.get(pk=pk)
        except RescueZone.DoesNotExist:
            return Response({'detail': 'Zona de rescate no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RescueZoneStatusUpdateSerializer(zone, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        return Response(RescueZoneDetailSerializer(updated).data)


@extend_schema(tags=['rescue-zones'])
class AddSupplyView(APIView):
    """
    POST /api/v1/rescue-zones/<uuid:pk>/supplies/
    Add a needed supply to a rescue zone. Authenticated users.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=SupplyUpdateSerializer,
        responses={200: RescueZoneDetailSerializer},
        summary='Add a needed supply to a rescue zone',
    )
    def post(self, request, pk):
        try:
            zone = RescueZone.objects.get(pk=pk)
        except RescueZone.DoesNotExist:
            return Response({'detail': 'Zona de rescate no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SupplyUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        supply = serializer.validated_data['supply']
        if supply not in zone.missing_supplies:
            zone.missing_supplies.append(supply)
            zone.save(update_fields=['missing_supplies', 'updated_at'])

        return Response(RescueZoneDetailSerializer(zone).data)


@extend_schema(tags=['rescue-zones'])
class VolunteerRequestView(APIView):
    """
    POST /api/v1/rescue-zones/<uuid:pk>/volunteer/
    Offer to volunteer at a rescue zone. Authenticated users.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=VolunteerRequestSerializer,
        responses={
            201: VolunteerRequestSerializer,
            409: OpenApiResponse(description='Already volunteered for this zone'),
        },
        summary='Offer to volunteer at a rescue zone',
    )
    def post(self, request, pk):
        try:
            zone = RescueZone.objects.get(pk=pk)
        except RescueZone.DoesNotExist:
            return Response({'detail': 'Zona de rescate no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if VolunteerRequest.objects.filter(zone=zone, volunteer=request.user).exists():
            return Response(
                {'detail': 'Ya te has registrado como voluntario en esta zona.'},
                status=status.HTTP_409_CONFLICT,
            )

        data = {'zone': str(zone.id), 'message': request.data.get('message', '')}
        serializer = VolunteerRequestSerializer(data=data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        vol_req = serializer.save()
        return Response(VolunteerRequestSerializer(vol_req).data, status=status.HTTP_201_CREATED)
