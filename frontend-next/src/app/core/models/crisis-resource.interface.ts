import { User } from './user.interface';

export type ResourceCategory = 'app' | 'website' | 'social' | 'ngo' | 'other';

export interface CrisisResource {
  id: string;
  name: string;
  url: string;
  social_network?: string;
  description: string;
  screenshot?: string;
  category: ResourceCategory;
  category_display: string;
  submitted_by?: User;
  submitted_by_name: string;
  created_at: string;
}

export interface CrisisResourceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CrisisResource[];
}

export interface CreateCrisisResourceData {
  name: string;
  url: string;
  social_network?: string;
  description: string;
  category: ResourceCategory;
}
