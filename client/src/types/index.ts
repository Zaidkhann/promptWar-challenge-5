export const EVENT_CATEGORIES = [
  'Wedding',
  'Birthday',
  'Community Event',
  'Corporate',
  'Anniversary',
  'Other',
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Decoration',
  'Music and Entertainment',
  'Transportation',
  'Event Management',
  'Attire and Beauty',
  'Invitations and Gifts',
  'Other',
] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const EXPENSE_STATUSES = ['planned', 'pending', 'paid'] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const VENDOR_STATUSES = [
  'inquiry',
  'quoted',
  'contract_sent',
  'booked',
  'completed',
  'cancelled',
] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Event {
  id: string;
  user_id: string;
  name: string;
  category: EventCategory;
  event_date: string;
  location: string;
  guest_count: number;
  total_budget: number;
  preferences?: string;
  theme?: string;
  notes?: string;
  ai_plan_status?: 'not_generated' | 'generating' | 'generated' | 'failed';
  created_at: string;
  updated_at: string;
  budgetSummary?: {
    total_budget: number;
    total_spent: number;
    remaining_budget: number;
    is_over_budget: boolean;
    spending_percentage: number;
  };
  timelineSummary?: {
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    completion_rate: number;
  };
  vendor_count?: number;
}

export interface BudgetCategoryBreakdown {
  category: VendorCategory;
  allocated: number;
  spent: number;
  remaining: number;
  is_over_budget: boolean;
  expense_count: number;
}

export interface BudgetSummary {
  total_budget: number;
  total_allocated: number;
  total_spent: number;
  remaining_budget: number;
  unallocated_budget: number;
  spending_percentage: number;
  allocation_percentage: number;
  is_over_budget: boolean;
  over_budget_amount: number;
  category_breakdown: BudgetCategoryBreakdown[];
}

export interface BudgetAllocation {
  id: string;
  event_id: string;
  category: VendorCategory;
  allocated_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  event_id: string;
  category: VendorCategory;
  title: string;
  amount: number;
  paid_to?: string;
  expense_date: string;
  status: ExpenseStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineTask {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  category: VendorCategory;
  due_date: string;
  days_before_event: number;
  status: TaskStatus;
  priority: TaskPriority;
  is_ai_generated: number;
  is_overdue?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimelinePhase {
  name: string;
  minDays: number;
  maxDays: number;
  tasks: TimelineTask[];
}

export interface TimelineSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

export interface Vendor {
  id: string;
  event_id: string;
  category: VendorCategory;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  estimated_cost: number;
  actual_cost: number;
  status: VendorStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorSummary {
  total_vendors: number;
  booked_vendors: number;
  total_estimated_cost: number;
  total_actual_cost: number;
}

export interface AIRecommendation {
  id: string;
  event_id: string;
  section: string;
  title: string;
  content: string;
  affordable_alternatives?: string;
  created_at: string;
}

export interface AIPlanOutput {
  event_overview: string;
  recommended_theme: string;
  theme_description: string;
  budget_distribution: Array<{
    category: VendorCategory;
    allocated_percentage: number;
    estimated_amount: number;
    cost_breakdown_notes: string;
  }>;
  preparation_timeline: Array<{
    days_before_event: number;
    phase_name: string;
    tasks: Array<{
      title: string;
      description: string;
      category: VendorCategory;
      priority: TaskPriority;
    }>;
  }>;
  vendor_categories: Array<{
    category: VendorCategory;
    estimated_benchmark_cost: number;
    key_evaluation_criteria: string[];
    questions_to_ask_vendor: string[];
    suggested_service_scope: string;
  }>;
  decoration_suggestions: string[];
  food_catering_ideas: string[];
  entertainment_suggestions: string[];
  personalized_recommendations: Array<{
    title: string;
    description: string;
    affordable_alternative: string;
  }>;
}

export interface DashboardSummary {
  has_events: boolean;
  total_events: number;
  next_event: {
    id: string;
    name: string;
    category: EventCategory;
    event_date: string;
    location: string;
    days_until: number;
  } | null;
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  over_budget_events_count: number;
  task_stats: TimelineSummary;
  upcoming_deadlines: Array<TimelineTask & { event_name: string; event_category: string }>;
  recent_expenses: Array<Expense & { event_name: string }>;
}
