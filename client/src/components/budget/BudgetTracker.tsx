import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Filter,
  DollarSign,
  PieChart,
  X,
} from 'lucide-react';
import {
  VENDOR_CATEGORIES,
  VendorCategory,
  EXPENSE_STATUSES,
  ExpenseStatus,
  Expense,
  BudgetSummary,
} from '../../types';
import { budgetService } from '../../services/budgetService';
import { useEvent } from '../../context/EventContext';

export const BudgetTracker: React.FC = () => {
  const { activeEvent, refreshActiveEvent, refreshEvents } = useEvent();

  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states for Expense
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<VendorCategory>('Venue');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseStatus, setExpenseStatus] = useState<ExpenseStatus>('planned');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Form states for Allocation
  const [allocCategory, setAllocCategory] = useState<VendorCategory>('Venue');
  const [allocAmount, setAllocAmount] = useState<number>(0);

  const [formError, setFormError] = useState<string | null>(null);

  const loadBudgetData = async () => {
    if (!activeEvent) return;
    try {
      setLoading(true);
      const [sumRes, expRes] = await Promise.all([
        budgetService.getSummary(activeEvent.id),
        budgetService.getExpenses(activeEvent.id, {
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
        }),
      ]);
      setSummary(sumRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      console.error('Failed to load budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, [activeEvent, categoryFilter, statusFilter]);

  if (!activeEvent) {
    return (
      <div className="card empty-state">
        <Wallet size={40} color="var(--primary-600)" style={{ margin: '0 auto 12px' }} />
        <h3 className="empty-state-title">Select or Create an Event First</h3>
        <p className="empty-state-desc">
          Choose an active event to track budgets, record deposits, and monitor expenses.
        </p>
      </div>
    );
  }

  const handleOpenExpenseModal = (expense?: Expense) => {
    setFormError(null);
    if (expense) {
      setEditingExpense(expense);
      setExpenseTitle(expense.title);
      setExpenseCategory(expense.category);
      setExpenseAmount(expense.amount);
      setExpenseDate(expense.expense_date);
      setExpensePaidTo(expense.paid_to || '');
      setExpenseStatus(expense.status);
      setExpenseNotes(expense.notes || '');
    } else {
      setEditingExpense(null);
      setExpenseTitle('');
      setExpenseCategory('Venue');
      setExpenseAmount(0);
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpensePaidTo('');
      setExpenseStatus('planned');
      setExpenseNotes('');
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (expenseAmount <= 0) {
      setFormError('Expense amount must be greater than 0');
      return;
    }

    try {
      const payload = {
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: Number(expenseAmount),
        expense_date: expenseDate,
        paid_to: expensePaidTo.trim() || undefined,
        status: expenseStatus,
        notes: expenseNotes.trim() || undefined,
      };

      if (editingExpense) {
        await budgetService.updateExpense(activeEvent.id, editingExpense.id, payload);
      } else {
        await budgetService.createExpense(activeEvent.id, payload);
      }

      setIsExpenseModalOpen(false);
      await loadBudgetData();
      await refreshActiveEvent();
      await refreshEvents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await budgetService.deleteExpense(activeEvent.id, id);
      await loadBudgetData();
      await refreshActiveEvent();
      await refreshEvents();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await budgetService.setAllocation(activeEvent.id, {
        category: allocCategory,
        allocated_amount: Number(allocAmount),
      });
      setIsAllocModalOpen(false);
      await loadBudgetData();
      await refreshActiveEvent();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save allocation');
    }
  };

  const isOverBudget = summary?.is_over_budget;

  return (
    <div>
      {/* Financial Overview KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Budget</div>
            <div className="stat-value">₹{activeEvent.total_budget.toLocaleString()}</div>
            <div className="stat-subtext">Set during event creation</div>
          </div>
          <div className="stat-icon stat-icon-blue">
            <Wallet size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Allocated</div>
            <div className="stat-value">₹{(summary?.total_allocated || 0).toLocaleString()}</div>
            <div className="stat-subtext">
              {summary?.allocation_percentage}% assigned to categories
            </div>
          </div>
          <div className="stat-icon stat-icon-blue">
            <PieChart size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Actual Expenses Spent</div>
            <div className="stat-value">₹{(summary?.total_spent || 0).toLocaleString()}</div>
            <div className="stat-subtext">
              {summary?.spending_percentage}% of total budget spent
            </div>
          </div>
          <div className="stat-icon stat-icon-amber">
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
              ₹{(summary?.remaining_budget || 0).toLocaleString()}
            </div>
            <div className="stat-subtext">
              {isOverBudget ? (
                <span style={{ color: 'var(--danger-700)', fontWeight: 600 }}>Over budget deficit!</span>
              ) : (
                `₹${(summary?.unallocated_budget || 0).toLocaleString()} unallocated buffer`
              )}
            </div>
          </div>
          <div className={`stat-icon ${isOverBudget ? 'stat-icon-rose' : 'stat-icon-green'}`}>
            {isOverBudget ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
          </div>
        </div>
      </div>

      {/* Over-budget Warning Alert */}
      {isOverBudget && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle size={20} color="var(--danger-700)" />
          <div>
            <strong>Budget Exceeded Alert:</strong> Recorded expenses exceed total event budget by ₹
            {summary.over_budget_amount.toLocaleString()}. Check category breakdowns below to identify over-spending.
          </div>
        </div>
      )}

      {/* Category Allocations vs Spending Progress Bars */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <PieChart size={20} color="var(--primary-600)" />
            <span>Category Budget vs Actual Spending</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setAllocCategory('Venue');
              setAllocAmount(0);
              setIsAllocModalOpen(true);
            }}
          >
            <Plus size={14} />
            <span>Set Category Allocation</span>
          </button>
        </div>

        {summary?.category_breakdown.length === 0 ? (
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', textAlign: 'center', padding: '20px 0' }}>
            No category allocations or expenses yet. Generate an AI Master Plan or click "Set Category Allocation" above.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {summary?.category_breakdown.map((cat, idx) => {
              const pct = cat.allocated > 0 ? Math.min(100, Math.round((cat.spent / cat.allocated) * 100)) : 0;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: cat.is_over_budget ? 'var(--danger-50)' : '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{cat.category}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: cat.is_over_budget ? 'var(--danger-700)' : 'var(--slate-600)',
                      }}
                    >
                      ₹{cat.spent.toLocaleString()} / ₹{cat.allocated.toLocaleString()}
                    </span>
                  </div>

                  <div className="progress-container" style={{ height: '6px', marginBottom: '8px' }}>
                    <div
                      className={`progress-bar ${cat.is_over_budget ? 'progress-danger' : 'progress-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--slate-500)' }}>{cat.expense_count} expense(s)</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: cat.is_over_budget ? 'var(--danger-700)' : 'var(--success-700)',
                      }}
                    >
                      {cat.is_over_budget
                        ? `Over by ₹${Math.abs(cat.remaining).toLocaleString()}`
                        : `₹${cat.remaining.toLocaleString()} remaining`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expense Management Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="card-title">
            <Wallet size={20} color="var(--primary-600)" />
            <span>Expense Tracking Log</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter expenses by category"
            >
              <option value="">All Categories</option>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter expenses by status"
            >
              <option value="">All Statuses</option>
              {EXPENSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenExpenseModal()}
            >
              <Plus size={16} />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--slate-500)' }}>
            <p>No expenses found for this filter. Click "Record Expense" to track a deposit, invoice, or purchase.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount (₹)</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Paid To</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{exp.title}</div>
                      {exp.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{exp.notes}</div>
                      )}
                    </td>
                    <td>{exp.category}</td>
                    <td style={{ fontWeight: 700 }}>₹{exp.amount.toLocaleString()}</td>
                    <td>{exp.expense_date}</td>
                    <td>
                      <span
                        className={`badge ${
                          exp.status === 'paid'
                            ? 'badge-success'
                            : exp.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td>{exp.paid_to || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '6px', padding: '4px 8px' }}
                        onClick={() => handleOpenExpenseModal(exp)}
                        title="Edit expense"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleDeleteExpense(exp.id)}
                        title="Delete expense"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 id="expense-modal-title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsExpenseModalOpen(false)}
                style={{ border: 'none', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger" style={{ marginBottom: '14px' }}>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="expense-title">
                    Expense Title <span style={{ color: 'var(--danger-500)' }}>*</span>
                  </label>
                  <input
                    id="expense-title"
                    type="text"
                    className="form-input"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="e.g. Venue 50% Advance Booking"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="expense-category">
                      Category <span style={{ color: 'var(--danger-500)' }}>*</span>
                    </label>
                    <select
                      id="expense-category"
                      className="form-select"
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as VendorCategory)}
                      required
                    >
                      {VENDOR_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="expense-amount">
                      Amount (₹) <span style={{ color: 'var(--danger-500)' }}>*</span>
                    </label>
                    <input
                      id="expense-amount"
                      type="number"
                      min="1"
                      step="100"
                      className="form-input"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="expense-date">
                      Expense Date <span style={{ color: 'var(--danger-500)' }}>*</span>
                    </label>
                    <input
                      id="expense-date"
                      type="date"
                      className="form-input"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="expense-status">
                      Payment Status <span style={{ color: 'var(--danger-500)' }}>*</span>
                    </label>
                    <select
                      id="expense-status"
                      className="form-select"
                      value={expenseStatus}
                      onChange={(e) => setExpenseStatus(e.target.value as ExpenseStatus)}
                      required
                    >
                      {EXPENSE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="expense-paid-to">
                    Paid To / Vendor Name
                  </label>
                  <input
                    id="expense-paid-to"
                    type="text"
                    className="form-input"
                    value={expensePaidTo}
                    onChange={(e) => setExpensePaidTo(e.target.value)}
                    placeholder="e.g. Royal Heritage Lawns Pvt Ltd"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="expense-notes">
                    Notes
                  </label>
                  <textarea
                    id="expense-notes"
                    className="form-textarea"
                    rows={2}
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    placeholder="Receipt reference, payment method, etc."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsExpenseModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Category Allocation Modal */}
      {isAllocModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="alloc-modal-title">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 id="alloc-modal-title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                Set Category Allocation
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsAllocModalOpen(false)}
                style={{ border: 'none', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAllocation}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="alloc-category">
                    Category
                  </label>
                  <select
                    id="alloc-category"
                    className="form-select"
                    value={allocCategory}
                    onChange={(e) => setAllocCategory(e.target.value as VendorCategory)}
                    required
                  >
                    {VENDOR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="alloc-amount">
                    Allocated Amount (₹)
                  </label>
                  <input
                    id="alloc-amount"
                    type="number"
                    min="0"
                    step="500"
                    className="form-input"
                    value={allocAmount}
                    onChange={(e) => setAllocAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAllocModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
