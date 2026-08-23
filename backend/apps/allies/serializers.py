import bleach
from rest_framework import serializers
from .models import AllyProfile
from apps.users.serializers import UserPublicSerializer

class AllyProfileListSerializer(serializers.ModelSerializer):
    registered_by = UserPublicSerializer(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = AllyProfile
        fields = [
            'id', 'name', 'type', 'type_display', 'description', 'contact_info',
            'services_offered', 'logo', 'is_active', 'registered_by', 'created_at'
        ]

class AllyProfileDetailSerializer(serializers.ModelSerializer):
    registered_by = UserPublicSerializer(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = AllyProfile
        fields = '__all__'

class AllyProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllyProfile
        fields = [
            'name', 'type', 'description', 'contact_info',
            'services_offered', 'logo', 'active_until'
        ]

    def validate_name(self, value):
        return bleach.clean(value.strip())

    def validate_description(self, value):
        return bleach.clean(value.strip())

    def validate_contact_info(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Debe ser un objeto JSON.")
        cleaned_info = {}
        for k, v in value.items():
            if isinstance(v, str):
                cleaned_info[bleach.clean(k)] = bleach.clean(v.strip())
            else:
                cleaned_info[bleach.clean(k)] = v
        return cleaned_info

    def validate_services_offered(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Debe ser una lista de servicios u ofrecimientos.")
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
