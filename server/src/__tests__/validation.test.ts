import { describe, it, expect } from 'vitest';
import {
  createEventSchema,
  createExpenseSchema,
  createVendorSchema,
  registerSchema,
  aiPlanPromptSchema,
} from '../types';

describe('Validation Schemas Tests', () => {
  describe('createEventSchema', () => {
    it('should validate valid event creation input', () => {
      const valid = {
        name: 'Arjun & Riya Wedding',
        category: 'Wedding',
        event_date: '2026-12-25',
        location: 'Jaipur Palace',
        guest_count: 250,
        total_budget: 1500000,
        theme: 'Royal Rajasthani',
        preferences: 'Vegetarian gourmet banquet',
      };
      const result = createEventSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalid = {
        name: 'Birthday Party',
        category: 'Birthday',
        event_date: '25/12/2026', // invalid format (needs YYYY-MM-DD)
        location: 'Goa',
        guest_count: 50,
        total_budget: 50000,
      };
      const result = createEventSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject negative budget or 0 guests', () => {
      const invalid = {
        name: 'Community Meet',
        category: 'Community Event',
        event_date: '2026-11-20',
        location: 'Community Hall',
        guest_count: 0,
        total_budget: -500,
      };
      const result = createEventSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('createExpenseSchema', () => {
    it('should validate valid expense input', () => {
      const valid = {
        category: 'Catering',
        title: 'Catering Advance Deposit',
        amount: 25000,
        paid_to: 'Royal Caterers',
        expense_date: '2026-11-01',
        status: 'paid',
        notes: '50% advance for raw ingredients',
      };
      const result = createExpenseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject zero or negative expense amount', () => {
      const invalid = {
        category: 'Venue',
        title: 'Hall Rent',
        amount: 0,
        expense_date: '2026-11-01',
      };
      const result = createExpenseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('createVendorSchema', () => {
    it('should validate valid vendor entry', () => {
      const valid = {
        category: 'Photography',
        company_name: 'Starlight Studios',
        contact_person: 'Rahul Sharma',
        phone: '+91 9876543210',
        email: 'rahul@starlight.com',
        estimated_cost: 60000,
        actual_cost: 55000,
        status: 'booked',
      };
      const result = createVendorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should allow empty string for email if optional', () => {
      const valid = {
        category: 'Venue',
        company_name: 'Sunset Lawn',
        email: '',
      };
      const result = createVendorSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('registerSchema', () => {
    it('should reject weak passwords under 6 characters', () => {
      const invalid = {
        name: 'Priya',
        email: 'priya@example.com',
        password: '123',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('aiPlanPromptSchema', () => {
    it('should reject prompts that are too short', () => {
      const invalid = { prompt: 'plan it' };
      const result = aiPlanPromptSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
