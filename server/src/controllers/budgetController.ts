import { Response, NextFunction } from 'express';
import { db } from '../db';
import { AppError } from '../middleware/errorHandler';
import { RequestWithEvent } from '../middleware/eventOwner';
import { BudgetService } from '../services/budgetService';
import { Expense } from '../types';

export class BudgetController {
  public static async getBudgetSummary(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = req.currentEvent!;
      const summary = BudgetService.getEventBudgetSummary(event.id, event.total_budget);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAllocations(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const allocations = db
        .prepare('SELECT * FROM budget_allocations WHERE event_id = ? ORDER BY allocated_amount DESC')
        .all(eventId);

      res.status(200).json({
        success: true,
        data: allocations,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async setAllocation(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const { category, allocated_amount, notes } = req.body;

      const allocId = `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      db.prepare(`
        INSERT INTO budget_allocations (id, event_id, category, allocated_amount, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(event_id, category) DO UPDATE SET
          allocated_amount = excluded.allocated_amount,
          notes = excluded.notes,
          updated_at = datetime('now')
      `).run(allocId, eventId, category, allocated_amount, notes || null);

      const updatedSummary = BudgetService.getEventBudgetSummary(eventId, req.currentEvent!.total_budget);

      res.status(200).json({
        success: true,
        message: 'Category budget allocation updated',
        data: updatedSummary,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getExpenses(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const { category, status } = req.query;

      let query = 'SELECT * FROM expenses WHERE event_id = ?';
      const params: any[] = [eventId];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY expense_date DESC, created_at DESC';

      const expenses = db.prepare(query).all(...params) as Expense[];

      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createExpense(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const { category, title, amount, paid_to, expense_date, status, notes } = req.body;

      const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      db.prepare(`
        INSERT INTO expenses (
          id, event_id, category, title, amount, paid_to, expense_date, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        expenseId,
        eventId,
        category,
        title.trim(),
        amount,
        paid_to?.trim() || null,
        expense_date,
        status || 'planned',
        notes?.trim() || null
      );

      const created = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
      const updatedSummary = BudgetService.getEventBudgetSummary(eventId, req.currentEvent!.total_budget);

      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        data: {
          expense: created,
          budgetSummary: updatedSummary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateExpense(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const expenseId = req.params.expenseId;
      const { category, title, amount, paid_to, expense_date, status, notes } = req.body;

      const existing = db.prepare('SELECT id FROM expenses WHERE id = ? AND event_id = ?').get(expenseId, eventId);
      if (!existing) {
        throw new AppError('Expense not found for this event', 404);
      }

      db.prepare(`
        UPDATE expenses SET
          category = COALESCE(?, category),
          title = COALESCE(?, title),
          amount = COALESCE(?, amount),
          paid_to = COALESCE(?, paid_to),
          expense_date = COALESCE(?, expense_date),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        category !== undefined ? category : null,
        title !== undefined ? title.trim() : null,
        amount !== undefined ? amount : null,
        paid_to !== undefined ? paid_to.trim() : null,
        expense_date !== undefined ? expense_date : null,
        status !== undefined ? status : null,
        notes !== undefined ? notes.trim() : null,
        expenseId
      );

      const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expenseId);
      const updatedSummary = BudgetService.getEventBudgetSummary(eventId, req.currentEvent!.total_budget);

      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: {
          expense: updated,
          budgetSummary: updatedSummary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteExpense(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const expenseId = req.params.expenseId;

      const existing = db.prepare('SELECT id FROM expenses WHERE id = ? AND event_id = ?').get(expenseId, eventId);
      if (!existing) {
        throw new AppError('Expense not found for this event', 404);
      }

      db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);
      const updatedSummary = BudgetService.getEventBudgetSummary(eventId, req.currentEvent!.total_budget);

      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
        data: {
          budgetSummary: updatedSummary,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
