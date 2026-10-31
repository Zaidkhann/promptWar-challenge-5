import { apiRequest } from './api';
import { Event, BudgetSummary, TimelineSummary, AIPlanOutput } from '../types';

export interface EventDetailResponse {
  success: boolean;
  data: Event & {
    budgetSummary: BudgetSummary;
    timelineSummary: TimelineSummary;
    aiPlan: {
      plan: AIPlanOutput;
      is_demo: boolean;
      model: string;
      updated_at: string;
    } | null;
  };
}

export const eventService = {
  async getEvents(): Promise<{ success: boolean; data: Event[] }> {
    return apiRequest<{ success: boolean; data: Event[] }>('/events');
  },

  async getEventById(eventId: string): Promise<EventDetailResponse> {
    return apiRequest<EventDetailResponse>(`/events/${eventId}`);
  },

  async createEvent(eventData: Partial<Event>): Promise<{ success: boolean; data: Event; message: string }> {
    return apiRequest<{ success: boolean; data: Event; message: string }>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  async updateEvent(
    eventId: string,
    eventData: Partial<Event>
  ): Promise<{ success: boolean; data: Event; message: string }> {
    return apiRequest<{ success: boolean; data: Event; message: string }>(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  async deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/events/${eventId}`, {
      method: 'DELETE',
    });
  },
};
