import { User } from './user.interface';

export type RiskType = 'collapse' | 'landslide' | 'flood' | 'fire' | 'other';
export type ZoneStatus = 'active' | 'attended' | 'closed';

export interface RescueZone {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  state_ve: string;
  risk_type: RiskType;
  risk_type_display: string;
  technical_needs: string[];
  missing_supplies: string[];
  volunteers_needed: number;
  volunteer_count: number;
  status: ZoneStatus;
  status_display: string;
  reported_by?: User;
  created_at: string;
  updated_at: string;
}

export interface RescueZoneListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RescueZone[];
}

export interface VolunteerRequest {
  id: string;
  zone: string;
  volunteer: User;
  message: string;
  created_at: string;
}

export interface CreateRescueZoneData {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  state_ve: string;
  risk_type: RiskType;
  technical_needs: string[];
  missing_supplies?: string[];
  volunteers_needed?: number;
}

export interface VolunteerData {
  message: string;
}
