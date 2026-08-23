import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import AllyProfile
from .serializers import (
    AllyProfileListSerializer,
    AllyProfileDetailSerializer,
    AllyProfileCreateSerializer,
)
from shared.permissions import IsSuperAdmin, IsOwnerOrSuperAdmin
from shared.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)

@extend_schema(tags=['allies'])
class AllyProfileListView(APIView):
    """
    GET  /api/v1/allies/  — List all active allies (public)
    POST /api/v1/allies/  — Create an ally profile (authenticated)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        parameters=[
            OpenApiParameter('type', str, description='company, brand, donor, individual'),
            OpenApiParameter('search', str, description='Search by name or description'),
        ],
        responses={200: AllyProfileListSerializer(many=True)},
        summary='List active allies with filters',
    )
    def get(self, request):
        queryset = AllyProfile.objects.select_related('registered_by').filter(is_active=True)

        type_filter = request.query_params.get('type')
        if type_filter in [choice[0] for choice in AllyProfile.TYPE_CHOICES]:
            queryset = queryset.filter(type=type_filter)

        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                models.Q(name__icontains=search_query) |
                models.Q(description__icontains=search_query)
            )

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AllyProfileListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        request=AllyProfileCreateSerializer,
        responses={201: AllyProfileDetailSerializer},
        summary='Create a new ally or donator profile',
    )
    def post(self, request):
        serializer = AllyProfileCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        profile = serializer.save()
        logger.info('Ally profile created: %s by user %s', profile.name, request.user.email)
        return Response(AllyProfileDetailSerializer(profile).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['allies'])
class AllyProfileDetailView(APIView):
    """
    GET    /api/v1/allies/<uuid:pk>/  — Get profile details (public)
    PUT/PATCH /api/v1/allies/<uuid:pk>/  — Update profile (Owner or SuperAdmin)
    DELETE /api/v1/allies/<uuid:pk>/  — Deactivate profile (Owner or SuperAdmin)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsOwnerOrSuperAdmin()]

    @extend_schema(
        responses={200: AllyProfileDetailSerializer},
        summary='Get details of an ally profile',
    )
    def get(self, request, pk):
        try:
            profile = AllyProfile.objects.select_related('registered_by').get(pk=pk)
        except AllyProfile.DoesNotExist:
            return Response({'detail': 'Perfil de aliado no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AllyProfileDetailSerializer(profile).data)

    @extend_schema(
        request=AllyProfileCreateSerializer,
        responses={200: AllyProfileDetailSerializer},
        summary='Update an ally profile',
    )
    def patch(self, request, pk):
        try:
            profile = AllyProfile.objects.get(pk=pk)
        except AllyProfile.DoesNotExist:
            return Response({'detail': 'Perfil de aliado no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, profile)

        serializer = AllyProfileCreateSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        updated = serializer.save()
        logger.info('Ally profile updated: %s', updated.name)
        return Response(AllyProfileDetailSerializer(updated).data)

    @extend_schema(
        responses={204: OpenApiResponse(description='Profile deactivated successfully')},
        summary='Deactivate (delete) an ally profile',
    )
    def delete(self, request, pk):
        try:
            profile = AllyProfile.objects.get(pk=pk)
        except AllyProfile.DoesNotExist:
            return Response({'detail': 'Perfil de aliado no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, profile)

        profile.is_active = False
        profile.save()
        logger.info('Ally profile deactivated: %s by user %s', profile.name, request.user.email)
        return Response(status=status.HTTP_204_NO_CONTENT)
