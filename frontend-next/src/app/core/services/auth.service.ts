import axios from 'axios';
import api from './api.service';
import { AuthTokens, LoginCredentials, RegisterData, User } from '../models/user.interface';

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface GoogleLoginData {
  access_token: string;
}

const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<any>('/auth/login/', credentials);
    const mappedResponse: AuthResponse = {
      user: data.user,
      tokens: {
        access: data.access,
        refresh: data.refresh,
      }
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
    }
    return mappedResponse;
  },

  async register(registerData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<any>('/auth/register/', registerData);
    const mappedResponse: AuthResponse = {
      user: data.user,
      tokens: {
        access: data.access,
        refresh: data.refresh,
      }
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
    }
    return mappedResponse;
  },

  // Called with the id_token (credential) from Google Identity Services
  async googleLogin(credential: string): Promise<AuthResponse> {
    const { data } = await api.post<any>('/auth/google/', {
      credential,
    });
    const mappedResponse: AuthResponse = {
      user: data.user,
      tokens: {
        access: data.access,
        refresh: data.refresh,
      }
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
    }
    return mappedResponse;
  },


  async googleLoginWithCode(code: string): Promise<AuthResponse> {
    const redirectUri = `${window.location.origin}/auth/google-callback`;
    const { data } = await api.post<any>('/auth/google/', {
      code,
      redirect_uri: redirectUri,
    });
    const mappedResponse: AuthResponse = {
      user: data.user,
      tokens: {
        access: data.access,
        refresh: data.refresh,
      }
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
    }
    return mappedResponse;
  },


  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/auth/profile/');
    return data;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data } = await api.patch<User>('/auth/profile/', updates);
    return data;
  },

  async getVerificationRequests(): Promise<any[]> {
    const { data } = await api.get<any[]>('/auth/verification-request/');
    return data;
  },

  async submitVerificationRequest(formData: FormData): Promise<any> {
    const { data } = await api.post<any>('/auth/verification-request/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async refreshToken(refresh: string): Promise<{ access: string }> {
    const { data } = await axios.post<{ access: string }>(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`,
      { refresh },
    );
    return data;
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
};

export default authService;
