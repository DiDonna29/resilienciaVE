import bleach
from rest_framework import serializers
from .models import HealthCenter
from apps.users.serializers import UserPublicSerializer

class HealthCenterListSerializer(serializers.ModelSerializer):
    registered_by = UserPublicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = HealthCenter
        fields = [
            'id', 'name', 'type', 'type_display', 'status', 'status_display',
            'is_attending', 'latitude', 'longitude', 'state_ve', 'contact_phone',
            'registered_by', 'updated_at'
        ]

class HealthCenterDetailSerializer(serializers.ModelSerializer):
    registered_by = UserPublicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = HealthCenter
        fields = '__all__'

class HealthCenterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthCenter
        fields = [
            'name', 'type', 'latitude', 'longitude', 'address', 'state_ve',
            'status', 'is_attending', 'missing_supplies', 'contact_phone', 'contact_email'
        ]

    def validate_name(self, value):
        return bleach.clean(value.strip())

    def validate_address(self, value):
        return bleach.clean(value.strip())

    def validate_contact_phone(self, value):
        return bleach.clean(value.strip())

    def validate_contact_email(self, value):
        if value:
            return bleach.clean(value.strip())
        return value

    def validate_missing_supplies(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Debe ser una lista de insumos.")
        cleaned_list = []
        for item in value:
            if isinstance(item, str):
                cleaned_item = bleach.clean(item.strip())
                if cleaned_item:
                    cleaned_list.append(cleaned_item)
        return cleaned_list

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['registered_by'] = request.user
        return super().create(validated_data)

class HealthCenterStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthCenter
        fields = ['status', 'is_attending']

    def validate_status(self, value):
        if value not in [choice[0] for choice in HealthCenter.STATUS_CHOICES]:
            raise serializers.ValidationError("Estado inválido.")
        return value

class HealthCenterSuppliesSerializer(serializers.Serializer):
    missing_supplies = serializers.ListField(
        child=serializers.CharField(max_length=100),
        allow_empty=True
    )

    def validate_missing_supplies(self, value):
        cleaned_list = []
        for item in value:
            cleaned_item = bleach.clean(item.strip())
            if cleaned_item:
                cleaned_list.append(cleaned_item)
        return cleaned_list

    def update(self, instance, validated_data):
        instance.missing_supplies = validated_data.get('missing_supplies', instance.missing_supplies)
        instance.save()
        return instance
