import { apiRequest } from './api';
import { BudgetSummary, BudgetAllocation, Expense } from '../types';

export const budgetService = {
  async getSummary(eventId: string): Promise<{ success: boolean; data: BudgetSummary }> {
    return apiRequest<{ success: boolean; data: BudgetSummary }>(`/events/${eventId}/budget/summary`);
  },

  async getAllocations(eventId: string): Promise<{ success: boolean; data: BudgetAllocation[] }> {
    return apiRequest<{ success: boolean; data: BudgetAllocation[] }>(`/events/${eventId}/budget/allocations`);
  },

  async setAllocation(
    eventId: string,
    allocation: { category: string; allocated_amount: number; notes?: string }
  ): Promise<{ success: boolean; data: BudgetSummary; message: string }> {
    return apiRequest<{ success: boolean; data: BudgetSummary; message: string }>(
      `/events/${eventId}/budget/allocations`,
      {
        method: 'POST',
        body: JSON.stringify(allocation),
      }
    );
  },

  async getExpenses(
    eventId: string,
    filters?: { category?: string; status?: string }
  ): Promise<{ success: boolean; data: Expense[] }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    return apiRequest<{ success: boolean; data: Expense[] }>(`/events/${eventId}/budget/expenses${queryString}`);
  },

  async createExpense(
    eventId: string,
    expense: Partial<Expense>
  ): Promise<{ success: boolean; data: { expense: Expense; budgetSummary: BudgetSummary }; message: string }> {
    return apiRequest<{ success: boolean; data: { expense: Expense; budgetSummary: BudgetSummary }; message: string }>(
      `/events/${eventId}/budget/expenses`,
      {
        method: 'POST',
        body: JSON.stringify(expense),
      }
    );
  },

  async updateExpense(
    eventId: string,
    expenseId: string,
    expense: Partial<Expense>
  ): Promise<{ success: boolean; data: { expense: Expense; budgetSummary: BudgetSummary }; message: string }> {
    return apiRequest<{ success: boolean; data: { expense: Expense; budgetSummary: BudgetSummary }; message: string }>(
      `/events/${eventId}/budget/expenses/${expenseId}`,
      {
        method: 'PUT',
        body: JSON.stringify(expense),
      }
    );
  },

  async deleteExpense(
    eventId: string,
    expenseId: string
  ): Promise<{ success: boolean; data: { budgetSummary: BudgetSummary }; message: string }> {
    return apiRequest<{ success: boolean; data: { budgetSummary: BudgetSummary }; message: string }>(
      `/events/${eventId}/budget/expenses/${expenseId}`,
      {
        method: 'DELETE',
      }
    );
  },
};
