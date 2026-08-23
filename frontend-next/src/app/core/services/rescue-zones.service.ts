import api from './api.service';
import {
  CreateRescueZoneData,
  RescueZone,
  RescueZoneListResponse,
  VolunteerData,
  VolunteerRequest,
  ZoneStatus,
  RiskType,
} from '../models/rescue-zone.interface';

const rescueZonesService = {
  async getList(
    status?: ZoneStatus,
    riskType?: RiskType,
    page = 1,
  ): Promise<RescueZoneListResponse> {
    const params: Record<string, string | number> = { page };
    if (status) params.status = status;
    if (riskType) params.risk_type = riskType;
    const { data } = await api.get<RescueZoneListResponse>('/rescue-zones/', { params });
    return data;
  },

  async getDetail(id: string): Promise<RescueZone> {
    const { data } = await api.get<RescueZone>(`/rescue-zones/${id}/`);
    return data;
  },

  async create(zoneData: CreateRescueZoneData): Promise<RescueZone> {
    const { data } = await api.post<RescueZone>('/rescue-zones/', zoneData);
    return data;
  },

  async update(id: string, updates: Partial<CreateRescueZoneData>): Promise<RescueZone> {
    const { data } = await api.patch<RescueZone>(`/rescue-zones/${id}/`, updates);
    return data;
  },

  async registerVolunteer(zoneId: string, volunteerData: VolunteerData): Promise<VolunteerRequest> {
    const { data } = await api.post<VolunteerRequest>(
      `/rescue-zones/${zoneId}/volunteer/`,
      volunteerData,
    );
    return data;
  },

  getRiskTypeLabel(riskType: RiskType): string {
    const labels: Record<RiskType, string> = {
      collapse: 'Derrumbe / Colapso',
      landslide: 'Deslizamiento',
      flood: 'Inundación',
      fire: 'Incendio',
      other: 'Otro Riesgo',
    };
    return labels[riskType] ?? riskType;
  },

  getStatusLabel(status: ZoneStatus): string {
    const labels: Record<ZoneStatus, string> = {
      active: 'Activa',
      attended: 'Atendida',
      closed: 'Cerrada / Inactiva',
    };
    return labels[status] ?? status;
  },
};

export default rescueZonesService;
