import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Wallet,
  Users,
  Layers,
  Utensils,
  Music,
  Camera,
  Compass,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AIPlanOutput } from '../../types';
import { aiService } from '../../services/aiService';
import { useEvent } from '../../context/EventContext';

export const AiPlannerView: React.FC = () => {
  const { activeEvent, activeEventDetail, refreshActiveEvent, refreshEvents } = useEvent();

  const [prompt, setPrompt] = useState(
    activeEvent
      ? `Organize a memorable ${activeEvent.category} in ${activeEvent.location} for ${activeEvent.guest_count} guests with a budget of ₹${activeEvent.total_budget.toLocaleString()}. Prioritize excellent catering, aesthetic ambiance, and smooth event flow.`
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [planResult, setPlanResult] = useState<{
    plan: AIPlanOutput;
    is_demo: boolean;
    model: string;
    generated_at: string;
  } | null>(
    activeEventDetail?.aiPlan
      ? {
          plan: activeEventDetail.aiPlan.plan,
          is_demo: activeEventDetail.aiPlan.is_demo,
          model: activeEventDetail.aiPlan.model,
          generated_at: activeEventDetail.aiPlan.updated_at,
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!activeEvent) {
    return (
      <div className="card empty-state">
        <Compass size={40} color="var(--primary-600)" style={{ margin: '0 auto 12px' }} />
        <h3 className="empty-state-title">Select or Create an Event First</h3>
        <p className="empty-state-desc">
          Choose an active event from the top navigation dropdown or create a new celebration to generate an intelligent AI Master Plan.
        </p>
      </div>
    );
  }

  const handleGeneratePlan = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await aiService.generatePlan(activeEvent.id, prompt);
      setPlanResult(res.data);
      setSuccessMessage(
        res.data.is_demo
          ? 'Generated structured plan using deterministic demo engine.'
          : 'Event Master Plan successfully generated with Google Gemini 2.5 Flash!'
      );
      await refreshActiveEvent();
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI plan. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!planResult?.plan) return;
    setError(null);
    setSuccessMessage(null);
    setApplying(true);

    try {
      await aiService.applyPlan(activeEvent.id, planResult.plan);
      setSuccessMessage(
        'Success! AI budget allocations, preparation timeline milestones, and vendor benchmarks have been applied to this event.'
      );
      await refreshActiveEvent();
      await refreshEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to apply plan to event.');
    } finally {
      setApplying(false);
    }
  };

  const samplePrompts = [
    `I want to organize a birthday party for 50 people in Bhopal with a budget of ₹50,000. I prefer a modern theme with good food, decorations, photography, and entertainment.`,
    `Plan a royal 150-guest wedding in Jaipur palace lawns with ₹15,00,000 budget. Need exquisite Rajasthani gourmet dinner, candid photographer, and acoustic folk musicians.`,
    `Community charity cultural night for 300 guests with ₹1,20,000 budget. Focus on efficient stage setup, clean sound system, community volunteer coordination, and light refreshments.`,
  ];

  const plan = planResult?.plan;

  return (
    <div>
      {/* Top AI Planner Hero Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={22} color="var(--primary-600)" />
              <span>AI Celebration & Master Planner</span>
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginTop: '4px' }}>
              Describe your vision in natural language. Gemini 2.5 Flash calculates realistic budget distributions, actionable preparation timelines, and vendor specifications based on your constraints.
            </p>
          </div>

          {planResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${planResult.is_demo ? 'badge-warning' : 'badge-info'}`}>
                Engine: {planResult.model}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApplyPlan}
                disabled={applying}
                style={{ padding: '8px 16px' }}
              >
                <CheckCircle2 size={16} />
                <span>{applying ? 'Applying...' : 'Apply Plan to Event'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Prompt Input Box */}
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label" htmlFor="ai-prompt-input">
            Your Event Vision & Special Requirements
          </label>
          <textarea
            id="ai-prompt-input"
            className="form-textarea"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Describe guest expectations, culinary style, preferred music, decor ambiance, or specific constraints..."
          />
        </div>

        {/* Sample Prompt Chips */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Quick Prompts:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', textAlign: 'left', borderRadius: 'var(--radius-full)' }}
                onClick={() => setPrompt(sp)}
              >
                {sp.substring(0, 70)}...
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleGeneratePlan}
            disabled={loading || prompt.trim().length < 10}
            style={{ width: '100%', maxWidth: '300px' }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Generating Master Plan...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>{plan ? 'Regenerate Plan' : 'Generate Master Plan'}</span>
              </>
            )}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger" style={{ marginTop: '16px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" style={{ marginTop: '16px' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Generated Plan Content */}
      {plan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Overview & Theme Card */}
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Event Overview
                </div>
                <p style={{ fontSize: '0.9375rem', color: 'var(--slate-800)', lineHeight: 1.6 }}>
                  {plan.event_overview}
                </p>
              </div>

              <div style={{ borderLeft: '2px solid var(--slate-100)', paddingLeft: '20px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Recommended Theme
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '6px' }}>
                  {plan.recommended_theme}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                  {plan.theme_description}
                </p>
              </div>
            </div>
          </div>

          {/* Budget Distribution Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Wallet size={20} color="var(--primary-600)" />
                <span>AI Budget Distribution (₹{activeEvent.total_budget.toLocaleString()})</span>
              </div>
              <span className="badge badge-info">
                Estimated Benchmarks
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Allocation %</th>
                    <th>Estimated Amount</th>
                    <th>Cost Breakdown Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.budget_distribution.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{item.category}</td>
                      <td>
                        <span className="badge badge-neutral">{item.allocated_percentage}%</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{item.estimated_amount.toLocaleString()}</td>
                      <td style={{ color: 'var(--slate-600)', fontSize: '0.8125rem' }}>
                        {item.cost_breakdown_notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preparation Timeline Milestones */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Calendar size={20} color="var(--primary-600)" />
                <span>Preparation Timeline & Key Milestones</span>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>
                Target Event: {activeEvent.event_date}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {plan.preparation_timeline.map((phase, pIdx) => (
                <div
                  key={pIdx}
                  style={{
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    backgroundColor: 'var(--slate-50)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                      {phase.phase_name}
                    </div>
                    <span className="badge badge-info">
                      {phase.days_before_event} Days Out
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {phase.tasks.map((task, tIdx) => (
                      <div
                        key={tIdx}
                        style={{
                          background: '#ffffff',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--slate-200)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{task.title}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                            {task.description}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-neutral">{task.category}</span>
                          <span
                            className={`badge ${
                              task.priority === 'high'
                                ? 'badge-danger'
                                : task.priority === 'medium'
                                ? 'badge-warning'
                                : 'badge-neutral'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Specifications & Vetting Questions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Users size={20} color="var(--primary-600)" />
                <span>Vendor Benchmark Specifications & Vetting Guide</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {plan.vendor_categories.map((vendor, vIdx) => (
                <div
                  key={vIdx}
                  style={{
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                        {vendor.category}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                        ₹{vendor.estimated_benchmark_cost.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginBottom: '10px' }}>
                      <strong>Scope:</strong> {vendor.suggested_service_scope}
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                        Evaluation Criteria:
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.8125rem', color: 'var(--slate-700)', marginTop: '4px' }}>
                        {vendor.key_evaluation_criteria.map((c, cIdx) => (
                          <li key={cIdx}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                        Questions to Ask:
                      </div>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.8125rem', color: 'var(--slate-700)', marginTop: '4px' }}>
                        {vendor.questions_to_ask_vendor.map((q, qIdx) => (
                          <li key={qIdx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspiration Tri-Grid: Decor, Food, Entertainment */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px' }}>
                <Layers size={18} color="var(--primary-600)" />
                <span>Decor & Styling Ideas</span>
              </div>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
                {plan.decoration_suggestions.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px' }}>
                <Utensils size={18} color="var(--primary-600)" />
                <span>Food & Catering Concepts</span>
              </div>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
                {plan.food_catering_ideas.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px' }}>
                <Music size={18} color="var(--primary-600)" />
                <span>Entertainment & Flow</span>
              </div>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
                {plan.entertainment_suggestions.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Strategic Advice with Affordable Alternatives */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Sparkles size={20} color="var(--primary-600)" />
                <span>Personalized Recommendations & Cost-Saving Alternatives</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {plan.personalized_recommendations.map((rec, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    backgroundColor: 'var(--slate-50)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--slate-900)', marginBottom: '4px' }}>
                    {rec.title}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginBottom: '10px' }}>
                    {rec.description}
                  </p>
                  <div
                    style={{
                      background: 'var(--success-50)',
                      border: '1px solid #a7f3d0',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      fontSize: '0.8125rem',
                      color: 'var(--success-700)',
                    }}
                  >
                    <strong>Cost-Saving Alternative:</strong> {rec.affordable_alternative}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
