"""
Serializers for the rescue_zones app.
"""
import bleach
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from .models import RescueZone, VolunteerRequest
from apps.users.serializers import UserPublicSerializer

ALLOWED_TAGS: list[str] = []
ALLOWED_ATTRIBUTES: dict = {}

VENEZUELAN_STATES = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
    'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
    'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
    'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
]


def _clean(value):
    if value is None:
        return value
    return bleach.clean(str(value), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True).strip()


class RescueZoneCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new rescue zone report."""

    class Meta:
        model = RescueZone
        fields = [
            'name', 'description', 'latitude', 'longitude', 'state_ve',
            'risk_type', 'technical_needs', 'missing_supplies', 'volunteers_needed',
        ]

    def validate_name(self, value):
        return _clean(value)

    def validate_description(self, value):
        return _clean(value)

    def validate_state_ve(self, value):
        value = _clean(value)
        if value not in VENEZUELAN_STATES:
            raise serializers.ValidationError(_('Estado venezolano inválido.'))
        return value

    def validate_technical_needs(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(_('technical_needs debe ser una lista.'))
        return [_clean(item) for item in value if isinstance(item, str)]

    def validate_missing_supplies(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(_('missing_supplies debe ser una lista.'))
        return [_clean(item) for item in value if isinstance(item, str)]

    def validate_volunteers_needed(self, value):
        if value < 0:
            raise serializers.ValidationError(_('volunteers_needed no puede ser negativo.'))
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        return RescueZone.objects.create(reported_by=user, **validated_data)


class RescueZoneListSerializer(serializers.ModelSerializer):
    """Compact serializer for list endpoint."""

    risk_type_display = serializers.CharField(source='get_risk_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RescueZone
        fields = [
            'id', 'name', 'latitude', 'longitude', 'state_ve',
            'risk_type', 'risk_type_display',
            'status', 'status_display',
            'volunteers_needed', 'created_at',
        ]
        read_only_fields = fields


class RescueZoneDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for rescue zone."""

    reported_by = UserPublicSerializer(read_only=True)
    risk_type_display = serializers.CharField(source='get_risk_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    volunteer_count = serializers.SerializerMethodField()

    class Meta:
        model = RescueZone
        fields = [
            'id', 'name', 'description',
            'latitude', 'longitude', 'state_ve',
            'risk_type', 'risk_type_display',
            'technical_needs', 'missing_supplies', 'volunteers_needed',
            'status', 'status_display',
            'reported_by', 'volunteer_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_volunteer_count(self, obj):
        return obj.volunteer_requests.count()


class RescueZoneStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating zone status (SuperAdmin only)."""
    status = serializers.ChoiceField(choices=['active', 'attended', 'closed'])

    def update(self, instance, validated_data):
        instance.status = validated_data['status']
        instance.save(update_fields=['status', 'updated_at'])
        return instance


class SupplyUpdateSerializer(serializers.Serializer):
    """Serializer for adding a supply to missing_supplies list."""
    supply = serializers.CharField(max_length=200)

    def validate_supply(self, value):
        return _clean(value)


class VolunteerRequestSerializer(serializers.ModelSerializer):
    """Serializer for volunteer requests."""

    volunteer = UserPublicSerializer(read_only=True)

    class Meta:
        model = VolunteerRequest
        fields = ['id', 'zone', 'volunteer', 'message', 'created_at']
        read_only_fields = ['id', 'volunteer', 'created_at']

    def validate_message(self, value):
        return _clean(value)

    def create(self, validated_data):
        user = self.context['request'].user
        return VolunteerRequest.objects.create(volunteer=user, **validated_data)
