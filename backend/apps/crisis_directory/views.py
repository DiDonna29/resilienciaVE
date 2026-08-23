import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import CrisisResource
from .serializers import (
    CrisisResourceListSerializer,
    CrisisResourceDetailSerializer,
    CrisisResourceCreateSerializer,
)
from shared.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)

@extend_schema(tags=['crisis-directory'])
class CrisisResourceListView(APIView):
    """
    GET  /api/v1/crisis-directory/  — List all approved crisis resources (public)
    POST /api/v1/crisis-directory/  — Submit a new resource (authenticated)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        parameters=[
            OpenApiParameter('category', str, description='app, website, social, ngo, other'),
        ],
        responses={200: CrisisResourceListSerializer(many=True)},
        summary='List all approved crisis resources',
    )
    def get(self, request):
        queryset = CrisisResource.objects.select_related('submitted_by').filter(is_approved=True)

        category_filter = request.query_params.get('category')
        if category_filter in [choice[0] for choice in CrisisResource.CATEGORY_CHOICES]:
            queryset = queryset.filter(category=category_filter)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = CrisisResourceListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        request=CrisisResourceCreateSerializer,
        responses={201: CrisisResourceDetailSerializer},
        summary='Submit a new crisis resource (auto-moderated)',
    )
    def post(self, request):
        serializer = CrisisResourceCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        resource = serializer.save()
        
        if resource.is_approved:
            logger.info('Crisis resource submitted and auto-approved: %s by %s', resource.name, request.user.email)
            return Response(CrisisResourceDetailSerializer(resource).data, status=status.HTTP_201_CREATED)
        else:
            logger.warning('Crisis resource submitted and flagged for moderation: %s by %s (Flags: %s)', 
                           resource.name, request.user.email, resource.moderation_flags)
            return Response(
                {
                    'message': 'El recurso ha sido registrado pero requiere revisión de moderación debido a palabras detectadas.',
                    'resource': CrisisResourceDetailSerializer(resource).data
                },
                status=status.HTTP_202_ACCEPTED
            )


@extend_schema(tags=['crisis-directory'])
class CrisisResourceDetailView(APIView):
    """
    GET /api/v1/crisis-directory/<uuid:pk>/ — Get detail of approved resource (public)
    """
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: CrisisResourceDetailSerializer},
        summary='Get details of an approved crisis resource',
    )
    def get(self, request, pk):
        try:
            # Only allow public view if it is approved
            resource = CrisisResource.objects.select_related('submitted_by').get(pk=pk, is_approved=True)
        except CrisisResource.DoesNotExist:
            return Response({'detail': 'Recurso no encontrado o pendiente de moderación.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CrisisResourceDetailSerializer(resource).data)
