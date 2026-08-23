export type AllyType = 'company' | 'brand' | 'donor' | 'individual';

export interface AllyProfile {
  id: string;
  name: string;
  type: AllyType;
  type_display: string;
  description: string;
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  services_offered: string[];
  logo?: string;
  registered_by?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AllyListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AllyProfile[];
}

export interface CreateAllyData {
  name: string;
  type: AllyType;
  description: string;
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
  };
  services_offered: string[];
}
