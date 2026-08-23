"""
Views for the users app.
"""
import logging
import requests
from datetime import datetime, timezone

from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import IntegrityError

from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    GoogleAuthSerializer,
    SuperAdminUserListSerializer,
    VerifyUserFlagSerializer,
    VerificationRequestSerializer,
)
from shared.permissions import IsSuperAdmin, IsAdminOrSuperAdmin
from shared.throttles import AuthThrottle, SensitiveOpThrottle, StandardUserThrottle

User = get_user_model()
logger = logging.getLogger(__name__)


def _build_token_response(user) -> dict:
    """Generate JWT token pair and compose the full auth response."""
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token

    return {
        'access': str(access),
        'refresh': str(refresh),
        'access_expiration': datetime.fromtimestamp(access['exp'], tz=timezone.utc).isoformat(),
        'refresh_expiration': datetime.fromtimestamp(refresh['exp'], tz=timezone.utc).isoformat(),
        'user': UserProfileSerializer(user).data,
    }


@extend_schema(tags=['auth'])
class RegisterView(APIView):
    """
    POST /api/v1/auth/register/
    Register a new CITIZEN user and return JWT tokens.
    """
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    @extend_schema(
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiResponse(description='User registered successfully with JWT tokens'),
            400: OpenApiResponse(description='Validation error'),
        },
        summary='Register a new citizen user',
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = serializer.save()
        except IntegrityError as e:
            logger.warning('Registration IntegrityError: %s', e)
            return Response(
                {'detail': 'Ya existe un usuario con ese correo o cédula.'},
                status=status.HTTP_409_CONFLICT,
            )

        logger.info('New user registered: %s (id=%s)', user.email, user.id)
        return Response(_build_token_response(user), status=status.HTTP_201_CREATED)


@extend_schema(tags=['auth'])
class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticate with email/password and return JWT tokens.
    """
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    @extend_schema(
        request=UserLoginSerializer,
        responses={
            200: OpenApiResponse(description='Login successful with JWT tokens'),
            400: OpenApiResponse(description='Invalid credentials'),
        },
        summary='Login with email and password',
    )
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        logger.info('User logged in: %s', user.email)
        return Response(_build_token_response(user), status=status.HTTP_200_OK)


@extend_schema(tags=['auth'])
class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklist the provided refresh token to invalidate the session.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={'application/json': {'type': 'object', 'properties': {'refresh': {'type': 'string'}}}},
        responses={
            204: OpenApiResponse(description='Logged out successfully'),
            400: OpenApiResponse(description='Invalid or expired token'),
        },
        summary='Logout and blacklist refresh token',
    )
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'El token de actualización es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info('User logged out: %s', request.user.email)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['auth'])
class GoogleAuthView(APIView):
    """
    POST /api/v1/auth/google/
    Exchange a Google OAuth access token for platform JWT tokens.
    Creates or retrieves the user via Google profile data.
    """
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
    GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

    @extend_schema(
        request=GoogleAuthSerializer,
        responses={
            200: OpenApiResponse(description='Google auth successful'),
            400: OpenApiResponse(description='Invalid Google token'),
        },
        summary='Authenticate with Google OAuth (id_token or access_token)',
    )
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        credential = serializer.validated_data.get('credential', '')
        access_token = serializer.validated_data.get('access_token', '')

        google_data = {}

        if credential:
            # Verify id_token via Google's tokeninfo endpoint
            try:
                resp = requests.get(
                    self.GOOGLE_TOKENINFO_URL,
                    params={'id_token': credential},
                    timeout=10,
                )
                resp.raise_for_status()
                google_data = resp.json()
                if 'error' in google_data:
                    raise ValueError(google_data.get('error_description', 'Invalid token'))
            except (requests.RequestException, ValueError) as e:
                logger.warning('Google id_token verification failed: %s', e)
                return Response(
                    {'detail': 'No se pudo verificar el token de Google. Por favor intente de nuevo.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif access_token:
            # Legacy: verify access_token via userinfo endpoint
            try:
                resp = requests.get(
                    self.GOOGLE_USERINFO_URL,
                    headers={'Authorization': f'Bearer {access_token}'},
                    timeout=10,
                )
                resp.raise_for_status()
                google_data = resp.json()
            except requests.RequestException as e:
                logger.warning('Google access_token verification failed: %s', e)
                return Response(
                    {'detail': 'No se pudo verificar el token de Google. Por favor intente de nuevo.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        google_id = google_data.get('sub')
        email = google_data.get('email', '').lower()
        first_name = google_data.get('given_name', '') or google_data.get('name', '').split()[0] if google_data.get('name') else ''
        last_name = google_data.get('family_name', '') or (' '.join(google_data.get('name', '').split()[1:]) if google_data.get('name') else '')

        if not google_id or not email:
            return Response(
                {'detail': 'El token de Google no contiene información de usuario válida.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check email_verified
        email_verified = google_data.get('email_verified', False)
        if isinstance(email_verified, str):
            email_verified = email_verified.lower() == 'true'
        if not email_verified:
            return Response(
                {'detail': 'El correo de Google no está verificado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create user
        try:
            user = User.objects.get(google_id=google_id)
        except User.DoesNotExist:
            try:
                # Existing manual user with same email → link Google
                user = User.objects.get(email=email)
                user.google_id = google_id
                user.auth_provider = 'google'
                user.save(update_fields=['google_id', 'auth_provider', 'updated_at'])
            except User.DoesNotExist:
                # Create brand-new user
                user = User.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    google_id=google_id,
                    auth_provider='google',
                    role='CITIZEN',
                )
                logger.info('New Google user created: %s', email)

        if not user.is_active:
            return Response(
                {'detail': 'Esta cuenta ha sido desactivada.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        logger.info('Google user logged in: %s', email)
        return Response(_build_token_response(user), status=status.HTTP_200_OK)


@extend_schema(tags=['auth'])
class UserProfileView(APIView):
    """
    GET  /api/v1/auth/profile/  → Retrieve own profile
    PUT  /api/v1/auth/profile/  → Update own profile
    PATCH /api/v1/auth/profile/ → Partially update own profile
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: UserProfileSerializer},
        summary='Get own user profile',
    )
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
        summary='Update own user profile',
    )
    def put(self, request):
        return self._update(request, partial=False)

    @extend_schema(
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
        summary='Partially update own user profile',
    )
    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


@extend_schema(tags=['admin'])
class SuperAdminUserListView(APIView):
    """
    GET /api/v1/admin-panel/users/
    List all platform users with verification flags. SuperAdmin only.
    Supports filtering by role, is_active, and text search.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    throttle_classes = [StandardUserThrottle]

    @extend_schema(
        parameters=[
            OpenApiParameter('role', str, description='Filter by role (SUPERADMIN, CITIZEN)'),
            OpenApiParameter('is_active', bool, description='Filter by active status'),
            OpenApiParameter('search', str, description='Search by name, email, or cedula'),
        ],
        responses={200: SuperAdminUserListSerializer(many=True)},
        summary='[SuperAdmin] List all users',
    )
    def get(self, request):
        queryset = User.objects.all().order_by('-date_joined')

        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(cedula__icontains=search)
            )

        from shared.pagination import StandardResultsSetPagination
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = SuperAdminUserListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=['admin'])
class VerifyUserFlagView(APIView):
    """
    PUT /api/v1/admin-panel/users/<uuid:user_id>/verify/
    Assign or revoke a verification flag for a user. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    throttle_classes = [SensitiveOpThrottle]

    @extend_schema(
        request=VerifyUserFlagSerializer,
        responses={
            200: UserProfileSerializer,
            404: OpenApiResponse(description='User not found'),
        },
        summary='[SuperAdmin] Assign/revoke verification flag',
    )
    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'ADMIN' and user.role in ['ADMIN', 'SUPERADMIN']:
            return Response(
                {'detail': 'Los administradores no pueden modificar a otros administradores o SuperAdmins.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = VerifyUserFlagSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.update(user, serializer.validated_data)
        logger.info(
            'SuperAdmin %s set %s=%s for user %s',
            request.user.email,
            serializer.validated_data['flag'],
            serializer.validated_data['value'],
            user.email,
        )
        return Response(UserProfileSerializer(user).data)


@extend_schema(tags=['admin'])
class DeactivateUserView(APIView):
    """
    POST /api/v1/admin-panel/users/<uuid:user_id>/deactivate/
    Deactivate or reactivate a user account. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]
    throttle_classes = [SensitiveOpThrottle]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'SUPERADMIN' and user != request.user:
            return Response(
                {'detail': 'No se puede desactivar a otro SuperAdmin.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.user.role == 'ADMIN' and user.role in ['ADMIN', 'SUPERADMIN']:
            return Response(
                {'detail': 'Los administradores no pueden desactivar a otros administradores o SuperAdmins.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.is_active = not user.is_active
        user.save(update_fields=['is_active', 'updated_at'])
        action = 'activado' if user.is_active else 'desactivado'
        logger.info('SuperAdmin %s %s user %s', request.user.email, action, user.email)
        return Response({'detail': f'Usuario {action} exitosamente.', 'is_active': user.is_active})

@extend_schema(tags=['admin'])
class ToggleAdminRoleView(APIView):
    """
    POST /api/v1/admin-panel/users/<uuid:user_id>/toggle-admin/
    Promote or demote a user to/from ADMIN. SuperAdmin only.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    throttle_classes = [SensitiveOpThrottle]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if user.role == 'SUPERADMIN':
            return Response(
                {'detail': 'No se puede modificar a un SuperAdmin.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.role == 'ADMIN':
            user.role = 'CITIZEN'
        else:
            user.role = 'ADMIN'
            
        user.save(update_fields=['role', 'updated_at'])
        action = 'promovido a ADMIN' if user.role == 'ADMIN' else 'revocado de ADMIN'
        logger.info('SuperAdmin %s %s user %s', request.user.email, action, user.email)
        return Response({'detail': f'Usuario {action} exitosamente.', 'role': user.role})


from .models import VerificationRequest
from rest_framework.parsers import MultiPartParser, FormParser

@extend_schema(tags=['auth'])
class VerificationRequestView(APIView):
    """
    GET /api/v1/auth/verification-request/
    POST /api/v1/auth/verification-request/
    Submit or list manual verification requests.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        responses={200: VerificationRequestSerializer(many=True)},
        summary='List user verification requests',
    )
    def get(self, request):
        requests = VerificationRequest.objects.filter(user=request.user)
        serializer = VerificationRequestSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        request=VerificationRequestSerializer,
        responses={
            201: VerificationRequestSerializer,
            400: OpenApiResponse(description='Validation error or already pending'),
        },
        summary='Submit a verification request',
    )
    def post(self, request):
        serializer = VerificationRequestSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from .serializers import PasswordRecoverySerializer

@extend_schema(tags=['auth'])
class PasswordRecoveryView(APIView):
    """
    POST /api/v1/auth/password-recovery/
    Recover password by providing email and cedula.
    """
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

    @extend_schema(
        request=PasswordRecoverySerializer,
        responses={
            200: OpenApiResponse(description='Password updated successfully'),
            400: OpenApiResponse(description='Validation error or invalid credentials'),
        },
        summary='Recover password',
    )
    def post(self, request):
        serializer = PasswordRecoverySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        new_password = serializer.validated_data['new_password']
        
        user.set_password(new_password)
        user.save(update_fields=['password', 'updated_at'])
        
        logger.info('User recovered password: %s', user.email)
        return Response({'detail': 'Contraseña actualizada exitosamente.'}, status=status.HTTP_200_OK)

class VerificationRequestAdminListView(APIView):
    """
    GET /api/v1/auth/admin/verification-requests/
    List all verification requests for SuperAdmins.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: VerificationRequestSerializer(many=True)},
        summary='List all verification requests (Admin)',
    )
    def get(self, request):
        if request.user.role not in ['SUPERADMIN', 'ADMIN']:
            return Response({'detail': 'Acceso denegado.'}, status=status.HTTP_403_FORBIDDEN)
            
        requests = VerificationRequest.objects.all().order_by('-created_at')
        serializer = VerificationRequestSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data)

from drf_spectacular.utils import inline_serializer
from rest_framework import serializers

class ReviewVerificationRequestView(APIView):
    """
    POST /api/v1/auth/admin/verification-requests/<id>/review/
    Approve or reject a verification request.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=inline_serializer(
            name='ReviewVerificationRequest',
            fields={
                'status': serializers.ChoiceField(choices=['approved', 'rejected']),
                'admin_notes': serializers.CharField(required=False, allow_blank=True)
            }
        ),
        responses={200: VerificationRequestSerializer()},
        summary='Review a verification request (Admin)',
    )
    def post(self, request, request_id):
        if request.user.role not in ['SUPERADMIN', 'ADMIN']:
            return Response({'detail': 'Acceso denegado.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            ver_req = VerificationRequest.objects.get(id=request_id)
        except VerificationRequest.DoesNotExist:
            return Response({'detail': 'Solicitud no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
            
        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')
        
        if new_status not in ['approved', 'rejected']:
            return Response({'detail': 'Estado inválido.'}, status=status.HTTP_400_BAD_REQUEST)
            
        ver_req.status = new_status
        ver_req.admin_notes = admin_notes
        ver_req.save(update_fields=['status', 'admin_notes', 'updated_at'])
        
        # If approved, update user flags
        if new_status == 'approved':
            user = ver_req.user
            if ver_req.role_requested == 'health_worker':
                user.is_verified_health_worker = True
            elif ver_req.role_requested == 'shelter_manager':
                user.is_verified_shelter_manager = True
            elif ver_req.role_requested == 'org_donor':
                user.is_verified_org_donor = True
            user.save(update_fields=[
                'is_verified_health_worker', 
                'is_verified_shelter_manager', 
                'is_verified_org_donor', 
                'updated_at'
            ])
            
        serializer = VerificationRequestSerializer(ver_req, context={'request': request})
        return Response(serializer.data)
