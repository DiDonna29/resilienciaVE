"""
Celery tasks for the seismology app.
Syncs seismic events from USGS every 60 seconds and pushes WebSocket notifications.
"""
import json
import logging
from datetime import datetime, timezone, timedelta

from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


@shared_task(
    name='apps.seismology.tasks.sync_seismic_events',
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    soft_time_limit=55,
    time_limit=60,
)
def sync_seismic_events(self):
    """
    Periodic task: fetch recent seismic events from USGS, persist new ones,
    and broadcast any new events via Django Channels WebSocket.

    Runs every 60 seconds via Celery Beat.
    """
    from apps.seismology.usgs_service import USGSSeismologyService
    from apps.seismology.models import SeismicEvent
    from apps.seismology.serializers import SeismicEventSerializer

    logger.info('sync_seismic_events: starting USGS sync')

    try:
        service = USGSSeismologyService()
        # Only fetch last 1 day for frequent polling (full 30-day sync on startup)
        result = service.sync_to_db(days=1)
        logger.info('USGS sync result: %s', result)

        if result['created'] > 0:
            # Fetch newly created events (last 1 hour of inserts)
            recent_threshold = datetime.now(tz=timezone.utc) - timedelta(hours=1)
            new_events = SeismicEvent.objects.filter(
                created_at__gte=recent_threshold,
                source='USGS',
            ).order_by('-occurred_at')[:result['created']]

            # Push each new event via WebSocket
            channel_layer = get_channel_layer()
            if channel_layer is not None:
                for event in new_events:
                    event_data = SeismicEventSerializer(event).data
                    # Convert Decimal fields to float for JSON serialization
                    serializable_data = {
                        k: float(v) if hasattr(v, '__float__') else v
                        for k, v in event_data.items()
                    }
                    try:
                        async_to_sync(channel_layer.group_send)(
                            'seismic_events',
                            {
                                'type': 'seismic_event_message',
                                'data': {
                                    'event': serializable_data,
                                    'action': 'new_seismic_event',
                                    'timestamp': datetime.now(tz=timezone.utc).isoformat(),
                                },
                            }
                        )
                        logger.debug('WebSocket push: event %s (M%s)', event.event_id, event.magnitude)
                    except Exception as ws_err:
                        logger.warning('WebSocket push failed for event %s: %s', event.event_id, ws_err)
            else:
                logger.warning('Channel layer not available — WebSocket push skipped')

        return result

    except Exception as exc:
        logger.error('sync_seismic_events failed: %s', exc, exc_info=True)
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error('sync_seismic_events: max retries exceeded')
            return {'created': 0, 'skipped': 0, 'errors': 1}


@shared_task(
    name='apps.seismology.tasks.full_historical_sync',
    bind=True,
    max_retries=1,
    soft_time_limit=600,
    time_limit=660,
)
def full_historical_sync(self, days: int = 30):
    """
    One-off task: fetch the past N days of seismic data from USGS.
    Also tries TerraQuake as a supplementary source.
    Typically triggered once at startup or manually via the SuperAdmin panel.
    """
    from apps.seismology.usgs_service import USGSSeismologyService, TerraQuakeService

    logger.info('full_historical_sync: syncing last %d days', days)

    usgs = USGSSeismologyService()
    usgs_result = usgs.sync_to_db(days=days)
    logger.info('Historical USGS result: %s', usgs_result)

    tq = TerraQuakeService()
    tq_result = tq.sync_to_db(days=min(days, 7))
    logger.info('Historical TerraQuake result: %s', tq_result)

    return {
        'usgs': usgs_result,
        'terraquake': tq_result,
        'total_created': usgs_result['created'] + tq_result['created'],
    }
