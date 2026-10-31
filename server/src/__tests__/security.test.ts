import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { sanitizeString, sanitizeData } from '../middleware/sanitize';
import { db } from '../db';
import { BudgetService } from '../services/budgetService';
import { TimelineService } from '../services/timelineService';

describe('Security & Edge Cases Automated Tests', () => {
  describe('Input Sanitization & XSS Defense', () => {
    it('should strip malicious script tags and inline handlers', () => {
      const malicious = '<script>alert("hacked")</script>Birthday Party';
      const clean = sanitizeString(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).toBe('Birthday Party');
    });

    it('should neutralize onerror and javascript: pseudo-protocols', () => {
      const payload = '<img src="x" onerror="alert(1)">javascript:evil()';
      const clean = sanitizeString(payload);
      expect(clean).not.toContain('onerror=');
      expect(clean).not.toContain('javascript:');
    });

    it('should deeply sanitize nested objects and arrays in request payloads', () => {
      const nested = {
        title: 'Dinner <script>bad()</script>',
        tags: ['safe', '<svg onload="alert(1)">'],
        meta: { notes: 'hello <script>' },
      };
      const cleaned = sanitizeData(nested);
      expect(cleaned.title).toBe('Dinner ');
      expect(cleaned.tags[1]).not.toContain('onload=');
    });
  });

  describe('SQL Injection Prevention (Parameterized Queries)', () => {
    it('should safely escape classic SQL injection attempts', () => {
      const sqlInjectionPayload = "'; DROP TABLE events; --";
      const result = db.prepare('SELECT * FROM events WHERE id = ?').get(sqlInjectionPayload);
      expect(result).toBeUndefined();

      // Verify events table is completely intact
      const count = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
      expect(count.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Authentication & Authorization Hardening', () => {
    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/events');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('should reject malformed or fake JWT tokens with 401', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', 'Bearer fake.invalid.jwt.token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email or short password with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid User',
          email: 'not-an-email',
          password: '123',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('Calculation Engine Boundary & Edge Cases', () => {
    it('should handle zero budget safely without NaN or division by zero', () => {
      const summary = BudgetService.calculateMetrics(0, [], [
        {
          id: 'exp_1',
          event_id: 'evt_1',
          category: 'Catering',
          title: 'Appetizers',
          amount: 100,
          paid_to: 'Chef',
          expense_date: '2026-10-31',
          status: 'paid',
          notes: undefined,
          created_at: '2026-10-31',
          updated_at: '2026-10-31',
        },
      ]);
      expect(summary.total_budget).toBe(0);
      expect(summary.total_spent).toBe(100);
      expect(summary.remaining_budget).toBe(-100);
      expect(summary.is_over_budget).toBe(true);
      expect(summary.spending_percentage).toBe(100);
    });

    it('should handle negative or zero days before event for due date calculation', () => {
      const eventDate = '2026-12-31';
      const sameDay = TimelineService.calculateDueDate(eventDate, 0);
      expect(sameDay).toBe('2026-12-31');

      const pastDue = TimelineService.calculateDueDate(eventDate, -2);
      expect(pastDue).toBe('2027-01-02');
    });
  });
});
