"""
Serializers for the users app.
"""
import re
import bleach
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
from .models import VerificationRequest

# Venezuelan cedula/RIF regex: V, E, J, G, P, C followed by 6-9 digits, and optional -digit
CEDULA_REGEX = re.compile(r'^[VvEeJjGgPpCc]-\d{6,9}(?:-\d)?$')

ALLOWED_TAGS: list[str] = []  # No HTML allowed in any field
ALLOWED_ATTRIBUTES: dict = {}


def _clean(value: str) -> str:
    """Strip all HTML tags and sanitize text with bleach."""
    if value is None:
        return value
    return bleach.clean(str(value), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True).strip()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for registering a new CITIZEN user."""

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name',
            'cedula', 'phone_number',
            'password', 'password_confirm',
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        return _clean(value.lower())

    def validate_first_name(self, value):
        val = _clean(value)
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$', val):
            raise serializers.ValidationError(_("El nombre solo puede contener letras y espacios."))
        return val

    def validate_last_name(self, value):
        val = _clean(value)
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$', val):
            raise serializers.ValidationError(_("El apellido solo puede contener letras y espacios."))
        return val

    def validate_phone_number(self, value):
        if value:
            return _clean(value)
        return value

    def validate_cedula(self, value):
        if value:
            value = _clean(value.upper())
            if not CEDULA_REGEX.match(value):
                raise serializers.ValidationError(
                    _('Documento inválido. Formatos válidos: V-12345678, E-12345678, J-12345678-9, etc.')
                )
        return value or None

    def validate(self, attrs):
        password = attrs.get('password')
        password_confirm = attrs.pop('password_confirm', None)

        if password != password_confirm:
            raise serializers.ValidationError(
                {'password_confirm': _('Las contraseñas no coinciden.')}
            )

        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$', password):
            raise serializers.ValidationError(
                {'password': _('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')}
            )

        try:
            validate_password(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})

        # Fuzzy Matching for Cedula and Name
        cedula = attrs.get('cedula')
        if cedula:
            from django.contrib.postgres.search import TrigramSimilarity
            from django.db.models.functions import Concat
            from django.db.models import Value
            
            existing_user = User.objects.filter(cedula=cedula).first()
            if existing_user:
                full_name = f"{attrs.get('first_name', '')} {attrs.get('last_name', '')}".strip()
                match = User.objects.annotate(
                    sim_name=TrigramSimilarity(
                        Concat('first_name', Value(' '), 'last_name'),
                        full_name
                    )
                ).filter(id=existing_user.id, sim_name__gt=0.9).first()
                
                if match:
                    raise serializers.ValidationError(
                        {'cedula': _('Esta cuenta ya existe y coincide con su identidad. Por favor inicie sesión o recupere su contraseña.')}
                    )
                else:
                    raise serializers.ValidationError(
                        {'cedula': _('Esta cédula ya se encuentra registrada y pertenece a otro usuario.')}
                    )

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            auth_provider='manual',
            role='CITIZEN',
            **validated_data,
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for email/password login, returns JWT tokens."""

    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    def validate_email(self, value):
        return _clean(value.lower())

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                _('Credenciales inválidas. Por favor verifique su correo y contraseña.')
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                _('Credenciales inválidas. Por favor verifique su correo y contraseña.')
            )

        if not user.is_active:
            raise serializers.ValidationError(
                _('Esta cuenta ha sido desactivada. Contacte al administrador.')
            )

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Full user profile serializer for authenticated users viewing/editing their own profile."""

    full_name = serializers.ReadOnlyField()
    whatsapp_link = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'cedula', 'phone_number', 'whatsapp_link',
            'role', 'auth_provider', 'google_id',
            'is_verified_health_worker', 'is_verified_shelter_manager', 'is_verified_org_donor', 'is_verified_web_collaborator',
            'is_active', 'date_joined', 'updated_at',
        ]
        read_only_fields = [
            'id', 'email', 'role', 'auth_provider', 'google_id',
            'is_verified_health_worker', 'is_verified_shelter_manager', 'is_verified_org_donor', 'is_verified_web_collaborator',
            'is_active', 'date_joined', 'updated_at',
            'full_name', 'whatsapp_link',
        ]

    def validate_first_name(self, value):
        val = _clean(value)
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$', val):
            raise serializers.ValidationError(_("El nombre solo puede contener letras y espacios."))
        return val

    def validate_last_name(self, value):
        val = _clean(value)
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$', val):
            raise serializers.ValidationError(_("El apellido solo puede contener letras y espacios."))
        return val

    def validate_phone_number(self, value):
        if value:
            return _clean(value)
        return value

    def validate_cedula(self, value):
        if value:
            value = _clean(value.upper())
            if not CEDULA_REGEX.match(value):
                raise serializers.ValidationError(
                    _('Documento inválido. Formatos válidos: V-12345678, E-12345678, J-12345678-9, etc.')
                )
        return value or None

    def validate(self, attrs):
        cedula = attrs.get('cedula')
        if cedula:
            from django.contrib.postgres.search import TrigramSimilarity
            from django.db.models.functions import Concat
            from django.db.models import Value
            
            # Exclude current user from the check
            existing_user = User.objects.filter(cedula=cedula).exclude(id=self.instance.id if self.instance else None).first()
            if existing_user:
                first_name = attrs.get('first_name', self.instance.first_name if self.instance else '')
                last_name = attrs.get('last_name', self.instance.last_name if self.instance else '')
                full_name = f"{first_name} {last_name}".strip()
                
                match = User.objects.annotate(
                    sim_name=TrigramSimilarity(
                        Concat('first_name', Value(' '), 'last_name'),
                        full_name
                    )
                ).filter(id=existing_user.id, sim_name__gt=0.9).first()
                
                if match:
                    raise serializers.ValidationError(
                        {'cedula': _('Esta cuenta ya existe y coincide con su identidad. Por favor inicie sesión o comuníquese con soporte para unificar cuentas.')}
                    )
                else:
                    raise serializers.ValidationError(
                        {'cedula': _('Esta cédula ya se encuentra registrada y pertenece a otro usuario.')}
                    )
        return attrs


class UserPublicSerializer(serializers.ModelSerializer):
    """Safe public serializer - only exposes non-sensitive fields."""

    full_name = serializers.ReadOnlyField()
    whatsapp_link = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'whatsapp_link',
            'is_verified_health_worker', 'is_verified_shelter_manager', 'is_verified_org_donor',
        ]


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth token exchange.

    Accepts either:
    - credential: id_token from Google Identity Services (One Tap / Sign In With Google)
    - access_token: legacy OAuth2 access token
    """

    credential = serializers.CharField(required=False, allow_blank=True, default='')
    access_token = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        credential = (attrs.get('credential') or '').strip()
        access_token = (attrs.get('access_token') or '').strip()
        if not credential and not access_token:
            raise serializers.ValidationError(
                'Se requiere credential (id_token) o access_token de Google.'
            )
        attrs['credential'] = _clean(credential) if credential else ''
        attrs['access_token'] = _clean(access_token) if access_token else ''
        return attrs


class SuperAdminUserListSerializer(serializers.ModelSerializer):
    """Serializer for SuperAdmin user listing with all verification flags."""

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name',
            'cedula', 'phone_number', 'role', 'auth_provider',
            'is_verified_health_worker', 'is_verified_shelter_manager', 'is_verified_org_donor', 'is_verified_web_collaborator',
            'is_active', 'is_staff', 'date_joined', 'updated_at',
        ]
        read_only_fields = fields


class VerifyUserFlagSerializer(serializers.Serializer):
    """Serializer for SuperAdmin to assign/revoke verification flags."""

    VALID_FLAGS = [
        'is_verified_health_worker',
        'is_verified_shelter_manager',
        'is_verified_org_donor',
        'is_verified_web_collaborator',
    ]

    flag = serializers.ChoiceField(choices=VALID_FLAGS)
    value = serializers.BooleanField()

    def update(self, instance, validated_data):
        flag = validated_data['flag']
        value = validated_data['value']
        setattr(instance, flag, value)
        instance.save(update_fields=[flag, 'updated_at'])
        return instance


class TokenResponseSerializer(serializers.Serializer):
    """Response serializer for login/register endpoints returning JWT tokens."""

    access = serializers.CharField()
    refresh = serializers.CharField()
    access_expiration = serializers.DateTimeField()
    refresh_expiration = serializers.DateTimeField()
    user = UserProfileSerializer()

class VerificationRequestSerializer(serializers.ModelSerializer):
    """Serializer for manual verification requests."""
    class Meta:
        model = VerificationRequest
        fields = [
            'id', 'user', 'role_requested', 'document',
            'status', 'admin_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'admin_notes', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        # Users can only have one pending request per role
        role_requested = validated_data['role_requested']
        if VerificationRequest.objects.filter(user=user, role_requested=role_requested, status='pending').exists():
            raise serializers.ValidationError(
                _('Ya tienes una solicitud pendiente para este rol.')
            )
        return VerificationRequest.objects.create(user=user, **validated_data)

class PasswordRecoverySerializer(serializers.Serializer):
    """Serializer for password recovery via email and cedula."""

    email = serializers.EmailField()
    cedula = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_email(self, value):
        return _clean(value.lower())

    def validate_cedula(self, value):
        if value:
            value = _clean(value.upper())
            if not CEDULA_REGEX.match(value):
                raise serializers.ValidationError(
                    _('Documento inválido. Formatos válidos: V-12345678, E-12345678, J-12345678-9, etc.')
                )
        return value

    def validate(self, attrs):
        email = attrs.get('email')
        cedula = attrs.get('cedula')
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')

        if new_password != new_password_confirm:
            raise serializers.ValidationError(
                {'new_password_confirm': _('Las contraseñas no coinciden.')}
            )

        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$', new_password):
            raise serializers.ValidationError(
                {'new_password': _('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')}
            )

        try:
            validate_password(new_password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'new_password': list(e.messages)})

        try:
            user = User.objects.get(email=email, cedula=cedula)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                _('No se encontró ninguna cuenta que coincida con este correo y cédula/RIF.')
            )

        if not user.is_active:
            raise serializers.ValidationError(
                _('Esta cuenta ha sido desactivada. Contacte al administrador.')
            )

        attrs['user'] = user
        return attrs
