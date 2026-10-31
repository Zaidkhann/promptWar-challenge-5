import { describe, it, expect } from 'vitest';
import { BudgetService } from '../services/budgetService';
import { BudgetAllocation, Expense, VendorCategory } from '../types';

describe('BudgetService Unit Tests', () => {
  it('should accurately calculate budget metrics when no allocations or expenses exist', () => {
    const summary = BudgetService.calculateMetrics(100000, [], []);

    expect(summary.total_budget).toBe(100000);
    expect(summary.total_allocated).toBe(0);
    expect(summary.total_spent).toBe(0);
    expect(summary.remaining_budget).toBe(100000);
    expect(summary.unallocated_budget).toBe(100000);
    expect(summary.spending_percentage).toBe(0);
    expect(summary.is_over_budget).toBe(false);
    expect(summary.over_budget_amount).toBe(0);
    expect(summary.category_breakdown).toEqual([]);
  });

  it('should accurately compute allocated amounts and remaining balances', () => {
    const allocations: BudgetAllocation[] = [
      {
        id: '1',
        event_id: 'e1',
        category: 'Venue',
        allocated_amount: 30000,
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        event_id: 'e1',
        category: 'Catering',
        allocated_amount: 40000,
        created_at: '',
        updated_at: '',
      },
    ];

    const expenses: Expense[] = [
      {
        id: 'ex1',
        event_id: 'e1',
        category: 'Venue',
        title: 'Hall Deposit',
        amount: 25000,
        expense_date: '2026-11-01',
        status: 'paid',
        created_at: '',
        updated_at: '',
      },
      {
        id: 'ex2',
        event_id: 'e1',
        category: 'Catering',
        title: 'Food Advance',
        amount: 15000,
        expense_date: '2026-11-05',
        status: 'pending',
        created_at: '',
        updated_at: '',
      },
    ];

    const summary = BudgetService.calculateMetrics(100000, allocations, expenses);

    expect(summary.total_allocated).toBe(70000);
    expect(summary.total_spent).toBe(40000);
    expect(summary.remaining_budget).toBe(60000);
    expect(summary.unallocated_budget).toBe(30000);
    expect(summary.spending_percentage).toBe(40);
    expect(summary.allocation_percentage).toBe(70);
    expect(summary.is_over_budget).toBe(false);
    expect(summary.over_budget_amount).toBe(0);

    // Verify category breakdown
    const venueCat = summary.category_breakdown.find((c) => c.category === 'Venue');
    expect(venueCat).toBeDefined();
    expect(venueCat?.allocated).toBe(30000);
    expect(venueCat?.spent).toBe(25000);
    expect(venueCat?.remaining).toBe(5000);
    expect(venueCat?.is_over_budget).toBe(false);
    expect(venueCat?.expense_count).toBe(1);

    const cateringCat = summary.category_breakdown.find((c) => c.category === 'Catering');
    expect(cateringCat).toBeDefined();
    expect(cateringCat?.allocated).toBe(40000);
    expect(cateringCat?.spent).toBe(15000);
    expect(cateringCat?.remaining).toBe(25000);
  });

  it('should flag over-budget condition when expenses exceed total budget', () => {
    const allocations: BudgetAllocation[] = [
      {
        id: '1',
        event_id: 'e1',
        category: 'Photography',
        allocated_amount: 20000,
        created_at: '',
        updated_at: '',
      },
    ];

    const expenses: Expense[] = [
      {
        id: 'ex1',
        event_id: 'e1',
        category: 'Photography',
        title: 'Lead Photographer & Drone',
        amount: 55000,
        expense_date: '2026-11-10',
        status: 'paid',
        created_at: '',
        updated_at: '',
      },
    ];

    const summary = BudgetService.calculateMetrics(50000, allocations, expenses);

    expect(summary.total_spent).toBe(55000);
    expect(summary.remaining_budget).toBe(-5000);
    expect(summary.is_over_budget).toBe(true);
    expect(summary.over_budget_amount).toBe(5000);
    expect(summary.spending_percentage).toBe(110);

    const photoCat = summary.category_breakdown.find((c) => c.category === 'Photography');
    expect(photoCat?.is_over_budget).toBe(true);
    expect(photoCat?.remaining).toBe(-35000);
  });

  it('should handle zero total budget gracefully without division by zero', () => {
    const summary = BudgetService.calculateMetrics(0, [], []);
    expect(summary.spending_percentage).toBe(0);
    expect(summary.allocation_percentage).toBe(0);
    expect(summary.is_over_budget).toBe(false);
  });
});
