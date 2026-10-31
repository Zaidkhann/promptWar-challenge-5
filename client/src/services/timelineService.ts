import { apiRequest } from './api';
import { TimelineTask, TimelineSummary, TimelinePhase } from '../types';

export interface TimelineResponse {
  success: boolean;
  data: {
    tasks: TimelineTask[];
    phases: TimelinePhase[];
    summary: TimelineSummary;
  };
}

export const timelineService = {
  async getTasks(eventId: string): Promise<TimelineResponse> {
    return apiRequest<TimelineResponse>(`/events/${eventId}/timeline/tasks`);
  },

  async createTask(
    eventId: string,
    task: Partial<TimelineTask>
  ): Promise<{ success: boolean; data: { task: TimelineTask; summary: TimelineSummary }; message: string }> {
    return apiRequest<{ success: boolean; data: { task: TimelineTask; summary: TimelineSummary }; message: string }>(
      `/events/${eventId}/timeline/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(task),
      }
    );
  },

  async updateTask(
    eventId: string,
    taskId: string,
    task: Partial<TimelineTask>
  ): Promise<{ success: boolean; data: { task: TimelineTask; summary: TimelineSummary }; message: string }> {
    return apiRequest<{ success: boolean; data: { task: TimelineTask; summary: TimelineSummary }; message: string }>(
      `/events/${eventId}/timeline/tasks/${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify(task),
      }
    );
  },

  async deleteTask(
    eventId: string,
    taskId: string
  ): Promise<{ success: boolean; data: { summary: TimelineSummary }; message: string }> {
    return apiRequest<{ success: boolean; data: { summary: TimelineSummary }; message: string }>(
      `/events/${eventId}/timeline/tasks/${taskId}`,
      {
        method: 'DELETE',
      }
    );
  },
};
