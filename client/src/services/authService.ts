import { apiRequest } from './api';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.data?.token) {
      localStorage.setItem('celebraplan_token', res.data.token);
    }
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      localStorage.setItem('celebraplan_token', res.data.token);
    }
    return res;
  },

  async me(): Promise<{ success: boolean; data: User }> {
    return apiRequest<{ success: boolean; data: User }>('/auth/me');
  },

  logout(): void {
    localStorage.removeItem('celebraplan_token');
  },

  getToken(): string | null {
    return localStorage.getItem('celebraplan_token');
  },
};
