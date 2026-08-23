import api from './api.service';
import {
  CrisisResource,
  CrisisResourceListResponse,
  CreateCrisisResourceData,
  ResourceCategory,
} from '../models/crisis-resource.interface';

const crisisDirectoryService = {
  async getList(
    category?: ResourceCategory,
    page = 1,
    search?: string,
  ): Promise<CrisisResourceListResponse> {
    const params: Record<string, string | number> = { page };
    if (category) params.category = category;
    if (search) params.search = search;
    const { data } = await api.get<CrisisResourceListResponse>('/crisis-directory/', { params });
    if (data.results) {
      data.results = data.results.map((r: any) => ({
        ...r,
        submitted_by_name: r.submitted_by ? `${r.submitted_by.first_name} ${r.submitted_by.last_name}` : 'Ciudadano Anónimo'
      }));
    }
    return data;
  },

  async getDetail(id: string): Promise<CrisisResource> {
    const { data } = await api.get<CrisisResource>(`/crisis-directory/${id}/`);
    return data;
  },

  async create(resourceData: CreateCrisisResourceData): Promise<any> {
    const { data } = await api.post<any>('/crisis-directory/', resourceData);
    return data;
  },

  getCategoryLabel(category: ResourceCategory): string {
    const labels: Record<ResourceCategory, string> = {
      app: 'Aplicación / PWA',
      website: 'Sitio Web de Ayuda',
      social: 'Red Social / Telegram',
      ngo: 'Organización (ONG)',
      other: 'Otro Recurso',
    };
    return labels[category] ?? category;
  },
};

export default crisisDirectoryService;
