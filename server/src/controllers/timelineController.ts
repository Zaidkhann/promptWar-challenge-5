import { Response, NextFunction } from 'express';
import { db } from '../db';
import { AppError } from '../middleware/errorHandler';
import { RequestWithEvent } from '../middleware/eventOwner';
import { TimelineService } from '../services/timelineService';
import { TimelineTask } from '../types';

export class TimelineController {
  public static async getTasks(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = req.currentEvent!;
      const tasks = db
        .prepare('SELECT * FROM timeline_tasks WHERE event_id = ? ORDER BY days_before_event DESC, due_date ASC')
        .all(event.id) as TimelineTask[];

      // Enhance tasks with computed is_overdue property
      const enhancedTasks = tasks.map((t) => ({
        ...t,
        is_overdue: TimelineService.isTaskOverdue(t),
      }));

      const summary = TimelineService.calculateSummary(tasks);
      const phases = TimelineService.groupTasksByPhase(enhancedTasks as any);

      res.status(200).json({
        success: true,
        data: {
          tasks: enhancedTasks,
          phases,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createTask(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = req.currentEvent!;
      const { title, description, category, due_date, days_before_event, status, priority } = req.body;

      let computedDueDate = due_date;
      let computedDaysBefore = days_before_event;

      if (!computedDueDate && computedDaysBefore !== undefined) {
        computedDueDate = TimelineService.calculateDueDate(event.event_date, computedDaysBefore);
      } else if (computedDueDate && computedDaysBefore === undefined) {
        computedDaysBefore = TimelineService.calculateDaysBefore(event.event_date, computedDueDate);
      } else if (!computedDueDate && computedDaysBefore === undefined) {
        // Default to 7 days before event
        computedDaysBefore = 7;
        computedDueDate = TimelineService.calculateDueDate(event.event_date, 7);
      }

      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      db.prepare(`
        INSERT INTO timeline_tasks (
          id, event_id, title, description, category, due_date, days_before_event, status, priority, is_ai_generated, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
      `).run(
        taskId,
        event.id,
        title.trim(),
        description?.trim() || null,
        category || 'Event Management',
        computedDueDate,
        computedDaysBefore,
        status || 'pending',
        priority || 'medium'
      );

      const created = db.prepare('SELECT * FROM timeline_tasks WHERE id = ?').get(taskId) as TimelineTask;
      const enhanced = { ...created, is_overdue: TimelineService.isTaskOverdue(created) };
      const summary = TimelineService.getEventTimelineSummary(event.id);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
          task: enhanced,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateTask(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = req.currentEvent!;
      const taskId = req.params.taskId;
      const { title, description, category, due_date, days_before_event, status, priority } = req.body;

      const existing = db
        .prepare('SELECT * FROM timeline_tasks WHERE id = ? AND event_id = ?')
        .get(taskId, event.id) as TimelineTask | undefined;

      if (!existing) {
        throw new AppError('Timeline task not found for this event', 404);
      }

      let newDueDate = due_date;
      let newDaysBefore = days_before_event;

      if (due_date && due_date !== existing.due_date && days_before_event === undefined) {
        newDaysBefore = TimelineService.calculateDaysBefore(event.event_date, due_date);
      } else if (days_before_event !== undefined && days_before_event !== existing.days_before_event && !due_date) {
        newDueDate = TimelineService.calculateDueDate(event.event_date, days_before_event);
      }

      db.prepare(`
        UPDATE timeline_tasks SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          due_date = COALESCE(?, due_date),
          days_before_event = COALESCE(?, days_before_event),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        title !== undefined ? title.trim() : null,
        description !== undefined ? description.trim() : null,
        category !== undefined ? category : null,
        newDueDate !== undefined ? newDueDate : null,
        newDaysBefore !== undefined ? newDaysBefore : null,
        status !== undefined ? status : null,
        priority !== undefined ? priority : null,
        taskId
      );

      const updated = db.prepare('SELECT * FROM timeline_tasks WHERE id = ?').get(taskId) as TimelineTask;
      const enhanced = { ...updated, is_overdue: TimelineService.isTaskOverdue(updated) };
      const summary = TimelineService.getEventTimelineSummary(event.id);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: {
          task: enhanced,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteTask(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const taskId = req.params.taskId;

      const existing = db.prepare('SELECT id FROM timeline_tasks WHERE id = ? AND event_id = ?').get(taskId, eventId);
      if (!existing) {
        throw new AppError('Timeline task not found for this event', 404);
      }

      db.prepare('DELETE FROM timeline_tasks WHERE id = ?').run(taskId);
      const summary = TimelineService.getEventTimelineSummary(eventId);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  }
}
