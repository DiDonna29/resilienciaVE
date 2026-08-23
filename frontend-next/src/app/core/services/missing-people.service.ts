import api from './api.service';
import {
  DuplicateCheckResult,
  MarkFoundData,
  MissingPerson,
  MissingPersonListResponse,
  MissingStats,
  MissingStatus,
  ReportMissingData,
} from '../models/missing-person.interface';

const missingPeopleService = {
  async getStats(): Promise<MissingStats> {
    const { data } = await api.get<MissingStats>('/missing-people/stats/');
    return data;
  },

  async getList(status?: MissingStatus, page = 1, search?: string): Promise<MissingPersonListResponse> {
    const params: Record<string, string | number> = { page };
    if (status) params.status = status;
    if (search) params.search = search;
    const { data } = await api.get<MissingPersonListResponse>('/missing-people/', { params });
    return data;
  },

  async getDetail(id: string): Promise<MissingPerson> {
    const { data } = await api.get<MissingPerson>(`/missing-people/${id}/`);
    return data;
  },

  async create(formData: FormData): Promise<MissingPerson> {
    const { data } = await api.post<MissingPerson>('/missing-people/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async markAsFound(id: string, foundData: MarkFoundData): Promise<MissingPerson> {
    const { data } = await api.patch<MissingPerson>(`/missing-people/${id}/mark-found/`, foundData);
    return data;
  },

  async checkDuplicate(fullName: string, age: number, cedula?: string): Promise<DuplicateCheckResult> {
    const payload: Record<string, any> = { full_name: fullName, age };
    if (cedula) payload.cedula = cedula;
    const { data } = await api.post<DuplicateCheckResult>('/missing-people/check-duplicate/', payload);
    return data;
  },

  buildReportFormData(reportData: ReportMissingData): FormData {
    const formData = new FormData();
    formData.append('full_name', reportData.full_name);
    formData.append('age', String(reportData.age));
    formData.append('last_known_location_description', reportData.last_known_location_description);
    formData.append('state_ve', reportData.state_ve);
    formData.append('reported_by_name', reportData.reported_by_name);
    formData.append('reporter_phone', reportData.reporter_phone);
    if (reportData.cedula) formData.append('cedula', reportData.cedula);
    if (reportData.photo) formData.append('photo', reportData.photo);
    if (reportData.last_known_latitude !== undefined)
      formData.append('last_known_latitude', String(reportData.last_known_latitude));
    if (reportData.last_known_longitude !== undefined)
      formData.append('last_known_longitude', String(reportData.last_known_longitude));
    return formData;
  },
};

export default missingPeopleService;
