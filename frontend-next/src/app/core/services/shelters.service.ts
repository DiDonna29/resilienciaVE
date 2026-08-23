import api from './api.service';
import {
  CreateShelterData,
  Shelter,
  ShelterListResponse,
  ShelterStats,
  ShelterStatus,
  ShelterType,
} from '../models/shelter.interface';

const sheltersService = {
  async getStats(): Promise<ShelterStats> {
    const { data } = await api.get<ShelterStats>('/shelters/stats/');
    return data;
  },

  async getList(
    status?: ShelterStatus,
    type?: ShelterType,
    stateVe?: string,
    page = 1,
  ): Promise<ShelterListResponse> {
    const params: Record<string, string | number> = { page };
    if (status) params.status = status;
    if (type) params.type = type;
    if (stateVe) params.state_ve = stateVe;
    const { data } = await api.get<ShelterListResponse>('/shelters/', { params });
    return data;
  },

  async getDetail(id: string): Promise<Shelter> {
    const { data } = await api.get<Shelter>(`/shelters/${id}/`);
    return data;
  },

  async create(shelterData: CreateShelterData): Promise<Shelter> {
    const { data } = await api.post<Shelter>('/shelters/', shelterData);
    return data;
  },

  async update(id: string, updates: Partial<CreateShelterData>): Promise<Shelter> {
    const { data } = await api.patch<Shelter>(`/shelters/${id}/`, updates);
    return data;
  },

  getCapacityPercent(shelter: Shelter): number {
    if (shelter.max_capacity === 0) return 0;
    return Math.round((shelter.current_capacity / shelter.max_capacity) * 100);
  },

  getCapacityColor(shelter: Shelter): 'green' | 'yellow' | 'red' {
    const pct = this.getCapacityPercent(shelter);
    if (pct < 60) return 'green';
    if (pct < 85) return 'yellow';
    return 'red';
  },

  getStatusLabel(status: ShelterStatus): string {
    const labels: Record<ShelterStatus, string> = {
      open: 'Abierto',
      full: 'Lleno',
      closed: 'Cerrado',
    };
    return labels[status] ?? status;
  },

  async updateSupplies(id: string, data: { missing_supplies: string[] }): Promise<Shelter> {
    const response = await api.put<Shelter>(`/shelters/${id}/supplies/`, data);
    return response.data;
  },
};

export default sheltersService;
