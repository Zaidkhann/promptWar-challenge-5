import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Filter,
  CheckSquare,
  Square,
  X,
  Layers,
} from 'lucide-react';
import {
  TimelineTask,
  TimelinePhase,
  TimelineSummary,
  TASK_PRIORITIES,
  TaskPriority,
  VENDOR_CATEGORIES,
  VendorCategory,
} from '../../types';
import { timelineService } from '../../services/timelineService';
import { useEvent } from '../../context/EventContext';

export const TimelineView: React.FC = () => {
  const { activeEvent, refreshActiveEvent, refreshEvents } = useEvent();

  const [phases, setPhases] = useState<TimelinePhase[]>([]);
  const [allTasks, setAllTasks] = useState<TimelineTask[]>([]);
  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Event Management');
  const [daysBeforeEvent, setDaysBeforeEvent] = useState<number>(30);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [formError, setFormError] = useState<string | null>(null);

  const loadTimelineData = async () => {
    if (!activeEvent) return;
    try {
      setLoading(true);
      const res = await timelineService.getTasks(activeEvent.id);
      setPhases(res.data.phases);
      setAllTasks(res.data.tasks);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to load timeline tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimelineData();
  }, [activeEvent]);

  if (!activeEvent) {
    return (
      <div className="card empty-state">
        <Calendar size={40} color="var(--primary-600)" style={{ margin: '0 auto 12px' }} />
        <h3 className="empty-state-title">Select or Create an Event First</h3>
        <p className="empty-state-desc">
          Choose an active celebration to manage preparation milestones, checklists, and vendor deadlines.
        </p>
      </div>
    );
  }

  const handleToggleTaskStatus = async (task: TimelineTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await timelineService.updateTask(activeEvent.id, task.id, { status: newStatus });
      await loadTimelineData();
      await refreshActiveEvent();
      await refreshEvents();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleOpenTaskModal = (task?: TimelineTask) => {
    setFormError(null);
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setDescription(task.description || '');
      setCategory(task.category);
      setDaysBeforeEvent(task.days_before_event);
      setPriority(task.priority);
    } else {
      setEditingTask(null);
      setTitle('');
      setDescription('');
      setCategory('Event Management');
      setDaysBeforeEvent(14);
      setPriority('medium');
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        days_before_event: Number(daysBeforeEvent),
        priority,
      };

      if (editingTask) {
        await timelineService.updateTask(activeEvent.id, editingTask.id, payload);
      } else {
        await timelineService.createTask(activeEvent.id, payload);
      }

      setIsTaskModalOpen(false);
      await loadTimelineData();
      await refreshActiveEvent();
      await refreshEvents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save milestone task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this milestone task?')) return;
    try {
      await timelineService.deleteTask(activeEvent.id, taskId);
      await loadTimelineData();
      await refreshActiveEvent();
      await refreshEvents();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const filteredTasks = allTasks.filter((t) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return t.status === 'completed';
    if (filterStatus === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (filterStatus === 'overdue') return t.is_overdue;
    return true;
  });

  return (
    <div>
      {/* Progress & Milestone Overview Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--primary-600)" />
              <span>Event Preparation Timeline & Checklists</span>
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '2px' }}>
              Scheduled for celebration on <strong>{activeEvent.event_date}</strong> in {activeEvent.location}.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenTaskModal()}
          >
            <Plus size={16} />
            <span>Add Custom Milestone</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
            <span>Milestone Completion Progress</span>
            <span style={{ color: 'var(--primary-700)' }}>
              {summary?.completed_tasks || 0} of {summary?.total_tasks || 0} completed ({summary?.completion_rate || 0}%)
            </span>
          </div>
          <div className="progress-container" style={{ height: '10px' }}>
            <div
              className="progress-bar progress-primary"
              style={{ width: `${summary?.completion_rate || 0}%` }}
            />
          </div>
        </div>

        {/* Overdue alert banner */}
        {(summary?.overdue_tasks || 0) > 0 && (
          <div className="alert alert-danger" style={{ margin: '14px 0 0' }}>
            <AlertTriangle size={18} color="var(--danger-700)" />
            <span>
              <strong>Action Needed:</strong> {summary?.overdue_tasks} milestone(s) are overdue based on today's date! Review pending tasks marked with the overdue tag.
            </span>
          </div>
        )}
      </div>

      {/* Task Filters & Grouping View */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({allTasks.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pending ({summary?.pending_tasks || 0})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus('completed')}
            >
              Completed ({summary?.completed_tasks || 0})
            </button>
            {(summary?.overdue_tasks || 0) > 0 && (
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === 'overdue' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setFilterStatus('overdue')}
              >
                Overdue ({summary?.overdue_tasks || 0})
              </button>
            )}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate-500)' }}>
            <p>No tasks found in this view. Use the AI planner to generate a full master timeline or add custom tasks.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${task.is_overdue ? '#fca5a5' : 'var(--slate-200)'}`,
                    backgroundColor: isCompleted
                      ? 'var(--slate-50)'
                      : task.is_overdue
                      ? 'var(--danger-50)'
                      : '#ffffff',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    {/* Interactive Toggle Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleTaskStatus(task)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: isCompleted ? 'var(--success-500)' : 'var(--slate-400)',
                      }}
                      title={isCompleted ? 'Mark pending' : 'Mark completed'}
                      aria-label={`Toggle task completion for: ${task.title}`}
                    >
                      {isCompleted ? <CheckCircle2 size={22} /> : <Square size={22} />}
                    </button>

                    <div style={{ textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.65 : 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--slate-900)' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                          {task.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        <span>Due: {task.due_date} ({task.days_before_event} days before event)</span>
                        <span>•</span>
                        <span>Category: {task.category}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {task.is_overdue && (
                      <span className="badge badge-danger">
                        OVERDUE
                      </span>
                    )}

                    <span
                      className={`badge ${
                        task.priority === 'high'
                          ? 'badge-danger'
                          : task.priority === 'medium'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }`}
                    >
                      {task.priority}
                    </span>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleOpenTaskModal(task)}
                      title="Edit task"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete task"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 id="task-modal-title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {editingTask ? 'Edit Milestone Task' : 'Add Preparation Milestone'}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsTaskModalOpen(false)}
                style={{ border: 'none', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger" style={{ marginBottom: '14px' }}>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="task-title">
                    Milestone Title <span style={{ color: 'var(--danger-500)' }}>*</span>
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Finalize Catering Menu Tasting"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="task-desc">
                    Description & Checklist Details
                  </label>
                  <textarea
                    id="task-desc"
                    className="form-textarea"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify action steps, who to contact, questions..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-category">
                      Category
                    </label>
                    <select
                      id="task-category"
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as VendorCategory)}
                    >
                      {VENDOR_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="task-priority">
                      Priority Level
                    </label>
                    <select
                      id="task-priority"
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="task-days-before">
                    Scheduled (Days Before Event) <span style={{ color: 'var(--danger-500)' }}>*</span>
                  </label>
                  <input
                    id="task-days-before"
                    type="number"
                    min="0"
                    className="form-input"
                    value={daysBeforeEvent}
                    onChange={(e) => setDaysBeforeEvent(parseInt(e.target.value) || 0)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '4px', display: 'block' }}>
                    Due date will be automatically computed relative to event date ({activeEvent.event_date}).
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Save Changes' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
