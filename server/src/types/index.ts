import { z } from 'zod';

// ==========================================
// Enums and Constants
// ==========================================

export const EVENT_CATEGORIES = ['Wedding', 'Birthday', 'Community Event', 'Corporate', 'Anniversary', 'Other'] as const;
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

export const VENDOR_STATUSES = ['inquiry', 'quoted', 'contract_sent', 'booked', 'completed', 'cancelled'] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

// ==========================================
// Database Models
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
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
  is_ai_generated: number; // 0 or 1
  created_at: string;
  updated_at: string;
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

export interface AIRecommendation {
  id: string;
  event_id: string;
  section: string;
  title: string;
  content: string;
  affordable_alternatives?: string;
  created_at: string;
}

// ==========================================
// Zod Validation Schemas
// ==========================================

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createEventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters').max(100),
  category: z.enum(EVENT_CATEGORIES),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  location: z.string().min(2, 'Location is required').max(120),
  guest_count: z.number().int().positive('Guest count must be at least 1'),
  total_budget: z.number().nonnegative('Total budget cannot be negative'),
  preferences: z.string().max(1000).optional(),
  theme: z.string().max(150).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const createExpenseSchema = z.object({
  category: z.enum(VENDOR_CATEGORIES),
  title: z.string().min(2, 'Expense title is required').max(100),
  amount: z.number().positive('Expense amount must be greater than 0'),
  paid_to: z.string().max(100).optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(EXPENSE_STATUSES).default('planned'),
  notes: z.string().max(500).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createAllocationSchema = z.object({
  category: z.enum(VENDOR_CATEGORIES),
  allocated_amount: z.number().nonnegative('Allocated amount cannot be negative'),
  notes: z.string().max(500).optional(),
});

export const createTimelineTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required').max(120),
  description: z.string().max(1000).optional(),
  category: z.enum(VENDOR_CATEGORIES).default('Event Management'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  days_before_event: z.number().int().optional(),
  status: z.enum(TASK_STATUSES).default('pending'),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
});

export const updateTimelineTaskSchema = createTimelineTaskSchema.partial();

export const createVendorSchema = z.object({
  category: z.enum(VENDOR_CATEGORIES),
  company_name: z.string().min(2, 'Company name is required').max(100),
  contact_person: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  estimated_cost: z.number().nonnegative().default(0),
  actual_cost: z.number().nonnegative().default(0),
  status: z.enum(VENDOR_STATUSES).default('inquiry'),
  notes: z.string().max(1000).optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export const aiPlanPromptSchema = z.object({
  prompt: z.string().min(10, 'Please provide more details for the AI planner (at least 10 characters)').max(2000),
  preferences: z.string().max(1000).optional(),
  focusAreas: z.array(z.string()).optional(),
});

// ==========================================
// Structured AI Output Schemas
// ==========================================

export const aiPlanOutputSchema = z.object({
  event_overview: z.string(),
  recommended_theme: z.string(),
  theme_description: z.string(),
  budget_distribution: z.array(
    z.object({
      category: z.enum(VENDOR_CATEGORIES),
      allocated_percentage: z.number().min(0).max(100),
      estimated_amount: z.number().nonnegative(),
      cost_breakdown_notes: z.string(),
    })
  ),
  preparation_timeline: z.array(
    z.object({
      days_before_event: z.number().int(),
      phase_name: z.string(),
      tasks: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          category: z.enum(VENDOR_CATEGORIES),
          priority: z.enum(TASK_PRIORITIES),
        })
      ),
    })
  ),
  vendor_categories: z.array(
    z.object({
      category: z.enum(VENDOR_CATEGORIES),
      estimated_benchmark_cost: z.number().nonnegative(),
      key_evaluation_criteria: z.array(z.string()),
      questions_to_ask_vendor: z.array(z.string()),
      suggested_service_scope: z.string(),
    })
  ),
  decoration_suggestions: z.array(z.string()),
  food_catering_ideas: z.array(z.string()),
  entertainment_suggestions: z.array(z.string()),
  personalized_recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      affordable_alternative: z.string(),
    })
  ),
});

export type AIPlanOutput = z.infer<typeof aiPlanOutputSchema>;

// ==========================================
// Computed Metrics Types
// ==========================================

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
  category_breakdown: Array<{
    category: VendorCategory;
    allocated: number;
    spent: number;
    remaining: number;
    is_over_budget: boolean;
    expense_count: number;
  }>;
}

export interface TimelineSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}
