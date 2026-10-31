import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { db } from '../db';
import {
  Event,
  AIPlanOutput,
  aiPlanOutputSchema,
  VENDOR_CATEGORIES,
  TASK_PRIORITIES,
} from '../types';
import { TimelineService } from './timelineService';

export interface GenerationResult {
  plan: AIPlanOutput;
  is_demo: boolean;
  model: string;
  generated_at: string;
}

export class AIService {
  private static client: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI | null {
    if (!this.client && env.GEMINI_API_KEY) {
      this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
    return this.client;
  }

  /**
   * Generates a comprehensive structured Event Master Plan using Gemini or labeled deterministic fallback.
   */
  public static async generateEventPlan(
    event: Event,
    userPrompt?: string
  ): Promise<GenerationResult> {
    const client = this.getClient();

    if (!client || !env.GEMINI_API_KEY) {
      // Deterministic demo mode with explicit disclaimer
      return {
        plan: this.generateDeterministicDemoPlan(event, userPrompt),
        is_demo: true,
        model: 'deterministic-demo-engine',
        generated_at: new Date().toISOString(),
      };
    }

    const systemInstruction = `
You are an expert Certified Event Planner and Financial Budgeting Specialist.
Your task is to generate a comprehensive, highly realistic, actionable event plan in structured JSON format.

IMPORTANT CONSTRAINTS:
1. All budget allocations must be realistic percentages and the sum of estimated_amount should roughly match the user's total budget of ${event.total_budget}.
2. Categorize all items under these exact categories:
   ${JSON.stringify(VENDOR_CATEGORIES)}
3. Priorities must be strictly one of: ${JSON.stringify(TASK_PRIORITIES)}.
4. Do NOT invent verified vendor names, real phone numbers, or fake business addresses. Frame vendor items as benchmark specifications and questions for vetting.
5. All dates and preparation milestones must be realistic for an event happening on ${event.event_date}.
6. Output ONLY valid JSON matching the required schema. Do not include markdown code fences or conversational text.
`;

    const promptText = `
Event Details:
- Name: "${event.name}"
- Category: "${event.category}"
- Date: "${event.event_date}"
- Location: "${event.location}"
- Expected Guests: ${event.guest_count}
- Total Budget: ${event.total_budget} (in local currency)
- Theme / Style: "${event.theme || 'Open / Modern Elegance'}"
- User Preferences / Notes: "${event.preferences || 'Focus on quality hospitality and memorable experiences'}"
${userPrompt ? `- Additional Specific User Instructions: "${userPrompt}"` : ''}

Generate a complete JSON object adhering strictly to the schema:
{
  "event_overview": "string",
  "recommended_theme": "string",
  "theme_description": "string",
  "budget_distribution": [
    {
      "category": "Venue | Catering | Photography | Decoration | Music and Entertainment | Transportation | Event Management | Attire and Beauty | Invitations and Gifts | Other",
      "allocated_percentage": number,
      "estimated_amount": number,
      "cost_breakdown_notes": "string"
    }
  ],
  "preparation_timeline": [
    {
      "days_before_event": number,
      "phase_name": "string",
      "tasks": [
        {
          "title": "string",
          "description": "string",
          "category": "string",
          "priority": "low | medium | high"
        }
      ]
    }
  ],
  "vendor_categories": [
    {
      "category": "string",
      "estimated_benchmark_cost": number,
      "key_evaluation_criteria": ["string"],
      "questions_to_ask_vendor": ["string"],
      "suggested_service_scope": "string"
    }
  ],
  "decoration_suggestions": ["string"],
  "food_catering_ideas": ["string"],
  "entertainment_suggestions": ["string"],
  "personalized_recommendations": [
    {
      "title": "string",
      "description": "string",
      "affordable_alternative": "string"
    }
  ]
}
`;

    // Attempt calling Gemini API with retry logic
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const rawText = response.text;
        if (!rawText) {
          throw new Error('Received empty response from Gemini API.');
        }

        // Clean any stray backticks if returned
        const cleanedText = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const parsedJson = JSON.parse(cleanedText);

        // Validate strictly using Zod
        const validatedPlan = aiPlanOutputSchema.parse(parsedJson);

        return {
          plan: validatedPlan,
          is_demo: false,
          model: 'gemini-2.5-flash',
          generated_at: new Date().toISOString(),
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini generation attempt ${attempt + 1} failed:`, err.message || err);
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    console.error('All Gemini live attempts failed. Falling back to labeled deterministic plan:', lastError?.message);

    // Fallback if live call failed (e.g. rate limit, network timeout)
    return {
      plan: this.generateDeterministicDemoPlan(event, userPrompt),
      is_demo: true,
      model: 'fallback-demo-engine (live API attempt failed)',
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Applies the generated AI plan to the event in the database transactionally.
   * Preserves manual expenses and existing custom vendors.
   */
  public static applyPlanToEvent(eventId: string, plan: AIPlanOutput, eventDate: string): void {
    const applyTransaction = db.transaction(() => {
      // 1. Budget Allocations: Insert or replace category allocations based on AI percentages
      const insertAllocation = db.prepare(`
        INSERT INTO budget_allocations (id, event_id, category, allocated_amount, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(event_id, category) DO UPDATE SET
          allocated_amount = excluded.allocated_amount,
          notes = excluded.notes,
          updated_at = datetime('now')
      `);

      for (const item of plan.budget_distribution) {
        insertAllocation.run(
          `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          eventId,
          item.category,
          item.estimated_amount,
          `AI Recommended (${item.allocated_percentage}% of total): ${item.cost_breakdown_notes}`
        );
      }

      // 2. Timeline Tasks: Insert AI-generated tasks
      const insertTask = db.prepare(`
        INSERT INTO timeline_tasks (
          id, event_id, title, description, category, due_date, days_before_event, status, priority, is_ai_generated, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 1, datetime('now'))
      `);

      for (const phase of plan.preparation_timeline) {
        const dueDate = TimelineService.calculateDueDate(eventDate, phase.days_before_event);
        for (const task of phase.tasks) {
          insertTask.run(
            `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            eventId,
            task.title,
            `${phase.phase_name}: ${task.description}`,
            task.category,
            dueDate,
            phase.days_before_event,
            task.priority
          );
        }
      }

      // 3. Vendor Benchmark Specifications: Insert initial vendor category entries if not already tracked
      const checkVendor = db.prepare(
        'SELECT id FROM vendors WHERE event_id = ? AND category = ? LIMIT 1'
      );
      const insertVendor = db.prepare(`
        INSERT INTO vendors (
          id, event_id, category, company_name, estimated_cost, status, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'inquiry', ?, datetime('now'))
      `);

      for (const v of plan.vendor_categories) {
        const existing = checkVendor.get(eventId, v.category);
        if (!existing) {
          const notes = `Benchmark criteria: ${v.key_evaluation_criteria.join(', ')}. Scope: ${v.suggested_service_scope}`;
          insertVendor.run(
            `vendor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            eventId,
            v.category,
            `Required ${v.category} Partner (To Be Selected)`,
            v.estimated_benchmark_cost,
            notes
          );
        }
      }

      // 4. Personalized Recommendations
      const deleteExistingRecs = db.prepare('DELETE FROM ai_recommendations WHERE event_id = ?');
      deleteExistingRecs.run(eventId);

      const insertRec = db.prepare(`
        INSERT INTO ai_recommendations (id, event_id, section, title, content, affordable_alternatives)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const rec of plan.personalized_recommendations) {
        insertRec.run(
          `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          eventId,
          'Strategic Advice',
          rec.title,
          rec.description,
          rec.affordable_alternative
        );
      }

      // Update event status and theme
      db.prepare(`
        UPDATE events 
        SET ai_plan_status = 'generated',
            theme = COALESCE(theme, ?),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(plan.recommended_theme, eventId);
    });

    applyTransaction();
  }

  /**
   * Deterministic high-quality fallback generator adhering to real constraints.
   */
  public static generateDeterministicDemoPlan(event: Event, userPrompt?: string): AIPlanOutput {
    const b = event.total_budget || 100000;
    const g = event.guest_count || 50;

    return {
      event_overview: `A tailored ${event.category} celebration in ${event.location} designed for ${g} guests with a structured budget of ${b.toLocaleString()}. Focused on high guest engagement, seamless flow, and cost efficiency. ${userPrompt ? `Incorporating specific focus on: ${userPrompt}` : ''}`,
      recommended_theme: event.theme || (event.category === 'Wedding' ? 'Royal Contemporary Minimalist' : 'Modern Vibrant Chic'),
      theme_description: `An elegant balance of warm ambient lighting, cohesive color accents (subtle gold and deep teal/cyan), modern table arrangements, and curated guest experience touchpoints.`,
      budget_distribution: [
        {
          category: 'Venue',
          allocated_percentage: 28,
          estimated_amount: Math.round(b * 0.28),
          cost_breakdown_notes: 'Includes hall/outdoor rental, climate control, essential lighting, and clean-up fees.',
        },
        {
          category: 'Catering',
          allocated_percentage: 35,
          estimated_amount: Math.round(b * 0.35),
          cost_breakdown_notes: `Estimated at ${(Math.round((b * 0.35) / g)).toLocaleString()} per guest for multi-course meal, live counter, and welcome beverages.`,
        },
        {
          category: 'Decoration',
          allocated_percentage: 14,
          estimated_amount: Math.round(b * 0.14),
          cost_breakdown_notes: 'Entrance arch, photo backdrop, central stage/seating focal point, and table centerpieces.',
        },
        {
          category: 'Photography',
          allocated_percentage: 10,
          estimated_amount: Math.round(b * 0.10),
          cost_breakdown_notes: 'Full-day coverage, candid photo specialist, edited digital gallery, and highlight reel.',
        },
        {
          category: 'Music and Entertainment',
          allocated_percentage: 8,
          estimated_amount: Math.round(b * 0.08),
          cost_breakdown_notes: 'Professional sound system, DJ/emcee, and coordinated playlists for entry and celebrations.',
        },
        {
          category: 'Event Management',
          allocated_percentage: 5,
          estimated_amount: Math.round(b * 0.05),
          cost_breakdown_notes: 'On-site coordinator, guest registration desk, and contingency buffer.',
        },
      ],
      preparation_timeline: [
        {
          days_before_event: 45,
          phase_name: 'Phase 1: Foundation & Contracts',
          tasks: [
            {
              title: 'Finalize and Lock Venue Contract',
              description: 'Inspect capacity, parking facilities, noise curfews, and cancellation terms before deposit.',
              category: 'Venue',
              priority: 'high',
            },
            {
              title: 'Curate Menu Tasting and Finalize Caterer',
              description: 'Confirm per-plate cost, dietary preferences (vegetarian/vegan/allergies), and staffing ratio.',
              category: 'Catering',
              priority: 'high',
            },
          ],
        },
        {
          days_before_event: 30,
          phase_name: 'Phase 2: Creative & Visual Design',
          tasks: [
            {
              title: 'Sign Photographer & Agree on Shot List',
              description: 'Share family and key stakeholder list, schedule couple/guest candid moments.',
              category: 'Photography',
              priority: 'medium',
            },
            {
              title: 'Approve Stage and Entrance Decor Renderings',
              description: 'Confirm floral palette, lighting fixtures, and eco-friendly reusable elements.',
              category: 'Decoration',
              priority: 'high',
            },
          ],
        },
        {
          days_before_event: 14,
          phase_name: 'Phase 3: Logistics & Guest Confirmations',
          tasks: [
            {
              title: 'Finalize RSVP Counts with Caterer',
              description: 'Provide final headcount + 5% buffer to avoid food waste or shortage.',
              category: 'Catering',
              priority: 'high',
            },
            {
              title: 'Review Audio/Visual Schedule with DJ and Emcee',
              description: 'Supply song tracks for special entrances, speeches, and background ambient loops.',
              category: 'Music and Entertainment',
              priority: 'medium',
            },
          ],
        },
        {
          days_before_event: 2,
          phase_name: 'Phase 4: Final Rehearsal & Verification',
          tasks: [
            {
              title: 'Conduct Venue Walkthrough & Power Backup Test',
              description: 'Verify generator availability, air conditioning, and vendor delivery access times.',
              category: 'Event Management',
              priority: 'high',
            },
            {
              title: 'Assemble Vendor Contact Sheet & Payment Envelopes',
              description: 'Prepare balance disbursements and designate a single point of contact on site.',
              category: 'Event Management',
              priority: 'high',
            },
          ],
        },
      ],
      vendor_categories: [
        {
          category: 'Venue',
          estimated_benchmark_cost: Math.round(b * 0.28),
          key_evaluation_criteria: ['Capacity clearance for guests', 'Air conditioning / weather proofing', 'Parking availability', 'Curfew hours'],
          questions_to_ask_vendor: [
            'Are outside caterers or decorators permitted, and is there a royalty fee?',
            'What is the electricity backup protocol during power cuts?',
            'What is the exact load-in and load-out window for decorators?'
          ],
          suggested_service_scope: 'Venue space rental, basic furniture, generator backup, dedicated washrooms, and security guards.',
        },
        {
          category: 'Catering',
          estimated_benchmark_cost: Math.round(b * 0.35),
          key_evaluation_criteria: ['Food safety certification', 'Staffing ratio (1 waiter per 15 guests minimum)', 'Live station expertise'],
          questions_to_ask_vendor: [
            'Do you provide crockery, cutlery, glassware, and linen?',
            'How is leftover food packaged or donated?',
            'Can you accommodate vegan and allergy requirements seamlessly?'
          ],
          suggested_service_scope: 'Welcome drinks, 3-course buffet, live snack counter, dessert spread, serving staff, and beverage station.',
        },
        {
          category: 'Photography',
          estimated_benchmark_cost: Math.round(b * 0.10),
          key_evaluation_criteria: ['Portfolio consistency in similar lighting', 'Delivery turnaround time', 'Backup equipment on site'],
          questions_to_ask_vendor: [
            'Who will be the lead photographer on the day?',
            'How many edited digital photos are guaranteed in the final gallery?',
            'What is the delivery timeline for preview shots?'
          ],
          suggested_service_scope: 'Lead photographer + 1 assistant, full-event coverage, 250+ color-graded images, high-res cloud gallery.',
        },
        {
          category: 'Decoration',
          estimated_benchmark_cost: Math.round(b * 0.14),
          key_evaluation_criteria: ['Quality of artificial vs fresh florals', 'Sturdy truss structures', 'Clean aesthetic execution'],
          questions_to_ask_vendor: [
            'Are fresh seasonal blooms included or premium imports?',
            'Does setup include all electrical cables and safety taping?',
            'When will teardown take place post-event?'
          ],
          suggested_service_scope: 'Welcome entryway, stage backdrop, photo booth installation, ambient uplighting, and table accents.',
        },
      ],
      decoration_suggestions: [
        'Warm fairy light canopies paired with seasonal white and pastel florals for timeless elegance.',
        'Personalized photo timeline gallery showcasing milestone moments of the celebrant or couple.',
        'Subtle brass or geometric metallic lanterns with safe LED pillar candles on guest tables.',
        'Custom welcome easel board with a handwritten welcome message and social media hashtag.',
      ],
      food_catering_ideas: [
        'Live artisanal chaat or taco counter during arrival for energetic mingling.',
        'Interactive mocktail/cocktail signature bar themed around the celebrants favourite flavors.',
        'Multi-regional curated buffet balancing mild and spiced comfort dishes.',
        'Bite-sized dessert platters (mini tarts, warm gulab jamun with ice cream, and cheesecakes) for easy standing consumption.',
      ],
      entertainment_suggestions: [
        'Professional Emcee to lead structured interactive trivia or couple/family games.',
        'Curated acoustic duo or saxophone set during the dinner reception.',
        'High-energy open dance floor playlist transition after formal toasts.',
        'Instant Polaroid guestbook station where guests stick their instant photo alongside personal wishes.',
      ],
      personalized_recommendations: [
        {
          title: 'Seasonal Floral Substitution',
          description: 'Use local seasonal flowers (marigolds, tuberoses, local hydrangeas) augmented with lush tropical greens instead of imported peonies/orchids.',
          affordable_alternative: 'Saves 35-45% on decor without sacrificing volume or visual richness.',
        },
        {
          title: 'Combined Photo & Video Package',
          description: 'Hire an integrated boutique studio rather than two independent agencies for photo and cinematography.',
          affordable_alternative: 'Reduces total media spend by ~20% and avoids crew friction on the floor.',
        },
        {
          title: 'Digital Invitations & Micro-website',
          description: 'Send high-res animated digital invitations and collect online RSVPs instead of heavy physical box cards.',
          affordable_alternative: 'Saves printing and courier costs while giving you real-time automated headcount tracking.',
        },
      ],
    };
  }
}
