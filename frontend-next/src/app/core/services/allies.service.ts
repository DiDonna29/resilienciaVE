import api from './api.service';
import {
  AllyProfile,
  AllyListResponse,
  AllyType,
  CreateAllyData,
} from '../models/ally.interface';

const alliesService = {
  async getList(
    type?: AllyType,
    page = 1,
    search?: string,
  ): Promise<AllyListResponse> {
    const params: Record<string, string | number> = { page };
    if (type) params.type = type;
    if (search) params.search = search;
    const { data } = await api.get<AllyListResponse>('/allies/', { params });
    return data;
  },

  async getDetail(id: string): Promise<AllyProfile> {
    const { data } = await api.get<AllyProfile>(`/allies/${id}/`);
    return data;
  },

  async create(allyData: CreateAllyData): Promise<AllyProfile> {
    const { data } = await api.post<AllyProfile>('/allies/', allyData);
    return data;
  },

  async update(id: string, updates: Partial<CreateAllyData>): Promise<AllyProfile> {
    const { data } = await api.patch<AllyProfile>(`/allies/${id}/`, updates);
    return data;
  },

  getTypeLabel(type: AllyType): string {
    const labels: Record<AllyType, string> = {
      company: 'Empresa / Comercio',
      brand: 'Marca',
      donor: 'Donador Particular',
      individual: 'Persona Natural / Voluntario Técnico',
    };
    return labels[type] ?? type;
  },
};

export default alliesService;
