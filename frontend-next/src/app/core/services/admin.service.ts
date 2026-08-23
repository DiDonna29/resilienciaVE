import api from './api.service';

export interface VerificationRequestAdmin {
  id: string;
  user: string;
  role_requested: string;
  document: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

const adminService = {
  // Verifications
  getVerificationRequests: async (): Promise<VerificationRequestAdmin[]> => {
    const { data } = await api.get<VerificationRequestAdmin[]>('/auth/admin/verification-requests/');
    return data;
  },

  reviewVerificationRequest: async (id: string, payload: { status: 'approved' | 'rejected', admin_notes?: string }): Promise<VerificationRequestAdmin> => {
    const { data } = await api.post<VerificationRequestAdmin>(`/auth/admin/verification-requests/${id}/review/`, payload);
    return data;
  },

  // Users
  getUsers: async (): Promise<any[]> => {
    const { data } = await api.get<any>('/auth/users/');
    return data.results ? data.results : data;
  },

  toggleUserStatus: async (userId: string): Promise<{ detail: string, is_active: boolean }> => {
    const { data } = await api.post<{ detail: string, is_active: boolean }>(`/auth/users/${userId}/deactivate/`);
    return data;
  },

  toggleAdmin: async (userId: string): Promise<{ detail: string, role: string }> => {
    const { data } = await api.post<{ detail: string, role: string }>(`/auth/users/${userId}/toggle-admin/`);
    return data;
  },

  verifyUserFlag: async (userId: string, flag: string, value: boolean): Promise<any> => {
    const { data } = await api.put<any>(`/auth/users/${userId}/verify/`, { flag, value });
    return data;
  }
};

export default adminService;
