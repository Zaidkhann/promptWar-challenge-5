import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { AIService } from '../services/aiService';
import { Event } from '../types';

describe('End-to-End API Workflows Integration Tests', () => {
  let authToken: string;
  let registeredEmail: string;
  const registeredPassword = 'Password123!';
  let createdEventId: string;
  let createdTaskId: string;
  let createdVendorId: string;

  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/auth/register should create a new user and return JWT', async () => {
    registeredEmail = `test_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Tester',
        email: registeredEmail,
        password: registeredPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe(registeredEmail);

    authToken = res.body.data.token;
  });

  it('POST /api/auth/login should authenticate valid credentials and reject invalid credentials', async () => {
    // Valid login
    const validRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: registeredEmail,
        password: registeredPassword,
      });
    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data.token).toBeTruthy();

    // Invalid password
    const invalidRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: registeredEmail,
        password: 'WrongPassword!',
      });
    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body.success).toBe(false);
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

  it('GET /api/events/:eventId should fetch event details by id', async () => {
    const res = await request(app)
      .get(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdEventId);
    expect(res.body.data.budgetSummary).toBeDefined();
  });

  it('PUT /api/events/:eventId should update event details', async () => {
    const res = await request(app)
      .put(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        guest_count: 250,
        total_budget: 850000,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.guest_count).toBe(250);
    expect(res.body.data.total_budget).toBe(850000);
  });

  it('POST /api/events/:eventId/budget/allocations should set category allocation', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/budget/allocations`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        category: 'Venue',
        allocated_amount: 300000,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total_allocated).toBeGreaterThanOrEqual(300000);
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
    expect(res.body.data.budgetSummary.remaining_budget).toBe(700000);
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

    createdTaskId = res.body.data.task.id;
  });

  it('PUT /api/events/:eventId/timeline/tasks/:taskId should update task status', async () => {
    const res = await request(app)
      .put(`/api/events/${createdEventId}/timeline/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'completed',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task.status).toBe('completed');
  });

  it('POST /api/events/:eventId/vendors/vendors should create a vendor record', async () => {
    const res = await request(app)
      .post(`/api/events/${createdEventId}/vendors/vendors`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        company_name: 'Apex Light and Sound Solutions',
        category: 'Music and Entertainment',
        contact_person: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul@apexsound.in',
        estimated_cost: 80000,
        actual_cost: 75000,
        status: 'booked',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.company_name).toBe('Apex Light and Sound Solutions');
    createdVendorId = res.body.data.id;
  });

  it('GET /api/events/:eventId/vendors/vendors should return vendor directory and summary', async () => {
    const res = await request(app)
      .get(`/api/events/${createdEventId}/vendors/vendors`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vendors.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.summary.booked_vendors).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/dashboard/summary should return real-time multi-event aggregated KPIs', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.has_events).toBe(true);
    expect(res.body.data.total_budget).toBeGreaterThanOrEqual(850000);
  });

  it('POST /api/events/:eventId/ai/plan/generate should generate and return an AI plan', async () => {
    const spy = vi.spyOn(AIService, 'generateEventPlan').mockImplementation(async (event: Event) => ({
      plan: AIService.generateDeterministicDemoPlan(event),
      is_demo: true,
      model: 'gemini-2.5-flash-mocked',
      generated_at: new Date().toISOString(),
    }));

    const res = await request(app)
      .post(`/api/events/${createdEventId}/ai/plan/generate`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'Focus on high-tech interactive experiences and modern cocktail food',
      });

    spy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan).toBeDefined();
    expect(res.body.data.plan.recommended_theme).toBeTruthy();
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

  it('DELETE /api/events/:eventId should delete an event and cascade sub-records', async () => {
    const res = await request(app)
      .delete(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify event is gone
    const verifyRes = await request(app)
      .get(`/api/events/${createdEventId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(verifyRes.status).toBe(404);
  });
});
