import { apiRequest } from './api';
import { AIPlanOutput, BudgetSummary, TimelineSummary, AIRecommendation } from '../types';

export interface PlanGenerationResponse {
  success: boolean;
  message: string;
  data: {
    plan: AIPlanOutput;
    is_demo: boolean;
    model: string;
    generated_at: string;
  };
}

export interface PlanApplyResponse {
  success: boolean;
  message: string;
  data: {
    budgetSummary: BudgetSummary;
    timelineSummary: TimelineSummary;
  };
}

export interface RecommendationsResponse {
  success: boolean;
  message?: string;
  data: {
    recommendations: AIRecommendation[];
    decoration_suggestions?: string[];
    food_catering_ideas?: string[];
    entertainment_suggestions?: string[];
    is_demo?: boolean;
    model?: string;
  };
}

export const aiService = {
  async generatePlan(eventId: string, prompt: string): Promise<PlanGenerationResponse> {
    return apiRequest<PlanGenerationResponse>(`/events/${eventId}/ai/plan/generate`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },

  async applyPlan(eventId: string, plan?: AIPlanOutput): Promise<PlanApplyResponse> {
    return apiRequest<PlanApplyResponse>(`/events/${eventId}/ai/plan/apply`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },

  async getRecommendations(eventId: string): Promise<{ success: boolean; data: AIRecommendation[] }> {
    return apiRequest<{ success: boolean; data: AIRecommendation[] }>(`/events/${eventId}/ai/recommendations`);
  },

  async regenerateRecommendations(eventId: string, prompt?: string): Promise<RecommendationsResponse> {
    return apiRequest<RecommendationsResponse>(`/events/${eventId}/ai/recommendations/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ prompt: prompt || 'Provide fresh creative budget-conscious recommendations' }),
    });
  },
};
