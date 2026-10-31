import { apiRequest } from './api';
import { DashboardSummary } from '../types';

export const dashboardService = {
  async getSummary(): Promise<{ success: boolean; data: DashboardSummary }> {
    return apiRequest<{ success: boolean; data: DashboardSummary }>('/dashboard/summary');
  },
};
