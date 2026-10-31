import { describe, it, expect } from 'vitest';
import { AIService } from '../services/aiService';
import { aiPlanOutputSchema, Event } from '../types';

describe('AIService & Plan Validation Tests', () => {
  const sampleEvent: Event = {
    id: 'evt_test_1',
    user_id: 'usr_test',
    name: '50th Birthday Gala',
    category: 'Birthday',
    event_date: '2026-11-20',
    location: 'Bhopal Club',
    guest_count: 50,
    total_budget: 50000,
    theme: 'Vintage Gold & Navy',
    preferences: 'Live acoustic music and gourmet dessert counter',
    created_at: '',
    updated_at: '',
  };

  it('should generate a valid deterministic demo plan conforming to aiPlanOutputSchema', () => {
    const plan = AIService.generateDeterministicDemoPlan(sampleEvent);

    // Schema validation using Zod
    const validation = aiPlanOutputSchema.safeParse(plan);
    expect(validation.success).toBe(true);

    expect(plan.event_overview).toContain('Birthday');
    expect(plan.recommended_theme).toBe('Vintage Gold & Navy');
    expect(plan.budget_distribution.length).toBeGreaterThan(0);

    // Sum of budget distributions should closely match total budget
    const totalAllocated = plan.budget_distribution.reduce((sum: number, item: any) => sum + item.estimated_amount, 0);
    expect(totalAllocated).toBeGreaterThan(0);
    expect(totalAllocated).toBeLessThanOrEqual(sampleEvent.total_budget);

    // Milestones and tasks
    expect(plan.preparation_timeline.length).toBeGreaterThan(0);
    for (const phase of plan.preparation_timeline) {
      expect(phase.days_before_event).toBeGreaterThanOrEqual(0);
      expect(phase.tasks.length).toBeGreaterThan(0);
    }

    // Recommendations and affordable alternatives
    expect(plan.personalized_recommendations.length).toBeGreaterThan(0);
    for (const rec of plan.personalized_recommendations) {
      expect(rec.title).toBeTruthy();
      expect(rec.affordable_alternative).toBeTruthy();
    }
  });

  it('should reject malformed plans missing required fields', () => {
    const invalidPlan = {
      event_overview: 'Overview',
      // missing recommended_theme, budget_distribution, etc.
    };

    const validation = aiPlanOutputSchema.safeParse(invalidPlan);
    expect(validation.success).toBe(false);
  });
});
