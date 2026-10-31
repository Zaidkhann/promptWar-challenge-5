import { db } from '../db';
import { BudgetSummary, Expense, BudgetAllocation, VendorCategory, VENDOR_CATEGORIES } from '../types';

export class BudgetService {
  /**
   * Pure calculation function: computes full budget metrics from raw totals and records.
   * Usable for both database events and in-memory test simulations.
   */
  public static calculateMetrics(
    totalBudget: number,
    allocations: BudgetAllocation[],
    expenses: Expense[]
  ): BudgetSummary {
    const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.allocated_amount) || 0), 0);
    
    // Only count active expenses ('paid' or 'pending' or 'planned')
    const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const remainingBudget = totalBudget - totalSpent;
    const unallocatedBudget = totalBudget - totalAllocated;
    const isOverBudget = totalSpent > totalBudget;
    const overBudgetAmount = isOverBudget ? totalSpent - totalBudget : 0;
    
    const spendingPercentage = totalBudget > 0 
      ? Math.round((totalSpent / totalBudget) * 100 * 10) / 10 
      : (totalSpent > 0 ? 100 : 0);

    const allocationPercentage = totalBudget > 0
      ? Math.round((totalAllocated / totalBudget) * 100 * 10) / 10
      : (totalAllocated > 0 ? 100 : 0);

    // Compute category breakdown
    const categoryMap = new Map<VendorCategory, { allocated: number; spent: number; count: number }>();

    for (const cat of VENDOR_CATEGORIES) {
      categoryMap.set(cat, { allocated: 0, spent: 0, count: 0 });
    }

    for (const alloc of allocations) {
      const entry = categoryMap.get(alloc.category as VendorCategory) || { allocated: 0, spent: 0, count: 0 };
      entry.allocated += Number(alloc.allocated_amount) || 0;
      categoryMap.set(alloc.category as VendorCategory, entry);
    }

    for (const exp of expenses) {
      const entry = categoryMap.get(exp.category as VendorCategory) || { allocated: 0, spent: 0, count: 0 };
      entry.spent += Number(exp.amount) || 0;
      entry.count += 1;
      categoryMap.set(exp.category as VendorCategory, entry);
    }

    const categoryBreakdown = Array.from(categoryMap.entries())
      .filter(([_, data]) => data.allocated > 0 || data.spent > 0)
      .map(([category, data]) => ({
        category,
        allocated: data.allocated,
        spent: data.spent,
        remaining: data.allocated - data.spent,
        is_over_budget: data.spent > data.allocated && data.allocated > 0,
        expense_count: data.count,
      }));

    return {
      total_budget: totalBudget,
      total_allocated: totalAllocated,
      total_spent: totalSpent,
      remaining_budget: remainingBudget,
      unallocated_budget: unallocatedBudget,
      spending_percentage: spendingPercentage,
      allocation_percentage: allocationPercentage,
      is_over_budget: isOverBudget,
      over_budget_amount: overBudgetAmount,
      category_breakdown: categoryBreakdown,
    };
  }

  /**
   * Retrieves live computed budget summary for an event from the database.
   */
  public static getEventBudgetSummary(eventId: string, totalBudget: number): BudgetSummary {
    const allocations = db
      .prepare('SELECT * FROM budget_allocations WHERE event_id = ?')
      .all(eventId) as BudgetAllocation[];

    const expenses = db
      .prepare('SELECT * FROM expenses WHERE event_id = ?')
      .all(eventId) as Expense[];

    return this.calculateMetrics(totalBudget, allocations, expenses);
  }
}
