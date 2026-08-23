import { User } from './user.interface';

export type ShelterType = 'hotel' | 'camp' | 'open_area' | 'community_center' | 'other';
export type ShelterStatus = 'open' | 'full' | 'closed';

export interface Shelter {
  id: string;
  name: string;
  type: ShelterType;
  type_display: string;
  status: ShelterStatus;
  status_display: string;
  latitude: number;
  longitude: number;
  address: string;
  state_ve: string;
  current_capacity: number;
  max_capacity: number;
  missing_supplies: string[];
  registered_by?: User;
  created_at: string;
  updated_at: string;
}

export interface ShelterListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Shelter[];
}

export interface ShelterStats {
  total: number;
  operational_count: number;
  total_capacity: number;
  total_occupancy: number;
  available_spaces: number;
}

export interface CreateShelterData {
  name: string;
  type: ShelterType;
  latitude: number;
  longitude: number;
  address: string;
  state_ve: string;
  status: ShelterStatus;
  current_capacity: number;
  max_capacity: number;
  missing_supplies: string[];
}
