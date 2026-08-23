import bleach
from rest_framework import serializers
from .models import CrisisResource
from apps.users.serializers import UserPublicSerializer

# Simple list of offensive words for moderation
BAD_WORDS = [
    'mierda', 'puta', 'puto', 'marico', 'marica', 'huevon', 'guevon',
    'maldito', 'maldita', 'coño', 'cabron', 'mamaguevo', 'mamawebo',
    'webo', 'guebo', 'singar', 'joder', 'bicho', 'bicha'
]

def check_profanity(text):
    text_lower = text.lower()
    found_bad_words = []
    for word in BAD_WORDS:
        if word in text_lower:
            found_bad_words.append(word)
    return found_bad_words

class CrisisResourceListSerializer(serializers.ModelSerializer):
    submitted_by = UserPublicSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = CrisisResource
        fields = [
            'id', 'name', 'url', 'social_network', 'description', 'screenshot',
            'category', 'category_display', 'submitted_by', 'created_at'
        ]

class CrisisResourceDetailSerializer(serializers.ModelSerializer):
    submitted_by = UserPublicSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = CrisisResource
        fields = '__all__'

class CrisisResourceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrisisResource
        fields = [
            'name', 'url', 'social_network', 'description', 'screenshot', 'category'
        ]

    def validate_name(self, value):
        return bleach.clean(value.strip())

    def validate_social_network(self, value):
        if value:
            return bleach.clean(value.strip())
        return value

    def validate_description(self, value):
        return bleach.clean(value.strip())

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        
        name = validated_data.get('name', '')
        description = validated_data.get('description', '')
        
        # Check profanity
        flags = []
        flags.extend(check_profanity(name))
        flags.extend(check_profanity(description))
        
        # Unique list of flags
        flags = list(set(flags))
        
        validated_data['submitted_by'] = user
        validated_data['moderation_flags'] = flags
        
        # Auto approve only if no bad words were found
        validated_data['is_approved'] = len(flags) == 0
        
        return super().create(validated_data)
