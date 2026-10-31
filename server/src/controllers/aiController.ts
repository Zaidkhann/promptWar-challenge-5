import { Response, NextFunction } from 'express';
import { db } from '../db';
import { AppError } from '../middleware/errorHandler';
import { RequestWithEvent } from '../middleware/eventOwner';
import { AIService } from '../services/aiService';
import { BudgetService } from '../services/budgetService';
import { TimelineService } from '../services/timelineService';
import { AIPlanOutput } from '../types';

export class AIController {
  public static async generatePlan(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = req.currentEvent!;
      const { prompt } = req.body;

      // Call AI service (isolated layer with schema validation and fallback)
      const result = await AIService.generateEventPlan(event, prompt);

      // Cache plan in DB
      const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db.prepare(`
        INSERT INTO ai_generated_plans (id, event_id, plan_json, model_used, is_demo, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(event_id) DO UPDATE SET
          plan_json = excluded.plan_json,
          model_used = excluded.model_used,
          is_demo = excluded.is_demo,
          updated_at = datetime('now')
      `).run(planId, event.id, JSON.stringify(result.plan), result.model, result.is_demo ? 1 : 0);

      // Mark event status as generated
      db.prepare("UPDATE events SET ai_plan_status = 'generated', updated_at = datetime('now') WHERE id = ?").run(
        event.id
      );

      res.status(200).json({
        success: true,
        message: result.is_demo
          ? 'Generated structured plan in deterministic demo mode (AI credentials unconfigured or limit reached)'
          : 'Generated personalized event master plan with Gemini 2.5 Flash',
        data: {
          plan: result.plan,
          is_demo: result.is_demo,
          model: result.model,
          generated_at: result.generated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async applyPlan(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = req.currentEvent!;
      const { plan } = req.body;

      let planToApply: AIPlanOutput = plan;

      if (!planToApply) {
        // Retrieve cached plan if body doesn't send it directly
        const row = db
          .prepare('SELECT plan_json FROM ai_generated_plans WHERE event_id = ?')
          .get(event.id) as { plan_json: string } | undefined;

        if (!row) {
          throw new AppError('No generated plan found to apply. Please generate a plan first.', 400);
        }

        planToApply = JSON.parse(row.plan_json);
      }

      // Apply transactionally
      AIService.applyPlanToEvent(event.id, planToApply, event.event_date);

      // Return fresh summaries
      const budgetSummary = BudgetService.getEventBudgetSummary(event.id, event.total_budget);
      const timelineSummary = TimelineService.getEventTimelineSummary(event.id);

      res.status(200).json({
        success: true,
        message: 'AI Plan applied to event! Budget allocations, milestones, and vendor benchmarks updated.',
        data: {
          budgetSummary,
          timelineSummary,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getRecommendations(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const recs = db
        .prepare('SELECT * FROM ai_recommendations WHERE event_id = ? ORDER BY created_at DESC')
        .all(eventId);

      res.status(200).json({
        success: true,
        data: recs,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async regenerateRecommendations(
    req: RequestWithEvent,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const event = req.currentEvent!;
      const { prompt } = req.body;

      const result = await AIService.generateEventPlan(event, prompt);

      // Refresh recommendations in DB
      db.prepare('DELETE FROM ai_recommendations WHERE event_id = ?').run(event.id);

      const insertRec = db.prepare(`
        INSERT INTO ai_recommendations (id, event_id, section, title, content, affordable_alternatives)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const rec of result.plan.personalized_recommendations) {
        insertRec.run(
          `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          event.id,
          'Strategic Advice',
          rec.title,
          rec.description,
          rec.affordable_alternative
        );
      }

      const updatedRecs = db
        .prepare('SELECT * FROM ai_recommendations WHERE event_id = ? ORDER BY created_at DESC')
        .all(event.id);

      res.status(200).json({
        success: true,
        message: 'Personalized recommendations refreshed successfully',
        data: {
          recommendations: updatedRecs,
          decoration_suggestions: result.plan.decoration_suggestions,
          food_catering_ideas: result.plan.food_catering_ideas,
          entertainment_suggestions: result.plan.entertainment_suggestions,
          is_demo: result.is_demo,
          model: result.model,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
