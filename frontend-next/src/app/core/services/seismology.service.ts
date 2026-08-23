import api from './api.service';
import { SeismicEvent, SeismicListResponse, SeismicStats } from '../models/seismo.interface';

const seismologyService = {
  async getStats(): Promise<SeismicStats> {
    const { data } = await api.get<SeismicStats>('/seismology/stats/');
    return data;
  },

  async getRecent(page = 1, limit = 20, minMagnitude?: number, date?: string, fetchAll?: boolean): Promise<SeismicListResponse> {
    const params: Record<string, string | number | boolean> = { page, limit };
    if (minMagnitude !== undefined) params.min_magnitude = minMagnitude;
    if (date) params.date = date;
    if (fetchAll) params.all = true;
    const { data } = await api.get<SeismicListResponse>('/seismology/events/', { params });
    return data;
  },

  async getDetail(id: string): Promise<SeismicEvent> {
    const { data } = await api.get<SeismicEvent>(`/seismology/events/${id}/`);
    return data;
  },

  async getLatest(): Promise<SeismicEvent | null> {
    try {
      const { data } = await api.get<SeismicListResponse>('/seismology/events/', {
        params: { page: 1, limit: 1 },
      });
      return data.results[0] ?? null;
    } catch {
      return null;
    }
  },

  getMagnitudeLabel(magnitude: number): string {
    if (magnitude < 2.0) return 'Micro';
    if (magnitude < 3.0) return 'Menor';
    if (magnitude < 4.0) return 'Leve';
    if (magnitude < 5.0) return 'Moderado';
    if (magnitude < 6.0) return 'Fuerte';
    if (magnitude < 7.0) return 'Mayor';
    return 'Gran Terremoto';
  },

  getMagnitudeClass(magnitude: number): string {
    if (magnitude < 2.0) return 'magnitude-minor';
    if (magnitude < 3.0) return 'magnitude-minor';
    if (magnitude < 4.0) return 'magnitude-light';
    if (magnitude < 5.0) return 'magnitude-moderate';
    if (magnitude < 6.0) return 'magnitude-strong';
    return 'magnitude-major';
  },

  getMagnitudeColor(magnitude: number): string {
    if (magnitude < 3.0) return '#10B981';
    if (magnitude < 4.0) return '#F59E0B';
    if (magnitude < 5.0) return '#F97316';
    return '#EF3340';
  },
};

export default seismologyService;
