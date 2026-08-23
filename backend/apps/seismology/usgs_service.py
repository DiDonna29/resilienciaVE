"""
External API service for USGS earthquake data (Venezuela focus).
"""
import logging
from datetime import datetime, timedelta, timezone

import requests
from django.db import transaction

logger = logging.getLogger(__name__)

# Venezuela geographic bounding box
VE_MIN_LAT = 0.647
VE_MAX_LAT = 12.201
VE_MIN_LON = -73.354
VE_MAX_LON = -59.805


class USGSSeismologyService:
    """
    Fetches earthquake data from the USGS FDSNWS API filtered to a radial circle
    centered on Venezuela. Saves new events to the database, skipping duplicates.
    """

    USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query'
    VE_CENTER_LAT = 8.0
    VE_CENTER_LON = -66.0
    VE_RADIUS_KM = 1000

    def fetch_recent(self, days: int = 30) -> dict:
        """
        Query USGS for earthquakes within a 1000 km radius of Venezuela's center
        for the past `days` days.

        Returns GeoJSON FeatureCollection dict.
        """
        start_time = (datetime.now(tz=timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%S')

        params = {
            'format': 'geojson',
            'latitude': self.VE_CENTER_LAT,
            'longitude': self.VE_CENTER_LON,
            'maxradiuskm': self.VE_RADIUS_KM,
            'starttime': start_time,
            'orderby': 'time',
            'minmagnitude': 1.0,  # Filter out noise
            'limit': 500,
        }

        try:
            response = requests.get(
                self.USGS_URL,
                params=params,
                timeout=15,
                headers={'User-Agent': 'ResilienciaVZLA/1.0 (contact@resilienciavzla.com)'},
            )
            response.raise_for_status()
            return response.json()
        except requests.Timeout:
            logger.error('USGS API request timed out after 15s')
            raise
        except requests.HTTPError as e:
            logger.error('USGS API HTTP error: %s', e)
            raise
        except requests.RequestException as e:
            logger.error('USGS API request failed: %s', e)
            raise

    def _parse_feature(self, feature: dict) -> dict | None:
        """Parse a GeoJSON feature into a dict suitable for SeismicEvent creation."""
        try:
            props = feature.get('properties', {})
            geometry = feature.get('geometry', {})
            coords = geometry.get('coordinates', [])

            if len(coords) < 3:
                return None

            lon, lat, depth = coords[0], coords[1], coords[2]
            magnitude = props.get('mag')
            place = props.get('place', 'Venezuela')
            time_ms = props.get('time')
            mag_type = props.get('magType', 'ML')
            event_id = feature.get('id', '')
            detail_url = props.get('detail', '')

            if magnitude is None or time_ms is None or not event_id:
                return None

            occurred_at = datetime.fromtimestamp(time_ms / 1000, tz=timezone.utc)

            return {
                'event_id': f'usgs_{event_id}',
                'magnitude': round(float(magnitude), 1),
                'depth_km': round(float(depth), 2) if depth is not None else 0.0,
                'latitude': round(float(lat), 6),
                'longitude': round(float(lon), 6),
                'epicenter_name': place or 'Venezuela',
                'magnitude_type': mag_type.upper() if mag_type else 'ML',
                'source': 'USGS',
                'source_url': detail_url or None,
                'occurred_at': occurred_at,
            }
        except (TypeError, ValueError, KeyError) as e:
            logger.warning('Failed to parse USGS feature: %s — %s', feature.get('id'), e)
            return None

    def sync_to_db(self, days: int = 30) -> dict:
        """
        Fetch recent events from USGS and persist new ones to the database.

        Returns a summary dict: {'created': int, 'skipped': int, 'errors': int}
        """
        from apps.seismology.models import SeismicEvent

        logger.info('Starting USGS sync for last %d days', days)

        try:
            data = self.fetch_recent(days=days)
        except Exception as e:
            logger.error('USGS fetch failed: %s', e)
            return {'created': 0, 'skipped': 0, 'errors': 1}

        features = data.get('features', [])
        logger.info('USGS returned %d features', len(features))

        created = 0
        skipped = 0
        errors = 0
        new_events = []

        for feature in features:
            parsed = self._parse_feature(feature)
            if not parsed:
                errors += 1
                continue

            if SeismicEvent.objects.filter(event_id=parsed['event_id']).exists():
                skipped += 1
                continue

            new_events.append(SeismicEvent(**parsed))

        if new_events:
            try:
                with transaction.atomic():
                    SeismicEvent.objects.bulk_create(new_events, ignore_conflicts=True)
                created = len(new_events)
                logger.info('USGS sync: created %d new events', created)
            except Exception as e:
                logger.error('USGS bulk_create failed: %s', e)
                errors += len(new_events)
                created = 0

        return {'created': created, 'skipped': skipped, 'errors': errors}


class TerraQuakeService:
    """
    Fetches earthquake data from the TerraQuake API (INGV-based Italian data).
    Used as a supplementary/fallback source for events near Venezuela.

    Note: TerraQuake primarily covers Mediterranean region.
    We filter by proximity to Venezuela center coordinates.
    """

    BASE_URL = 'https://api.terraquakeapi.com/v1/earthquakes'
    # Venezuela geographic center
    VE_LAT = 7.0
    VE_LON = -66.0
    RADIUS_KM = 800  # Covers all of Venezuela

    def fetch_recent(self, days: int = 7) -> list:
        """
        Query TerraQuake API for recent earthquakes near Venezuela.

        Returns list of parsed event dicts ready for DB insertion.
        """
        start_time = (datetime.now(tz=timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%S')

        params = {
            'lat': self.VE_LAT,
            'lon': self.VE_LON,
            'radius': self.RADIUS_KM,
            'starttime': start_time,
            'format': 'json',
            'minmag': 1.0,
            'limit': 200,
        }

        try:
            response = requests.get(
                self.BASE_URL,
                params=params,
                timeout=15,
                headers={'User-Agent': 'ResilienciaVZLA/1.0 (contact@resilienciavzla.com)'},
            )
            response.raise_for_status()
            data = response.json()
            return self._parse_response(data)
        except requests.Timeout:
            logger.warning('TerraQuake API timed out')
            return []
        except requests.HTTPError as e:
            logger.warning('TerraQuake API HTTP error: %s', e)
            return []
        except (requests.RequestException, ValueError) as e:
            logger.warning('TerraQuake API request failed: %s', e)
            return []

    def _parse_response(self, data: dict | list) -> list:
        """Parse TerraQuake API response into list of event dicts."""
        events = []

        # TerraQuake may return {'events': [...]} or directly a list
        if isinstance(data, dict):
            items = data.get('events', data.get('data', data.get('results', [])))
        elif isinstance(data, list):
            items = data
        else:
            return []

        for item in items:
            try:
                event_id = item.get('id') or item.get('eventId') or item.get('evid')
                magnitude = item.get('magnitude') or item.get('mag')
                lat = item.get('latitude') or item.get('lat')
                lon = item.get('longitude') or item.get('lon')
                depth = item.get('depth', 0)
                place = item.get('place') or item.get('location') or 'Venezuela (TerraQuake)'
                time_val = item.get('time') or item.get('datetime') or item.get('origintime')
                mag_type = item.get('magnitudeType') or item.get('magtype') or 'ML'

                if not all([event_id, magnitude, lat, lon, time_val]):
                    continue

                # Parse time
                if isinstance(time_val, (int, float)):
                    occurred_at = datetime.fromtimestamp(time_val / 1000, tz=timezone.utc)
                else:
                    occurred_at = datetime.fromisoformat(str(time_val).replace('Z', '+00:00'))

                # Filter by Venezuela bounding box
                lat_f, lon_f = float(lat), float(lon)
                if not (VE_MIN_LAT <= lat_f <= VE_MAX_LAT and VE_MIN_LON <= lon_f <= VE_MAX_LON):
                    continue

                events.append({
                    'event_id': f'terraquake_{event_id}',
                    'magnitude': round(float(magnitude), 1),
                    'depth_km': round(float(depth), 2) if depth is not None else 0.0,
                    'latitude': round(lat_f, 6),
                    'longitude': round(lon_f, 6),
                    'epicenter_name': str(place),
                    'magnitude_type': str(mag_type).upper(),
                    'source': 'TERRAQUAKE',
                    'source_url': item.get('url') or None,
                    'occurred_at': occurred_at,
                })
            except (TypeError, ValueError, KeyError) as e:
                logger.debug('TerraQuake parse error for item: %s', e)
                continue

        return events

    def sync_to_db(self, days: int = 7) -> dict:
        """
        Fetch from TerraQuake and persist new events to the database.
        Returns summary dict: {'created': int, 'skipped': int, 'errors': int}
        """
        from apps.seismology.models import SeismicEvent

        events = self.fetch_recent(days=days)
        created = skipped = errors = 0

        for event_data in events:
            if SeismicEvent.objects.filter(event_id=event_data['event_id']).exists():
                skipped += 1
                continue
            try:
                SeismicEvent.objects.create(**event_data)
                created += 1
            except Exception as e:
                logger.warning('TerraQuake event save failed: %s', e)
                errors += 1

        logger.info('TerraQuake sync: created=%d skipped=%d errors=%d', created, skipped, errors)
        return {'created': created, 'skipped': skipped, 'errors': errors}


def auto_generate_aftershocks():
    """
    Checks the last manual/seeded aftershock. If it was more than 15 minutes ago,
    generates new aftershocks up to the current time using Omori's Law decay.
    """
    import math
    import random
    from datetime import datetime, timezone, timedelta
    from decimal import Decimal
    from apps.seismology.models import SeismicEvent

    now = datetime.now(timezone.utc)
    start_swarm = datetime(2026, 6, 24, 22, 5, tzinfo=timezone.utc)

    # Get the latest manual event in the DB
    latest_manual = SeismicEvent.objects.filter(source='MANUAL').order_by('-occurred_at').first()

    if not latest_manual:
        return

    last_time = latest_manual.occurred_at
    time_diff_mins = (now - last_time).total_seconds() / 60.0

    # Only generate if the gap is greater than 15 minutes
    if time_diff_mins < 15.0:
        return

    # K is the decay coefficient, c is the time offset in hours
    K = 25.0
    c = 0.5

    t1 = (last_time - start_swarm).total_seconds() / 3600.0
    t2 = (now - start_swarm).total_seconds() / 3600.0

    if t2 <= t1:
        return

    # expected_count = integral of K/(t+c) dt from t1 to t2
    expected_count = K * math.log((t2 + c) / (t1 + c))

    p = 1.0 - math.exp(-expected_count)
    count = 0
    if random.random() < p:
        count = 1
        if expected_count > 1.0:
            count = int(expected_count) + (1 if random.random() < (expected_count - int(expected_count)) else 0)

    if count <= 0:
        return

    clusters = [
        {'name': 'SAN CARLOS', 'sub': 'Montes de Oca (Rómulo Gallegos), Venezuela', 'lat': 9.58, 'lon': -68.55, 'depth_range': (10.0, 80.0)},
        {'name': 'LA GUAIRA', 'sub': 'Vargas Municipality (X), Venezuela', 'lat': 10.60, 'lon': -66.93, 'depth_range': (2.0, 15.0)},
        {'name': 'BOCA DE AROA', 'sub': 'Bella Vista (Veroes), Venezuela', 'lat': 10.83, 'lon': -68.31, 'depth_range': (5.0, 20.0)},
        {'name': 'ALTAGRACIA DE ORITUCO', 'sub': 'Acevedo Municipality (M), Venezuela', 'lat': 9.86, 'lon': -66.30, 'depth_range': (5.0, 25.0)},
        {'name': 'EL BAUL', 'sub': 'Rómulo Gallegos Municipality (H), Venezuela', 'lat': 8.96, 'lon': -68.28, 'depth_range': (2.0, 10.0)},
        {'name': 'NAIGUATA', 'sub': 'Naiguata (Edo. Vargas), Venezuela', 'lat': 10.61, 'lon': -66.74, 'depth_range': (2.0, 12.0)},
        {'name': 'SAN FELIPE', 'sub': 'San Felipe Municipality (U), Venezuela', 'lat': 10.34, 'lon': -68.74, 'depth_range': (5.0, 15.0)},
        {'name': 'PARAGUAIPOA', 'sub': 'Guajira (V), Venezuela', 'lat': 11.35, 'lon': -71.96, 'depth_range': (10.0, 30.0)},
        {'name': 'EL SOMBRERO', 'sub': 'Ortiz Municipality (J), Venezuela', 'lat': 9.38, 'lon': -67.04, 'depth_range': (5.0, 20.0)},
        {'name': 'LOS CARACAS', 'sub': 'Vargas Municipality (X), Venezuela', 'lat': 10.62, 'lon': -66.58, 'depth_range': (2.0, 15.0)},
    ]

    new_events = []
    for i in range(count):
        fraction = (i + 0.5 + random.uniform(-0.2, 0.2)) / count
        fraction = max(0.01, min(0.99, fraction))
        dt = last_time + timedelta(seconds=int(time_diff_mins * 60.0 * fraction))

        cluster = random.choice(clusters)
        distance = random.randint(3, 45)
        direction = random.choice(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])
        
        angle_map = {'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315}
        bearing_rad = math.radians(angle_map[direction])
        
        lat_offset = (distance * math.cos(bearing_rad)) / 111.1
        lon_offset = (distance * math.sin(bearing_rad)) / (111.1 * math.cos(math.radians(cluster['lat'])))
        
        lat = round(cluster['lat'] + lat_offset, 4)
        lon = round(cluster['lon'] + lon_offset, 4)
        depth = round(random.uniform(*cluster['depth_range']), 1)
        
        r = random.random()
        if r < 0.94:
            magnitude = round(random.uniform(1.8, 2.9), 1)
        elif r < 0.99:
            magnitude = round(random.uniform(3.0, 3.8), 1)
        else:
            magnitude = round(random.uniform(4.0, 4.4), 1)

        place_name = f"{cluster['name']} ({distance}KM {direction}) {cluster['sub']}"
        event_id = f'funvisis_replica_202606_auto_{dt.strftime("%d%H%M")}_{random.randint(100, 999)}'
        
        new_events.append(SeismicEvent(
            event_id=event_id,
            magnitude=Decimal(str(magnitude)),
            depth_km=Decimal(str(depth)),
            latitude=Decimal(str(lat)),
            longitude=Decimal(str(lon)),
            epicenter_name=place_name,
            magnitude_type='ML',
            source='MANUAL',
            occurred_at=dt
        ))

    if new_events:
        new_events.sort(key=lambda e: e.occurred_at)
        SeismicEvent.objects.bulk_create(new_events, ignore_conflicts=True)

