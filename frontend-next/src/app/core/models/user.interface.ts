export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  cedula?: string;
  phone_number?: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'CITIZEN';
  is_verified_health_worker: boolean;
  is_verified_shelter_manager: boolean;
  is_verified_org_donor: boolean;
  is_verified_web_collaborator: boolean;
  auth_provider: 'google' | 'manual';
  google_id?: string | null;
  whatsapp_link?: string;
  date_joined: string;
  updated_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  cedula?: string;
  phone_number?: string;
  password: string;
  password_confirm: string;
}
