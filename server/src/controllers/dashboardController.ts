import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { Event, TimelineTask, Expense } from '../types';
import { TimelineService } from '../services/timelineService';

export class DashboardController {
  public static async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Fetch all events for this user
      const events = db
        .prepare('SELECT * FROM events WHERE user_id = ? ORDER BY event_date ASC')
        .all(userId) as Event[];

      if (events.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            has_events: false,
            total_events: 0,
            next_event: null,
            total_budget: 0,
            total_spent: 0,
            remaining_budget: 0,
            over_budget_events_count: 0,
            task_stats: {
              total_tasks: 0,
              completed_tasks: 0,
              pending_tasks: 0,
              overdue_tasks: 0,
              completion_rate: 0,
            },
            upcoming_deadlines: [],
            recent_expenses: [],
          },
        });
        return;
      }

      // Next upcoming event (event_date >= today, or earliest future)
      const upcomingEvents = events.filter((e) => e.event_date >= todayStr);
      const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : events[events.length - 1];
      const daysUntilNext = nextEvent
        ? Math.round((new Date(nextEvent.event_date + 'T00:00:00Z').getTime() - new Date(todayStr + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // 2. Budget aggregation
      let totalBudget = 0;
      let totalSpent = 0;
      let overBudgetEventsCount = 0;

      const eventIds = events.map((e) => e.id);
      const placeholders = eventIds.map(() => '?').join(',');

      for (const ev of events) {
        totalBudget += Number(ev.total_budget) || 0;
      }

      const expensesSumRow = db
        .prepare(`SELECT SUM(amount) as total FROM expenses WHERE event_id IN (${placeholders})`)
        .get(...eventIds) as { total: number | null };

      totalSpent = expensesSumRow.total || 0;

      // Check per-event overbudget
      for (const ev of events) {
        const evSpent = db
          .prepare('SELECT SUM(amount) as total FROM expenses WHERE event_id = ?')
          .get(ev.id) as { total: number | null };
        if ((evSpent.total || 0) > ev.total_budget) {
          overBudgetEventsCount++;
        }
      }

      // 3. Task aggregation
      const allTasks = db
        .prepare(`SELECT * FROM timeline_tasks WHERE event_id IN (${placeholders})`)
        .all(...eventIds) as TimelineTask[];

      const taskStats = TimelineService.calculateSummary(allTasks, todayStr);

      // 4. Upcoming task deadlines across all events (pending or in_progress, due_date >= today)
      const upcomingDeadlines = db
        .prepare(`
          SELECT t.*, e.name as event_name, e.category as event_category
          FROM timeline_tasks t
          JOIN events e ON t.event_id = e.id
          WHERE t.event_id IN (${placeholders})
            AND t.status IN ('pending', 'in_progress')
          ORDER BY t.due_date ASC
          LIMIT 6
        `)
        .all(...eventIds);

      // 5. Recent expenses across all events
      const recentExpenses = db
        .prepare(`
          SELECT ex.*, e.name as event_name
          FROM expenses ex
          JOIN events e ON ex.event_id = e.id
          WHERE ex.event_id IN (${placeholders})
          ORDER BY ex.expense_date DESC, ex.created_at DESC
          LIMIT 6
        `)
        .all(...eventIds);

      res.status(200).json({
        success: true,
        data: {
          has_events: true,
          total_events: events.length,
          next_event: nextEvent
            ? {
                id: nextEvent.id,
                name: nextEvent.name,
                category: nextEvent.category,
                event_date: nextEvent.event_date,
                location: nextEvent.location,
                days_until: daysUntilNext,
              }
            : null,
          total_budget: totalBudget,
          total_spent: totalSpent,
          remaining_budget: totalBudget - totalSpent,
          over_budget_events_count: overBudgetEventsCount,
          task_stats: taskStats,
          upcoming_deadlines: upcomingDeadlines,
          recent_expenses: recentExpenses,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
