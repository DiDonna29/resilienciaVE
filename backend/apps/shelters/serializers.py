import bleach
from rest_framework import serializers
from .models import Shelter
from apps.users.serializers import UserPublicSerializer

class ShelterListSerializer(serializers.ModelSerializer):
    registered_by = UserPublicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Shelter
        fields = [
            'id', 'name', 'type', 'type_display', 'status', 'status_display',
            'current_capacity', 'max_capacity', 'latitude', 'longitude', 'state_ve',
            'registered_by', 'updated_at'
        ]

class ShelterDetailSerializer(serializers.ModelSerializer):
    registered_by = UserPublicSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Shelter
        fields = '__all__'

class ShelterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelter
        fields = [
            'name', 'type', 'latitude', 'longitude', 'address', 'state_ve',
            'status', 'current_capacity', 'max_capacity', 'missing_supplies'
        ]

    def validate_name(self, value):
        return bleach.clean(value.strip())

    def validate_address(self, value):
        return bleach.clean(value.strip())

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

class ShelterCapacityUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelter
        fields = ['status', 'current_capacity', 'max_capacity']

    def validate(self, attrs):
        current_capacity = attrs.get('current_capacity', self.instance.current_capacity if self.instance else 0)
        max_capacity = attrs.get('max_capacity', self.instance.max_capacity if self.instance else 0)
        if current_capacity < 0:
            raise serializers.ValidationError({'current_capacity': "La capacidad actual no puede ser negativa."})
        if max_capacity < 0:
            raise serializers.ValidationError({'max_capacity': "La capacidad máxima no puede ser negativa."})
        if current_capacity > max_capacity:
            raise serializers.ValidationError({'current_capacity': "La capacidad actual no puede superar la capacidad máxima."})
        return attrs

class ShelterSuppliesSerializer(serializers.Serializer):
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
