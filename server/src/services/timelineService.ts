import { db } from '../db';
import { TimelineTask, TimelineSummary } from '../types';

export class TimelineService {
  /**
   * Computes due_date ISO string (YYYY-MM-DD) from event_date and days_before_event.
   */
  public static calculateDueDate(eventDateStr: string, daysBeforeEvent: number): string {
    const eventDate = new Date(eventDateStr + 'T00:00:00Z');
    const dueDate = new Date(eventDate.getTime() - daysBeforeEvent * 24 * 60 * 60 * 1000);
    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Computes days_before_event from event_date and due_date.
   */
  public static calculateDaysBefore(eventDateStr: string, dueDateStr: string): number {
    const eventDate = new Date(eventDateStr + 'T00:00:00Z');
    const dueDate = new Date(dueDateStr + 'T00:00:00Z');
    const diffTime = eventDate.getTime() - dueDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Determines if a task is overdue based on current date.
   */
  public static isTaskOverdue(task: TimelineTask, currentDateStr?: string): boolean {
    if (task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }
    const today = currentDateStr || new Date().toISOString().split('T')[0];
    return task.due_date < today;
  }

  /**
   * Pure calculation: Computes progress metrics and counts overdue tasks.
   */
  public static calculateSummary(tasks: TimelineTask[], currentDateStr?: string): TimelineSummary {
    const total = tasks.length;
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let overdue = 0;

    for (const t of tasks) {
      if (t.status === 'completed') {
        completed++;
      } else if (t.status === 'in_progress') {
        inProgress++;
        if (this.isTaskOverdue(t, currentDateStr)) {
          overdue++;
        }
      } else if (t.status === 'pending') {
        pending++;
        if (this.isTaskOverdue(t, currentDateStr)) {
          overdue++;
        }
      }
    }

    const completionRate = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;

    return {
      total_tasks: total,
      completed_tasks: completed,
      pending_tasks: pending,
      in_progress_tasks: inProgress,
      overdue_tasks: overdue,
      completion_rate: completionRate,
    };
  }

  /**
   * Groups tasks into chronological milestones/phases for display.
   */
  public static groupTasksByPhase(tasks: TimelineTask[]) {
    const sorted = [...tasks].sort((a, b) => b.days_before_event - a.days_before_event);

    const phases = [
      { name: '60+ Days Before', minDays: 60, maxDays: Infinity, tasks: [] as TimelineTask[] },
      { name: '30 - 59 Days Before', minDays: 30, maxDays: 59, tasks: [] as TimelineTask[] },
      { name: '15 - 29 Days Before', minDays: 15, maxDays: 29, tasks: [] as TimelineTask[] },
      { name: '7 - 14 Days Before', minDays: 7, maxDays: 14, tasks: [] as TimelineTask[] },
      { name: '1 - 6 Days Before', minDays: 1, maxDays: 6, tasks: [] as TimelineTask[] },
      { name: 'Day of Event & Post-Event', minDays: -Infinity, maxDays: 0, tasks: [] as TimelineTask[] },
    ];

    for (const task of sorted) {
      const match = phases.find(
        (p) => task.days_before_event >= p.minDays && task.days_before_event <= p.maxDays
      );
      if (match) {
        match.tasks.push(task);
      } else {
        phases[phases.length - 1].tasks.push(task);
      }
    }

    return phases.filter((p) => p.tasks.length > 0);
  }

  /**
   * Retrieves summary from database for a specific event.
   */
  public static getEventTimelineSummary(eventId: string): TimelineSummary {
    const tasks = db
      .prepare('SELECT * FROM timeline_tasks WHERE event_id = ?')
      .all(eventId) as TimelineTask[];
    return this.calculateSummary(tasks);
  }
}
