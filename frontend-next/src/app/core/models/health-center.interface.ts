import { User } from './user.interface';

export type HealthCenterType = 'hospital' | 'clinic' | 'medical_post';
export type OperationalStatus = 'operational' | 'critical' | 'closed';

export interface HealthCenter {
  id: string;
  name: string;
  type: HealthCenterType;
  type_display: string;
  status: OperationalStatus;
  status_display: string;
  is_attending: boolean;
  latitude: number;
  longitude: number;
  address: string;
  state_ve: string;
  contact_phone: string;
  contact_email?: string;
  missing_supplies: string[];
  registered_by?: User;
  created_at: string;
  updated_at: string;
}

export interface HealthCenterListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: HealthCenter[];
}

export interface HealthCenterStats {
  total: number;
  operational_count: number;
  critical_count: number;
  closed_count: number;
}

export interface CreateHealthCenterData {
  name: string;
  type: HealthCenterType;
  latitude: number;
  longitude: number;
  address: string;
  state_ve: string;
  status: OperationalStatus;
  is_attending: boolean;
  missing_supplies: string[];
  contact_phone: string;
  contact_email?: string;
}
