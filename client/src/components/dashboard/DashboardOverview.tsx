import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Wallet,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  PartyPopper,
  MapPin,
  Users,
} from 'lucide-react';
import { DashboardSummary } from '../../types';
import { dashboardService } from '../../services/dashboardService';
import { useEvent } from '../../context/EventContext';

interface DashboardOverviewProps {
  onNavigateTab: (tab: 'dashboard' | 'planner' | 'budget' | 'timeline' | 'vendors' | 'recommendations') => void;
  onOpenCreateEvent: () => void;
  onOpenExpenseModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
  onOpenCreateEvent,
  onOpenExpenseModal,
}) => {
  const { activeEvent } = useEvent();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await dashboardService.getSummary();
        if (res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [activeEvent]);

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--primary-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px', color: 'var(--slate-500)', fontSize: '0.875rem' }}>
          Loading real-time celebration metrics...
        </p>
      </div>
    );
  }

  if (!summary || !summary.has_events) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">
          <PartyPopper size={32} />
        </div>
        <h3 className="empty-state-title">Welcome to CelebraPlan AI</h3>
        <p className="empty-state-desc">
          Plan unforgettable weddings, birthdays, and community celebrations with AI budget allocation, vendor management, and preparation timelines.
        </p>
        <button type="button" className="btn btn-primary" onClick={onOpenCreateEvent}>
          <Plus size={16} aria-hidden="true" />
          <span>Create Your First Event</span>
        </button>
      </div>
    );
  }

  const isOverBudget = summary.remaining_budget < 0;

  return (
    <div>
      {/* Next Upcoming Celebration Highlight Banner */}
      {summary.next_event && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            color: '#ffffff',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Next Celebration
                </span>
                <span style={{ fontSize: '0.8125rem', opacity: 0.9 }}>
                  {summary.next_event.category}
                </span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
                {summary.next_event.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', opacity: 0.95 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} />
                  {summary.next_event.event_date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} />
                  {summary.next_event.location}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                {Math.max(0, summary.next_event.days_until)}
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase' }}>
                Days Remaining
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px', background: '#ffffff', color: 'var(--primary-800)', border: 'none' }}
                onClick={() => onNavigateTab('planner')}
              >
                <Sparkles size={14} color="var(--primary-600)" />
                <span>Open AI Planner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Financial & Task Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Allocated Budget</div>
            <div className="stat-value">₹{summary.total_budget.toLocaleString()}</div>
            <div className="stat-subtext">Across {summary.total_events} celebration(s)</div>
          </div>
          <div className="stat-icon stat-icon-blue" aria-hidden="true">
            <Wallet size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Expenses Spent</div>
            <div className="stat-value">₹{summary.total_spent.toLocaleString()}</div>
            <div className="stat-subtext">
              {summary.total_budget > 0
                ? `${Math.round((summary.total_spent / summary.total_budget) * 100)}% of total budget`
                : '0%'}
            </div>
          </div>
          <div className="stat-icon stat-icon-amber" aria-hidden="true">
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Remaining Balance</div>
            <div
              className="stat-value"
              style={{ color: isOverBudget ? 'var(--danger-700)' : 'var(--success-700)' }}
            >
              ₹{summary.remaining_budget.toLocaleString()}
            </div>
            <div className="stat-subtext">
              {isOverBudget ? (
                <span style={{ color: 'var(--danger-700)', fontWeight: 600 }}>Over budget warning!</span>
              ) : (
                'Healthy financial margin'
              )}
            </div>
          </div>
          <div
            className={`stat-icon ${isOverBudget ? 'stat-icon-rose' : 'stat-icon-green'}`}
            aria-hidden="true"
          >
            {isOverBudget ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Checklist Milestones</div>
            <div className="stat-value">
              {summary.task_stats.completed_tasks} / {summary.task_stats.total_tasks}
            </div>
            <div className="stat-subtext">
              {summary.task_stats.overdue_tasks > 0 ? (
                <span style={{ color: 'var(--danger-700)', fontWeight: 600 }}>
                  {summary.task_stats.overdue_tasks} milestone(s) overdue
                </span>
              ) : (
                `${summary.task_stats.completion_rate}% tasks completed`
              )}
            </div>
          </div>
          <div
            className={`stat-icon ${summary.task_stats.overdue_tasks > 0 ? 'stat-icon-rose' : 'stat-icon-blue'}`}
            aria-hidden="true"
          >
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Over-budget Alert Banner */}
      {isOverBudget && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle size={20} color="var(--danger-700)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
              Attention: Expenses Exceed Total Available Budget!
            </div>
            <div>
              Your current recorded expenses exceed the total budget by ₹
              {Math.abs(summary.remaining_budget).toLocaleString()}. Review category allocations or check affordable alternatives in the Recommendations tab.
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Upcoming Deadlines & Recent Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Upcoming Deadlines Widget */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} color="var(--primary-600)" aria-hidden="true" />
              <span>Upcoming Milestones</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('timeline')}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {summary.upcoming_deadlines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--slate-500)' }}>
              <p>No pending milestones scheduled. Use the AI planner to generate a tailored preparation timeline!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {summary.upcoming_deadlines.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--slate-200)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      {task.event_name} • Due: {task.due_date} ({task.days_before_event} days before)
                    </div>
                  </div>
                  <div>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses Widget */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Wallet size={20} color="var(--primary-600)" aria-hidden="true" />
              <span>Recent Expense Log</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenExpenseModal}
                title="Record new expense"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigateTab('budget')}
              >
                <span>Budget</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {summary.recent_expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--slate-500)' }}>
              <p>No expenses recorded yet. Click "Add" or open the Budget tab to track deposits and payments.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {summary.recent_expenses.map((expense) => (
                <div
                  key={expense.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--slate-50)',
                    border: '1px solid var(--slate-200)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
                      {expense.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      {expense.category} • {expense.expense_date}
                      {expense.paid_to && ` • Paid to ${expense.paid_to}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--slate-900)' }}>
                      ₹{expense.amount.toLocaleString()}
                    </div>
                    <span
                      className={`badge ${
                        expense.status === 'paid'
                          ? 'badge-success'
                          : expense.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }`}
                    >
                      {expense.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
