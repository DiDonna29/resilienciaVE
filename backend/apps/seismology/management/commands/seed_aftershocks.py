import random
import math
from datetime import datetime, timezone, timedelta
from django.core.management.base import BaseCommand
from decimal import Decimal
from apps.seismology.models import SeismicEvent

class Command(BaseCommand):
    help = 'Seeds realistic aftershocks for the June 24, 2026 Venezuelan earthquake swarm.'

    def handle(self, *args, **options):
        # 1. Clear previous seeded aftershocks
        deleted_count, _ = SeismicEvent.objects.filter(source='MANUAL').delete()
        self.stdout.write(self.style.WARNING(f'Cleared {deleted_count} existing manual/seeded events.'))

        # 2. Historical/Background clusters
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

        now = datetime.now(timezone.utc)
        start_swarm = datetime(2026, 6, 24, 22, 5, tzinfo=timezone.utc)

        events_to_create = []

        # 3. Seed historical events using Omori's law (June 24 to June 29 23:59:59)
        june30_start = datetime(2026, 6, 30, 0, 0, tzinfo=timezone.utc)
        t_max_historical = (june30_start - start_swarm).total_seconds() / 3600.0

        random.seed(42)
        total_historical = 290
        c_param = 0.5

        for i in range(total_historical):
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
            
            U = random.random()
            t_hours = c_param * (((1.0 + t_max_historical / c_param) ** U) - 1.0)
            dt = start_swarm + timedelta(hours=t_hours)

            # Cap just in case
            if dt >= june30_start:
                dt = june30_start - timedelta(seconds=random.randint(10, 3600))
            
            place_name = f"{cluster['name']} ({distance}KM {direction}) {cluster['sub']}"
            event_id = f'funvisis_replica_202606_{dt.strftime("%d%H%M")}_{i:03d}'
            
            events_to_create.append(SeismicEvent(
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

        # 4. Seed 33 exact events for today (June 30, 2026)
        today_events = [
            # Exact events from screenshot
            {'time': '2026-06-30T13:58:00', 'name': 'NAIGUATA (6KM W)', 'sub': 'Caraballeda (Vargas), Venezuela', 'mag': 2.2, 'depth': 6.0, 'lat': 10.600, 'lon': -66.930},
            {'time': '2026-06-30T12:29:00', 'name': 'NAIGUATA (10KM SW)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.0, 'depth': 6.8, 'lat': 10.5997, 'lon': -66.8297},
            {'time': '2026-06-30T12:25:00', 'name': 'SAN CARLOS (34KM SW)', 'sub': 'Municipio San Carlos (H), Venezuela', 'mag': 2.3, 'depth': 15.0, 'lat': 9.400, 'lon': -68.800},
            {'time': '2026-06-30T11:56:00', 'name': 'SAN CARLOS (31KM SE)', 'sub': 'Montes de Oca (Rómulo Gallegos), Venezuela', 'mag': 2.6, 'depth': 73.3, 'lat': 9.390, 'lon': -68.490},
            {'time': '2026-06-30T11:18:00', 'name': 'LA GUAIRA (10KM E)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.1, 'depth': 3.0, 'lat': 10.600, 'lon': -66.838},
            {'time': '2026-06-30T11:10:00', 'name': 'BOCA AROA (21KM SW)', 'sub': 'Municipio Silva (I), Venezuela', 'mag': 2.2, 'depth': 12.0, 'lat': 10.680, 'lon': -68.450},
            {'time': '2026-06-30T11:04:00', 'name': 'ALTAGRACIA DE ORITUCO (27KM NW)', 'sub': 'Acevedo Municipality (M), Venezuela', 'mag': 2.2, 'depth': 15.0, 'lat': 10.050, 'lon': -66.450},
            {'time': '2026-06-30T10:52:00', 'name': 'EL BAUL (32KM NW)', 'sub': 'Rómulo Gallegos Municipality (H), Venezuela', 'mag': 2.4, 'depth': 6.0, 'lat': 9.150, 'lon': -68.450},
            {'time': '2026-06-30T10:37:00', 'name': 'EL BAUL (41KM SW)', 'sub': 'Ricaurte Municipality (H), Venezuela', 'mag': 2.2, 'depth': 8.0, 'lat': 8.700, 'lon': -68.550},
            {'time': '2026-06-30T10:31:00', 'name': 'EL BAUL (34KM E)', 'sub': 'Pao de San Juan Bautista Municipality (H), Venezuela', 'mag': 2.3, 'depth': 5.0, 'lat': 8.960, 'lon': -67.970},
            {'time': '2026-06-30T10:13:00', 'name': 'NAIGUATA (7KM SW)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.8, 'depth': 12.0, 'lat': 10.560, 'lon': -66.790},
            {'time': '2026-06-30T09:51:00', 'name': 'PARAGUAIPOA (75KM NE)', 'sub': 'Guajira (V), Venezuela', 'mag': 3.3, 'depth': 22.0, 'lat': 11.850, 'lon': -71.450},
            {'time': '2026-06-30T09:04:00', 'name': 'NAIGUATA (4KM NW)', 'sub': 'Naiguata (Edo. Vargas), Venezuela', 'mag': 3.1, 'depth': 10.0, 'lat': 10.640, 'lon': -66.770},
            {'time': '2026-06-30T08:57:00', 'name': 'SAN FELIPE (16KM E)', 'sub': 'Guarataro (Veroes), Venezuela', 'mag': 2.4, 'depth': 14.0, 'lat': 10.340, 'lon': -68.590},
            {'time': '2026-06-30T08:35:00', 'name': 'NAIGUATA (6KM W)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.5, 'depth': 6.0, 'lat': 10.610, 'lon': -66.790},
            {'time': '2026-06-30T08:05:00', 'name': 'LOS CARACAS (7KM NW)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.2, 'depth': 12.0, 'lat': 10.670, 'lon': -66.630},
            {'time': '2026-06-30T07:59:00', 'name': 'EL SOMBRERO (29KM NW)', 'sub': 'Ortiz Municipality (J), Venezuela', 'mag': 2.1, 'depth': 20.0, 'lat': 9.550, 'lon': -67.220},
            {'time': '2026-06-30T07:46:00', 'name': 'NAIGUATA (5KM NW)', 'sub': 'Estado La Guaira, Venezuela', 'mag': 2.5, 'depth': 8.0, 'lat': 10.640, 'lon': -66.780},
            {'time': '2026-06-30T07:45:00', 'name': 'LA GUAIRA (6KM SW)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.0, 'depth': 10.0, 'lat': 10.560, 'lon': -66.970},
            {'time': '2026-06-30T07:39:00', 'name': 'BOCA DE AROA (32KM SW)', 'sub': 'Bella Vista (Veroes), Venezuela', 'mag': 2.8, 'depth': 18.0, 'lat': 10.620, 'lon': -68.520},
            {'time': '2026-06-30T07:05:00', 'name': 'LA GUAIRA (23KM W)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.5, 'depth': 14.0, 'lat': 10.600, 'lon': -67.140},
            {'time': '2026-06-30T06:47:00', 'name': 'SAN FELIPE (29KM NE)', 'sub': 'San Felipe Municipality (U), Venezuela', 'mag': 3.1, 'depth': 12.0, 'lat': 10.510, 'lon': -68.550},
            {'time': '2026-06-30T05:59:00', 'name': 'SAN FELIPE (14KM NE)', 'sub': 'San Felipe Municipality (U), Venezuela', 'mag': 2.5, 'depth': 15.0, 'lat': 10.430, 'lon': -68.650},

            # Random events to complete ~33 today
            {'time': '2026-06-30T01:15:00', 'name': 'NAIGUATA (12KM SW)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.1, 'depth': 12.0, 'lat': 10.53, 'lon': -66.82},
            {'time': '2026-06-30T02:05:00', 'name': 'SAN FELIPE (5KM N)', 'sub': 'San Felipe Municipality (U), Venezuela', 'mag': 2.4, 'depth': 10.0, 'lat': 10.38, 'lon': -68.74},
            {'time': '2026-06-30T02:30:00', 'name': 'EL BAUL (10KM NW)', 'sub': 'Rómulo Gallegos Municipality (H), Venezuela', 'mag': 2.2, 'depth': 8.0, 'lat': 9.03, 'lon': -68.35},
            {'time': '2026-06-30T03:12:00', 'name': 'LA GUAIRA (15KM W)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.3, 'depth': 15.0, 'lat': 10.60, 'lon': -67.07},
            {'time': '2026-06-30T04:05:00', 'name': 'BOCA DE AROA (8KM SW)', 'sub': 'Bella Vista (Veroes), Venezuela', 'mag': 2.0, 'depth': 14.0, 'lat': 10.78, 'lon': -68.36},
            {'time': '2026-06-30T04:45:00', 'name': 'ALTAGRACIA DE ORITUCO (12KM E)', 'sub': 'Acevedo Municipality (M), Venezuela', 'mag': 2.2, 'depth': 12.0, 'lat': 9.86, 'lon': -66.19},
            {'time': '2026-06-30T05:20:00', 'name': 'SAN CARLOS (18KM NE)', 'sub': 'Montes de Oca (Rómulo Gallegos), Venezuela', 'mag': 2.3, 'depth': 60.0, 'lat': 9.70, 'lon': -68.45},
            {'time': '2026-06-30T12:15:00', 'name': 'NAIGUATA (8KM S)', 'sub': 'Vargas Municipality (X), Venezuela', 'mag': 2.1, 'depth': 10.0, 'lat': 10.54, 'lon': -66.74},
            {'time': '2026-06-30T12:45:00', 'name': 'SAN FELIPE (8KM W)', 'sub': 'San Felipe Municipality (U), Venezuela', 'mag': 2.3, 'depth': 12.0, 'lat': 10.34, 'lon': -68.81},
            {'time': '2026-06-30T13:10:00', 'name': 'BOCA DE AROA (12KM SE)', 'sub': 'Bella Vista (Veroes), Venezuela', 'mag': 2.2, 'depth': 10.0, 'lat': 10.75, 'lon': -68.23},
        ]

        for s in today_events:
            dt_local = datetime.strptime(s['time'], '%Y-%m-%dT%H:%M:%S')
            dt_utc = dt_local.replace(tzinfo=timezone.utc) + timedelta(hours=4)
            
            if dt_utc > now:
                continue

            event_id = f"funvisis_replica_202606_today_{dt_utc.strftime('%d%H%M')}"
            events_to_create.append(SeismicEvent(
                event_id=event_id,
                magnitude=Decimal(str(s['mag'])),
                depth_km=Decimal(str(s['depth'])),
                latitude=Decimal(str(s['lat'])),
                longitude=Decimal(str(s['lon'])),
                epicenter_name=s['name'] + ' ' + s['sub'],
                magnitude_type='ML',
                source='MANUAL',
                occurred_at=dt_utc
            ))

        events_to_create.sort(key=lambda e: e.occurred_at)
        SeismicEvent.objects.bulk_create(events_to_create, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(events_to_create)} aftershocks in the database.'))
