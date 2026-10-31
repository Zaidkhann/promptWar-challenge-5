import { Response, NextFunction } from 'express';
import { db } from '../db';
import { AppError } from '../middleware/errorHandler';
import { RequestWithEvent } from '../middleware/eventOwner';
import { Event } from '../types';
import { BudgetService } from '../services/budgetService';
import { TimelineService } from '../services/timelineService';

export class EventController {
  public static async getEvents(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const events = db
        .prepare('SELECT * FROM events WHERE user_id = ? ORDER BY event_date ASC')
        .all(userId) as Event[];

      const eventsWithStats = events.map((event) => {
        const budgetSummary = BudgetService.getEventBudgetSummary(event.id, event.total_budget);
        const timelineSummary = TimelineService.getEventTimelineSummary(event.id);
        const vendorCountRow = db
          .prepare('SELECT COUNT(*) as count FROM vendors WHERE event_id = ?')
          .get(event.id) as { count: number };

        return {
          ...event,
          budgetSummary: {
            total_budget: budgetSummary.total_budget,
            total_spent: budgetSummary.total_spent,
            remaining_budget: budgetSummary.remaining_budget,
            is_over_budget: budgetSummary.is_over_budget,
            spending_percentage: budgetSummary.spending_percentage,
          },
          timelineSummary: {
            total_tasks: timelineSummary.total_tasks,
            completed_tasks: timelineSummary.completed_tasks,
            overdue_tasks: timelineSummary.overdue_tasks,
            completion_rate: timelineSummary.completion_rate,
          },
          vendor_count: vendorCountRow.count,
        };
      });

      res.status(200).json({
        success: true,
        data: eventsWithStats,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getEventById(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = req.currentEvent!;
      const budgetSummary = BudgetService.getEventBudgetSummary(event.id, event.total_budget);
      const timelineSummary = TimelineService.getEventTimelineSummary(event.id);

      // Check if there is a cached AI plan
      const cachedPlanRow = db
        .prepare('SELECT plan_json, is_demo, model_used, updated_at FROM ai_generated_plans WHERE event_id = ?')
        .get(event.id) as { plan_json: string; is_demo: number; model_used: string; updated_at: string } | undefined;

      const aiPlan = cachedPlanRow ? JSON.parse(cachedPlanRow.plan_json) : null;

      res.status(200).json({
        success: true,
        data: {
          ...event,
          budgetSummary,
          timelineSummary,
          aiPlan: aiPlan
            ? {
                plan: aiPlan,
                is_demo: Boolean(cachedPlanRow?.is_demo),
                model: cachedPlanRow?.model_used,
                updated_at: cachedPlanRow?.updated_at,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createEvent(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        name,
        category,
        event_date,
        location,
        guest_count,
        total_budget,
        preferences,
        theme,
        notes,
      } = req.body;

      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      db.prepare(`
        INSERT INTO events (
          id, user_id, name, category, event_date, location, guest_count,
          total_budget, preferences, theme, notes, ai_plan_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_generated', datetime('now'), datetime('now'))
      `).run(
        eventId,
        userId,
        name.trim(),
        category,
        event_date,
        location.trim(),
        guest_count,
        total_budget,
        preferences?.trim() || null,
        theme?.trim() || null,
        notes?.trim() || null
      );

      const createdEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: createdEvent,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateEvent(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const current = req.currentEvent!;
      const {
        name,
        category,
        event_date,
        location,
        guest_count,
        total_budget,
        preferences,
        theme,
        notes,
      } = req.body;

      db.prepare(`
        UPDATE events SET
          name = COALESCE(?, name),
          category = COALESCE(?, category),
          event_date = COALESCE(?, event_date),
          location = COALESCE(?, location),
          guest_count = COALESCE(?, guest_count),
          total_budget = COALESCE(?, total_budget),
          preferences = COALESCE(?, preferences),
          theme = COALESCE(?, theme),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        name !== undefined ? name.trim() : null,
        category !== undefined ? category : null,
        event_date !== undefined ? event_date : null,
        location !== undefined ? location.trim() : null,
        guest_count !== undefined ? guest_count : null,
        total_budget !== undefined ? total_budget : null,
        preferences !== undefined ? preferences.trim() : null,
        theme !== undefined ? theme.trim() : null,
        notes !== undefined ? notes.trim() : null,
        eventId
      );

      // If event_date changed, recalculate due_dates for existing timeline tasks based on days_before_event
      if (event_date && event_date !== current.event_date) {
        const tasks = db
          .prepare('SELECT id, days_before_event FROM timeline_tasks WHERE event_id = ?')
          .all(eventId) as Array<{ id: string; days_before_event: number }>;

        const updateDueDateStmt = db.prepare(
          'UPDATE timeline_tasks SET due_date = ?, updated_at = datetime(\'now\') WHERE id = ?'
        );

        for (const t of tasks) {
          const newDueDate = TimelineService.calculateDueDate(event_date, t.days_before_event);
          updateDueDateStmt.run(newDueDate, t.id);
        }
      }

      const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);

      res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteEvent(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      db.prepare('DELETE FROM events WHERE id = ?').run(eventId);

      res.status(200).json({
        success: true,
        message: 'Event and associated records deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
