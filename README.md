# CelebraPlan AI — Celebration & Event Planner
**Hack2Skill PromptWars Hackathon — Challenge 5**

An intelligent, full-stack, GenAI-powered Celebration & Event Planning platform designed for organizing weddings, birthdays, community gatherings, and corporate galas. Built with **Node.js, Express, TypeScript, SQLite, Google Gemini 2.5 Flash, React 19, and Vite**.

---

## 🌟 Key Application Features

### 1. Intelligent Event Creation
- Comprehensive event setup: **Event Name, Category** (*Wedding, Birthday, Community Event, Corporate, Anniversary, Other*), **Event Date, Location, Guest Count, Total Budget, Theme/Style, Preferences, and Special Notes**.
- Instant option to launch the AI Master Planner immediately upon event creation.

### 2. AI Event Planning Assistant (Central Intelligence Layer)
- Natural language requirement input (e.g. *"I want to organize a birthday party for 50 people in Bhopal with a budget of ₹50,000. I prefer a modern theme with good food, decorations, photography, and entertainment."*).
- **Gemini 2.5 Flash Integration**: Structured JSON schema generation validated strictly with **Zod**.
- Generates:
  - **Event Overview & Recommended Theme** with visual styling rationale.
  - **Realistic Budget Distribution** (percentage and estimated ₹ amounts roughly matching the total budget).
  - **Preparation Timeline** with phased milestones relative to the real event date.
  - **Vendor Benchmark Specifications** (estimated costs, evaluation criteria, and vetting questions).
  - **Decor, Food & Catering, and Entertainment Suggestions**.
  - **Personalized Recommendations** with actionable cost-saving substitutions.
- **1-Click Apply Plan**: Transacts allocations, timeline tasks, vendor benchmarks, and recommendations directly into the database.
- **Graceful Fallback Mode**: Clearly labeled deterministic demo mode if offline or if API limits are reached. Never silently hallucinates fake API calls.

### 3. Smart Budget Management & Expense Tracking
- **Real-Time Financial Calculations**: Total budget, allocated budget, actual expenses spent, remaining balance, and unallocated buffer calculated via pure backend business logic.
- **Category Allocation Progress Bars**: Interactive visual meters tracking spend vs allocation across all 10 event categories.
- **Over-Budget Warnings**: Prominent accessible alerts (icon + text + amount deficit) when expenses exceed category allocation or total event budget.
- **Expense Log**: Add, edit, filter (by category & status: *Planned, Pending, Paid*), and delete expenses.

### 4. Event Preparation Timeline & Task Management
- Actionable preparation timeline computed relative to the actual event date (e.g. *60+ days before, 30 days before, 14 days before, 7 days before, Day-Of*).
- **Dynamic Overdue Detection**: Tasks whose due date is past relative to today's date are automatically flagged as overdue with warning badges.
- **Interactive Checkbox Toggle**: One-click completion status toggling with instant completion rate percentage updates.
- **Milestone Filtering & Custom Tasks**: Filter by *All, Pending, Completed, Overdue*, or add custom milestone tasks.

### 5. Vendor Management & Directory
- Supported service categories: *Venue, Catering, Photography, Decoration, Music & Entertainment, Transportation, Event Management, Attire & Beauty, Invitations, Other*.
- Maintain contact person, phone number, email, estimated benchmark cost, agreed quoted cost, and booking status (*Inquiry, Quoted, Contract Sent, Booked, Completed, Cancelled*).
- **Honest & Transparent**: Clearly differentiates planning benchmark specifications from verified contracted vendors.

### 6. Personalized AI Recommendations & Cost-Saving Ideas
- Creative ideas tailored to event category, guest count, location, and budget.
- High-impact affordable substitutions (e.g., local seasonal blooms vs imported flowers, combined photo-cinematography studio packages, digital RSVP portals).
- On-demand **"Regenerate Fresh Ideas"** without wiping user-entered expenses or custom vendor records.

### 7. Interactive Executive Dashboard
- **Upcoming Celebration Countdown**: Live countdown clock for the next event.
- **Combined KPI Cards**: Total budget across events, total spent, remaining balance, and checklist milestones.
- **Upcoming Deadlines Widget**: Chronological list of urgent pending milestones with priority tags.
- **Recent Expense Log**: Ticker of latest payments across all user celebrations.

---

## 🏛️ System Architecture

```
challenge-5/
├── server/                       # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/               # Validated env variables (Zod)
│   │   ├── db/                   # SQLite (better-sqlite3), migrations, seed data
│   │   ├── types/                # Shared TypeScript models & Zod schemas
│   │   ├── middleware/           # JWT auth, row-level ownership, rate limiting, error handler
│   │   ├── services/             # AIService (Gemini 2.5 Flash), BudgetService, TimelineService
│   │   ├── controllers/          # Auth, Events, Budget, Timeline, Vendors, AI, Dashboard
│   │   ├── routes/               # Express REST routers (/api/...)
│   │   ├── app.ts                # App initialization with helmet, cors, error handling
│   │   └── server.ts             # Server entrypoint with graceful shutdown
│   └── src/__tests__/            # 30 Automated unit & integration tests (Vitest)
├── client/                       # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/           # Dashboard, Planner, Budget, Timeline, Vendors, Recommendations
│   │   ├── context/              # AuthContext, EventContext
│   │   ├── services/             # Typed API client services
│   │   ├── types/                # Frontend data models matching backend contract
│   │   ├── App.tsx               # Primary application view & tab switcher
│   │   └── index.css             # Vanilla CSS design system (Cyan/Blue light theme, WCAG 2.2 AA)
│   └── index.html                # Accessible HTML5 structure & SEO metadata
└── README.md
```

---

## 🔒 Security Implementation

1. **Zero Secret Leakage**: `GEMINI_API_KEY`, database credentials, and `JWT_SECRET` reside solely on the backend. Frontend never touches raw provider keys.
2. **Cryptographic Authentication**: Passwords hashed using `bcryptjs` with 10 salt rounds. Sessions managed via signed JWT bearer tokens with 7-day expiration.
3. **Strict Row-Level Authorization**: `verifyEventOwnership` middleware guarantees users can only access or modify events and sub-resources they own. Cross-user access returns `403 Forbidden` (verified in tests).
4. **Input Validation & Sanitization**: Every API endpoint validates payload shape, types, and constraints via **Zod** before business logic execution.
5. **Rate Limiting**: `express-rate-limit` protects `/api/auth/*` (30 req / 15 min) and `/api/events/:id/ai/*` (25 req / 15 min) against abuse.
6. **Security Headers & CORS**: `helmet` security headers enabled and CORS locked to trusted origins.
7. **Safe Error Handling**: Centralized error middleware ensures internal database stack traces are never leaked to clients in production.

---

## 🧪 Automated Testing

CelebraPlan AI includes **30 automated tests across 6 test suites** executed via **Vitest**:

```bash
cd server && npm test
```

### Test Coverage Highlights:
- **`auth.test.ts` (3 tests)**: Cryptographic bcrypt hashing, JWT signing, signature verification, and tampered token rejection.
- **`budget.test.ts` (4 tests)**: Zero budget handling, allocation percentage computation, remaining balance math, and multi-category over-budget detection.
- **`timeline.test.ts` (5 tests)**: Dynamic due date computation relative to event date, overdue detection for past dates, completion rate formulas, and chronological milestone grouping.
- **`validation.test.ts` (7 tests)**: Zod schemas for event creation, expense creation, vendor entry, user registration, and AI prompt constraints.
- **`aiService.test.ts` (4 tests)**: AI plan schema validation with Zod, deterministic fallback constraints, and malformed plan rejection.
- **`api.test.ts` (7 tests)**: Full integration tests for `/api/health`, registration, login, event creation, expense tracking, timeline tasks, and `403 Forbidden` unauthorized access prevention.

---

## ♿ Accessibility (WCAG 2.2 AA Compliance)

- **Semantic HTML**: Proper `<main>`, `<header>`, `<nav>`, `<section>`, `<table>`, and `<dialog>` tags used throughout.
- **Color Contrast**: Primary cyan/blue `#0284c7`, dark slate text `#0f172a`, and clean backgrounds `#ffffff` / `#f8fafc` ensure contrast ratios above 4.5:1.
- **Not Communicating by Color Alone**: Over-budget and overdue alerts combine high-contrast icons, descriptive text, and badges.
- **Keyboard Navigation**: Focus rings visible via `:focus-visible` with 2px solid cyan outline.
- **Accessible ARIA Attributes**: Modals with `role="dialog"` & `aria-modal="true"`; tabs with `role="tablist"` & `role="tab"`; progress bars with `role="progressbar"`.
- **Motion Reduction**: `@media (prefers-reduced-motion: reduce)` disables animations for users with vestibular sensitivities.

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js (v18+ or v24+)
- npm (v9+)

### 1. Configuration
Backend `.env` file is located at `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_change_in_production
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
DATABASE_PATH=./data/celebraplan.sqlite
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Run Automated Tests
```bash
cd server && npm test
```

### 4. Start the Application
You can run both backend and frontend concurrently:

**Terminal 1 (Backend Server):**
```bash
cd server && npm run dev
# Server boots on port 5000 with SQLite and auto-seeded demo records
```

**Terminal 2 (Frontend Client):**
```bash
cd client && npm run dev
# Vite serves on http://localhost:5173
```

---

## 🎯 Evaluator Quick Start (One-Click Demo)
1. Open `http://localhost:5173/` in your browser.
2. Click **"Get Started with Demo Access"** -> Click **"One-Click Demo Access"**.
3. You will be instantly logged in as the **Demo Event Organizer** with pre-configured events (*Arjun & Riya's Royal Palace Wedding* and *Aarav's 10th Superhero Birthday*), loaded with real budgets, expenses, preparation milestones, vendor benchmarks, and AI recommendations!
