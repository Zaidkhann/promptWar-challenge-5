import { describe, it, expect } from 'vitest';
import { TimelineService } from '../services/timelineService';
import { TimelineTask } from '../types';

describe('TimelineService Unit Tests', () => {
  it('should accurately calculate due date from event date and days before event', () => {
    const eventDate = '2026-12-31';
    
    // 30 days before Dec 31 => Dec 1
    const dueDate30 = TimelineService.calculateDueDate(eventDate, 30);
    expect(dueDate30).toBe('2026-12-01');

    // 0 days before => Dec 31
    const dueDate0 = TimelineService.calculateDueDate(eventDate, 0);
    expect(dueDate0).toBe('2026-12-31');

    // 1 day before => Dec 30
    const dueDate1 = TimelineService.calculateDueDate(eventDate, 1);
    expect(dueDate1).toBe('2026-12-30');
  });

  it('should accurately calculate days before event from event date and due date', () => {
    const eventDate = '2026-12-31';
    const dueDate = '2026-12-01';

    const daysBefore = TimelineService.calculateDaysBefore(eventDate, dueDate);
    expect(daysBefore).toBe(30);
  });

  it('should detect overdue tasks when due date is in the past and task is pending', () => {
    const pastTask: TimelineTask = {
      id: 't1',
      event_id: 'e1',
      title: 'Book Caterer',
      category: 'Catering',
      due_date: '2026-10-15',
      days_before_event: 45,
      status: 'pending',
      priority: 'high',
      is_ai_generated: 1,
      created_at: '',
      updated_at: '',
    };

    const isOverdue = TimelineService.isTaskOverdue(pastTask, '2026-10-31');
    expect(isOverdue).toBe(true);

    // Completed task with past due date should NOT be considered overdue
    const completedTask = { ...pastTask, status: 'completed' as const };
    expect(TimelineService.isTaskOverdue(completedTask, '2026-10-31')).toBe(false);

    // Future due date should NOT be considered overdue
    const futureTask = { ...pastTask, due_date: '2026-11-15' };
    expect(TimelineService.isTaskOverdue(futureTask, '2026-10-31')).toBe(false);
  });

  it('should calculate task summary metrics correctly', () => {
    const tasks: TimelineTask[] = [
      {
        id: 't1',
        event_id: 'e1',
        title: 'Task 1',
        category: 'Venue',
        due_date: '2026-10-10', // overdue
        days_before_event: 50,
        status: 'pending',
        priority: 'high',
        is_ai_generated: 0,
        created_at: '',
        updated_at: '',
      },
      {
        id: 't2',
        event_id: 'e1',
        title: 'Task 2',
        category: 'Catering',
        due_date: '2026-10-15',
        days_before_event: 40,
        status: 'completed',
        priority: 'medium',
        is_ai_generated: 0,
        created_at: '',
        updated_at: '',
      },
      {
        id: 't3',
        event_id: 'e1',
        title: 'Task 3',
        category: 'Photography',
        due_date: '2026-11-20', // future
        days_before_event: 10,
        status: 'in_progress',
        priority: 'low',
        is_ai_generated: 0,
        created_at: '',
        updated_at: '',
      },
    ];

    const summary = TimelineService.calculateSummary(tasks, '2026-10-31');

    expect(summary.total_tasks).toBe(3);
    expect(summary.completed_tasks).toBe(1);
    expect(summary.pending_tasks).toBe(1);
    expect(summary.in_progress_tasks).toBe(1);
    expect(summary.overdue_tasks).toBe(1);
    expect(summary.completion_rate).toBe(33.3);
  });

  it('should group tasks chronologically into milestone phases', () => {
    const tasks: TimelineTask[] = [
      {
        id: 't1',
        event_id: 'e1',
        title: '60+ Day Task',
        category: 'Venue',
        due_date: '2026-10-01',
        days_before_event: 75,
        status: 'pending',
        priority: 'high',
        is_ai_generated: 1,
        created_at: '',
        updated_at: '',
      },
      {
        id: 't2',
        event_id: 'e1',
        title: '7-14 Day Task',
        category: 'Decoration',
        due_date: '2026-12-20',
        days_before_event: 10,
        status: 'pending',
        priority: 'medium',
        is_ai_generated: 1,
        created_at: '',
        updated_at: '',
      },
    ];

    const phases = TimelineService.groupTasksByPhase(tasks);
    expect(phases.length).toBe(2);
    expect(phases[0].name).toBe('60+ Days Before');
    expect(phases[0].tasks[0].title).toBe('60+ Day Task');
    expect(phases[1].name).toBe('7 - 14 Days Before');
    expect(phases[1].tasks[0].title).toBe('7-14 Day Task');
  });
});
