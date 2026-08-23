import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Shelter
from .serializers import (
    ShelterListSerializer,
    ShelterDetailSerializer,
    ShelterCreateSerializer,
    ShelterCapacityUpdateSerializer,
    ShelterSuppliesSerializer,
)
from shared.permissions import IsSuperAdmin, IsOwnerOrSuperAdmin, IsVerifiedShelterManager
from shared.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)

@extend_schema(tags=['shelters'])
class ShelterListView(APIView):
    """
    GET  /api/v1/shelters/  — List shelters (public)
    POST /api/v1/shelters/  — Register a new shelter (authenticated)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        parameters=[
            OpenApiParameter('status', str, description='open, full, closed'),
            OpenApiParameter('type', str, description='hotel, camp, open_area, community_center, other'),
            OpenApiParameter('state_ve', str, description='Venezuelan state name'),
        ],
        responses={200: ShelterListSerializer(many=True)},
        summary='List all shelters with optional filters',
    )
    def get(self, request):
        queryset = Shelter.objects.select_related('registered_by').all()

        status_filter = request.query_params.get('status')
        if status_filter in [choice[0] for choice in Shelter.STATUS_CHOICES]:
            queryset = queryset.filter(status=status_filter)

        type_filter = request.query_params.get('type')
        if type_filter in [choice[0] for choice in Shelter.TYPE_CHOICES]:
            queryset = queryset.filter(type=type_filter)

        state = request.query_params.get('state_ve', '').strip()
        if state:
            queryset = queryset.filter(state_ve__iexact=state)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ShelterListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        request=ShelterCreateSerializer,
        responses={201: ShelterDetailSerializer},
        summary='Register a new shelter',
    )
    def post(self, request):
        serializer = ShelterCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        shelter = serializer.save()
        logger.info('Shelter registered: %s by user %s', shelter.name, request.user.email)
        return Response(ShelterDetailSerializer(shelter).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['shelters'])
class ShelterDetailView(APIView):
    """
    GET   /api/v1/shelters/<uuid:pk>/  — Get shelter details (public)
    PATCH /api/v1/shelters/<uuid:pk>/  — Update shelter status & capacity (SuperAdmin/Owner)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsOwnerOrSuperAdmin()]

    @extend_schema(
        responses={200: ShelterDetailSerializer},
        summary='Get details of a specific shelter',
    )
    def get(self, request, pk):
        try:
            shelter = Shelter.objects.select_related('registered_by').get(pk=pk)
        except Shelter.DoesNotExist:
            return Response({'detail': 'Refugio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ShelterDetailSerializer(shelter).data)

    @extend_schema(
        request=ShelterCapacityUpdateSerializer,
        responses={200: ShelterDetailSerializer},
        summary='Update capacity and status of a shelter',
    )
    def patch(self, request, pk):
        try:
            shelter = Shelter.objects.get(pk=pk)
        except Shelter.DoesNotExist:
            return Response({'detail': 'Refugio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, shelter)

        serializer = ShelterCapacityUpdateSerializer(shelter, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        logger.info('Shelter updated: %s. Status: %s, Capacity: %s/%s', updated.name, updated.status, updated.current_capacity, updated.max_capacity)
        return Response(ShelterDetailSerializer(updated).data)


@extend_schema(tags=['shelters'])
class ShelterSuppliesUpdateView(APIView):
    """
    PUT /api/v1/shelters/<uuid:pk>/supplies/  — Update list of missing supplies (Owner, ShelterManager, or SuperAdmin)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ShelterSuppliesSerializer,
        responses={200: ShelterDetailSerializer},
        summary='Update the list of missing supplies for a shelter',
    )
    def put(self, request, pk):
        try:
            shelter = Shelter.objects.get(pk=pk)
        except Shelter.DoesNotExist:
            return Response({'detail': 'Refugio no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions: must be Owner, SuperAdmin or Verified Shelter Manager
        is_owner = shelter.registered_by == request.user
        is_super = request.user.role == 'SUPERADMIN'
        is_manager = request.user.is_verified_shelter_manager
        
        if not (is_owner or is_super or is_manager):
            return Response(
                {'detail': 'No tienes permisos para modificar los insumos de este refugio.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ShelterSuppliesSerializer(shelter, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        return Response(ShelterDetailSerializer(updated).data)
