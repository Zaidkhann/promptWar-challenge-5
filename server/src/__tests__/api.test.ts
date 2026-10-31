import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('End-to-End API Workflows Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let createdEventId: string;

  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/auth/register should create a new user and return JWT', async () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Tester',
        email: uniqueEmail,
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe(uniqueEmail);

    authToken = res.body.data.token;
    testUserId = res.body.data.user.id;
  });

  it('POST /api/events should create a new event for authenticated user', async () => {
    const eventPayload = {
      name: 'Annual Tech & Innovation Summit Gala',
      category: 'Corporate',
      event_date: '2026-12-15',
      location: 'Grand Convention Hall, Mumbai',
      guest_count: 200,
      total_budget: 800000,
      theme: 'Futuristic Cyber Modern',
      preferences: 'LED wall stage, premium buffet catering, tech awards keynote',
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(eventPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(eventPayload.name);
    expect(res.body.data.total_budget).toBe(800000);

    createdEventId = res.body.data.id;
  });

  it('GET /api/events should list events belonging to the user with stats', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const found = res.body.data.find((e: any) => e.id === createdEventId);
    expect(found).toBeDefined();
    expect(found.budgetSummary.total_budget).toBe(800000);
  });

  it('POST /api/events/:eventId/budget/expenses should record an expense and recalculate budget', async () => {
    const expensePayload = {
      category: 'Venue',
      title: 'Convention Hall Security Deposit',
      amount: 150000,
      expense_date: '2026-11-01',
      status: 'paid',
      paid_to: 'Grand Convention Centers Ltd',
    };

    const res = await request(app)
      .post(`/api/events/${createdEventId}/budget/expenses`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(expensePayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.expense.amount).toBe(150000);
    expect(res.body.data.budgetSummary.total_spent).toBe(150000);
    expect(res.body.data.budgetSummary.remaining_budget).toBe(650000);
  });

  it('POST /api/events/:eventId/timeline/tasks should create a task and calculate due date', async () => {
    const taskPayload = {
      title: 'Sign LED Wall AV Tech Contract',
      category: 'Event Management',
      days_before_event: 20,
      priority: 'high',
    };

    const res = await request(app)
      .post(`/api/events/${createdEventId}/timeline/tasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task.title).toBe(taskPayload.title);
    expect(res.body.data.task.days_before_event).toBe(20);
    expect(res.body.data.task.due_date).toBe('2026-11-25');
  });

  it('Security: should deny access to an event belonging to another user (403 Forbidden)', async () => {
    // Register another user
    const otherUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Unauthorized User',
        email: `intruder_${Date.now()}@example.com`,
        password: 'Password123!',
      });

    const otherToken = otherUserRes.body.data.token;

    // Attempt to access createdEventId
    const res = await request(app)
      .get(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
