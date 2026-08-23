export type MissingStatus = 'missing' | 'found' | 'deceased';
export type FoundCondition = 'safe' | 'injured' | 'deceased' | 'unknown';
export type FoundLocationType = 'hospital' | 'shelter' | 'risk_zone' | 'home' | 'other';

export interface MissingPerson {
  id: string;
  full_name: string;
  age: number;
  cedula?: string;
  photo?: string;
  last_known_latitude?: number;
  last_known_longitude?: number;
  last_known_location_description: string;
  state_ve: string;
  status: MissingStatus;
  reported_by_name: string;
  reporter_phone: string;
  reporter_whatsapp_link: string;
  located_by_name?: string;
  located_at?: string;
  found_condition?: FoundCondition;
  found_location_type?: FoundLocationType;
  found_location_description?: string;
  locator_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface MissingStats {
  total: number;
  missing_count: number;
  found_count: number;
  deceased_count: number;
  last_updated: string;
}

export interface MissingPersonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MissingPerson[];
}

export interface ReportMissingData {
  full_name: string;
  age: number;
  cedula?: string;
  photo?: File;
  last_known_location_description: string;
  state_ve: string;
  last_known_latitude?: number;
  last_known_longitude?: number;
  reported_by_name: string;
  reporter_phone: string;
}

export interface MarkFoundData {
  status: 'found' | 'deceased';
  found_condition: FoundCondition;
  found_location_type: FoundLocationType;
  found_location_description: string;
  locator_phone?: string;
}

export interface DuplicateCheckResult {
  is_duplicate: boolean;
  similarity: number;
  match_reason: string | null;
  existing_person: {
    id: string;
    full_name: string;
    age: number;
    state_ve: string;
    status: string;
    created_at: string;
  } | null;
}
