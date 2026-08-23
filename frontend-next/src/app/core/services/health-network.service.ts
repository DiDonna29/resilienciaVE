import api from './api.service';
import {
  CreateHealthCenterData,
  HealthCenter,
  HealthCenterListResponse,
  HealthCenterStats,
  OperationalStatus,
  HealthCenterType,
} from '../models/health-center.interface';

const healthNetworkService = {
  async getStats(): Promise<HealthCenterStats> {
    const { data } = await api.get<HealthCenterStats>('/health-network/stats/');
    return data;
  },

  async getList(
    status?: OperationalStatus,
    type?: HealthCenterType,
    stateVe?: string,
    page = 1,
  ): Promise<HealthCenterListResponse> {
    const params: Record<string, string | number> = { page };
    if (status) params.status = status;
    if (type) params.type = type;
    if (stateVe) params.state_ve = stateVe;
    const { data } = await api.get<HealthCenterListResponse>('/health-network/', { params });
    return data;
  },

  async getDetail(id: string): Promise<HealthCenter> {
    const { data } = await api.get<HealthCenter>(`/health-network/${id}/`);
    return data;
  },

  async create(centerData: CreateHealthCenterData): Promise<HealthCenter> {
    const { data } = await api.post<HealthCenter>('/health-network/', centerData);
    return data;
  },

  async update(id: string, updates: Partial<CreateHealthCenterData>): Promise<HealthCenter> {
    const { data } = await api.patch<HealthCenter>(`/health-network/${id}/`, updates);
    return data;
  },

  getStatusLabel(status: OperationalStatus): string {
    const labels: Record<OperationalStatus, string> = {
      operational: 'Operativo',
      critical: 'Crítico',
      closed: 'Cerrado',
    };
    return labels[status];
  },

  getCenterTypeLabel(type: HealthCenterType): string {
    const labels: Record<HealthCenterType, string> = {
      hospital: 'Hospital',
      clinic: 'Clínica',
      medical_post: 'Puesto Médico',
    };
    return labels[type] ?? type;
  },

  async updateSupplies(id: string, data: { missing_supplies: string[] }): Promise<HealthCenter> {
    const response = await api.put<HealthCenter>(`/health-network/${id}/supplies/`, data);
    return response.data;
  },
};

export default healthNetworkService;
