export type EventType = 'sismo' | 'temblor' | 'terremoto';

export interface SeismicEvent {
  id: string;
  event_id: string;
  magnitude: number;
  depth_km: number;
  latitude: number;
  longitude: number;
  epicenter_name: string;
  magnitude_type: string;
  source: string;
  event_type: EventType;
  occurred_at: string;
  created_at: string;
}

export interface SeismicStats {
  total_events: number;
  events_today: number;
  events_this_week: number;
  largest_magnitude: number | null;
  latest_event: SeismicEvent | null;
  by_type: Record<string, number>;
  by_alert_level: Record<string, number>;
}

export interface SeismicListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SeismicEvent[];
}
