import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

// Ensure data directory exists
const resolvedDbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(resolvedDbPath);

// Enable WAL mode for high performance concurrency & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Events table
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      event_date TEXT NOT NULL,
      location TEXT NOT NULL,
      guest_count INTEGER NOT NULL,
      total_budget REAL NOT NULL,
      preferences TEXT,
      theme TEXT,
      notes TEXT,
      ai_plan_status TEXT NOT NULL DEFAULT 'not_generated',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Budget allocations table
    CREATE TABLE IF NOT EXISTS budget_allocations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      category TEXT NOT NULL,
      allocated_amount REAL NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(event_id, category),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Expenses table
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_to TEXT,
      expense_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Timeline Tasks table
    CREATE TABLE IF NOT EXISTS timeline_tasks (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      due_date TEXT NOT NULL,
      days_before_event INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      is_ai_generated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Vendors table
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      category TEXT NOT NULL,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      estimated_cost REAL NOT NULL DEFAULT 0,
      actual_cost REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'inquiry',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- AI Recommendations table
    CREATE TABLE IF NOT EXISTS ai_recommendations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      affordable_alternatives TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- AI Generated Plans Cache table
    CREATE TABLE IF NOT EXISTS ai_generated_plans (
      id TEXT PRIMARY KEY,
      event_id TEXT UNIQUE NOT NULL,
      plan_json TEXT NOT NULL,
      model_used TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
    CREATE INDEX IF NOT EXISTS idx_allocations_event_id ON budget_allocations(event_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_tasks_event_id ON timeline_tasks(event_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON timeline_tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON timeline_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_vendors_event_id ON vendors(event_id);
    CREATE INDEX IF NOT EXISTS idx_ai_recs_event_id ON ai_recommendations(event_id);
  `);
}
