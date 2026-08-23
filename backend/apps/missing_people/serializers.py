"""
Serializers for the missing_people app.
"""
import re
import bleach
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import MissingPerson
from apps.users.serializers import UserPublicSerializer

ALLOWED_TAGS: list[str] = []
ALLOWED_ATTRIBUTES: dict = {}

CEDULA_REGEX = re.compile(r'^[VvEe]-\d{6,9}$')
VENEZUELAN_STATES = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
    'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
    'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
    'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
]


def _clean(value):
    """Strip all HTML/XSS from text fields."""
    if value is None:
        return value
    return bleach.clean(str(value), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True).strip()


class MissingPersonCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for reporting a new missing person.
    Runs duplicate detection before saving.
    """
    force_create = serializers.BooleanField(
        write_only=True,
        default=False,
        help_text='Set True to bypass duplicate warning and force creation.',
    )
    duplicate_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MissingPerson
        fields = [
            'full_name', 'age', 'cedula', 'photo',
            'last_known_latitude', 'last_known_longitude',
            'last_known_location_description', 'state_ve',
            'reporter_phone',
            'force_create', 'duplicate_info',
        ]
        extra_kwargs = {
            'full_name': {'required': True},
            'age': {'required': True},
            'last_known_location_description': {'required': True},
            'state_ve': {'required': True},
            'reporter_phone': {'required': True},
        }

    def get_duplicate_info(self, obj):
        return None  # Only populated on create validation

    def validate_full_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(_('El nombre completo es obligatorio.'))
        return _clean(value)

    def validate_last_known_location_description(self, value):
        return _clean(value)

    def validate_reporter_phone(self, value):
        return _clean(value)

    def validate_state_ve(self, value):
        value = _clean(value)
        if value not in VENEZUELAN_STATES:
            raise serializers.ValidationError(
                _('Estado venezolano inválido. Opciones: ') + ', '.join(VENEZUELAN_STATES)
            )
        return value

    def validate_cedula(self, value):
        if value:
            value = _clean(value.upper())
            if not CEDULA_REGEX.match(value):
                raise serializers.ValidationError(
                    _('La cédula debe tener el formato V-XXXXXXXX o E-XXXXXXXX.')
                )
        return value or None

    def validate_age(self, value):
        if not (0 <= value <= 130):
            raise serializers.ValidationError(_('La edad debe estar entre 0 y 130 años.'))
        return value

    def validate(self, attrs):
        from .utils import check_duplicate

        force_create = attrs.pop('force_create', False)
        full_name = attrs.get('full_name', '')
        age = attrs.get('age', 0)
        cedula = attrs.get('cedula')

        dup_result = check_duplicate(full_name, age, cedula)

        if dup_result['is_duplicate'] and not force_create:
            raise serializers.ValidationError({
                'duplicate': {
                    'is_duplicate': True,
                    'existing_person_id': str(dup_result['existing_person'].id),
                    'existing_person_name': dup_result['existing_person'].full_name,
                    'similarity': dup_result['similarity'],
                    'match_reason': dup_result['match_reason'],
                    'message': (
                        'Se encontró un registro similar. '
                        'Si desea continuar de todas formas, envíe force_create=true.'
                    ),
                }
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop('force_create', None)
        user = self.context['request'].user if self.context.get('request') else None
        return MissingPerson.objects.create(
            reported_by=user,
            **validated_data,
        )


class MissingPersonListSerializer(serializers.ModelSerializer):
    """Compact serializer for list endpoint — minimal public fields."""

    reporter_whatsapp_link = serializers.ReadOnlyField()

    class Meta:
        model = MissingPerson
        fields = [
            'id', 'full_name', 'age', 'photo',
            'state_ve', 'status',
            'last_known_location_description',
            'reporter_phone', 'reporter_whatsapp_link',
            'created_at',
        ]
        read_only_fields = fields


class MissingPersonDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer including reporter and locator info."""

    reported_by = UserPublicSerializer(read_only=True)
    located_by = UserPublicSerializer(read_only=True)
    reporter_whatsapp_link = serializers.ReadOnlyField()

    class Meta:
        model = MissingPerson
        fields = [
            'id', 'full_name', 'age', 'cedula', 'photo',
            'last_known_latitude', 'last_known_longitude',
            'last_known_location_description', 'state_ve',
            'status',
            'reported_by', 'reporter_phone', 'reporter_whatsapp_link',
            'located_by', 'located_at',
            'found_condition', 'found_location_type', 'found_location_description',
            'locator_phone',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class MarkAsFoundSerializer(serializers.Serializer):
    """
    Serializer for marking a missing person as found/deceased.
    All 'found' fields are required when marking as found.
    """
    status = serializers.ChoiceField(choices=['found', 'deceased'])
    found_condition = serializers.ChoiceField(
        choices=['safe', 'injured', 'deceased', 'unknown'],
        required=True,
    )
    found_location_type = serializers.ChoiceField(
        choices=['hospital', 'shelter', 'risk_zone', 'home', 'other'],
        required=True,
    )
    found_location_description = serializers.CharField(max_length=500)
    locator_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_found_location_description(self, value):
        return _clean(value)

    def validate_locator_phone(self, value):
        if value:
            return _clean(value)
        return value

    def update(self, instance, validated_data):
        instance.status = validated_data['status']
        instance.found_condition = validated_data['found_condition']
        instance.found_location_type = validated_data['found_location_type']
        instance.found_location_description = validated_data['found_location_description']
        instance.locator_phone = validated_data.get('locator_phone')
        instance.located_at = timezone.now()
        instance.located_by = self.context['request'].user
        instance.save()
        return instance


class DuplicateCheckSerializer(serializers.Serializer):
    """Input serializer for the pre-check duplicate detection endpoint."""
    full_name = serializers.CharField(max_length=200)
    age = serializers.IntegerField(min_value=0, max_value=130)
    cedula = serializers.CharField(max_length=15, required=False, allow_blank=True)

    def validate_full_name(self, value):
        return _clean(value)

    def validate_cedula(self, value):
        if value:
            value = _clean(value.upper())
            if not CEDULA_REGEX.match(value):
                raise serializers.ValidationError(
                    _('Formato de cédula inválido. Use V-XXXXXXXX o E-XXXXXXXX.')
                )
        return value or None


class MissingPersonStatsSerializer(serializers.Serializer):
    """Response serializer for the stats endpoint."""
    total = serializers.IntegerField()
    missing = serializers.IntegerField()
    found = serializers.IntegerField()
    deceased = serializers.IntegerField()
    last_updated = serializers.DateTimeField(allow_null=True)
    by_state = serializers.DictField(child=serializers.IntegerField())
