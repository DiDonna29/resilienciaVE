"""
Serializers for the seismology app.
"""
import bleach
from rest_framework import serializers
from .models import SeismicEvent

ALLOWED_TAGS: list[str] = []
ALLOWED_ATTRIBUTES: dict = {}


def _clean(value):
    if value is None:
        return value
    return bleach.clean(str(value), tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True).strip()


class SeismicEventSerializer(serializers.ModelSerializer):
    """Full serializer for seismic events — public read access."""

    event_type = serializers.ReadOnlyField()
    is_significant = serializers.ReadOnlyField()
    alert_level = serializers.ReadOnlyField()

    class Meta:
        model = SeismicEvent
        fields = [
            'id', 'event_id',
            'magnitude', 'magnitude_type', 'depth_km',
            'latitude', 'longitude', 'epicenter_name',
            'event_type', 'is_significant', 'alert_level',
            'source', 'source_url',
            'occurred_at', 'created_at',
        ]
        read_only_fields = fields


class SeismicEventListSerializer(serializers.ModelSerializer):
    """Compact serializer for list view to reduce payload size."""

    event_type = serializers.ReadOnlyField()
    alert_level = serializers.ReadOnlyField()

    class Meta:
        model = SeismicEvent
        fields = [
            'id', 'magnitude', 'magnitude_type',
            'latitude', 'longitude', 'epicenter_name',
            'event_type', 'alert_level',
            'depth_km', 'source', 'occurred_at',
        ]
        read_only_fields = fields


class SeismicEventStatsSerializer(serializers.Serializer):
    """Response serializer for the stats endpoint."""

    total_events = serializers.IntegerField()
    events_today = serializers.IntegerField()
    events_this_week = serializers.IntegerField()
    largest_magnitude = serializers.DecimalField(max_digits=4, decimal_places=1, allow_null=True)
    latest_event = SeismicEventSerializer(allow_null=True)
    by_type = serializers.DictField(child=serializers.IntegerField())
    by_alert_level = serializers.DictField(child=serializers.IntegerField())
