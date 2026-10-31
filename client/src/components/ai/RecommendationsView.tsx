import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Layers,
  Utensils,
  Music,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { AIRecommendation } from '../../types';
import { aiService } from '../../services/aiService';
import { useEvent } from '../../context/EventContext';

export const RecommendationsView: React.FC = () => {
  const { activeEvent, activeEventDetail, refreshActiveEvent } = useEvent();

  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [decorSuggestions, setDecorSuggestions] = useState<string[]>(
    activeEventDetail?.aiPlan?.plan.decoration_suggestions || []
  );
  const [foodIdeas, setFoodIdeas] = useState<string[]>(
    activeEventDetail?.aiPlan?.plan.food_catering_ideas || []
  );
  const [entertainment, setEntertainment] = useState<string[]>(
    activeEventDetail?.aiPlan?.plan.entertainment_suggestions || []
  );

  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadRecs = async () => {
    if (!activeEvent) return;
    try {
      const res = await aiService.getRecommendations(activeEvent.id);
      setRecommendations(res.data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  useEffect(() => {
    loadRecs();
  }, [activeEvent]);

  if (!activeEvent) {
    return (
      <div className="card empty-state">
        <Sparkles size={40} color="var(--primary-600)" style={{ margin: '0 auto 12px' }} />
        <h3 className="empty-state-title">Select or Create an Event First</h3>
        <p className="empty-state-desc">
          Choose an active event to explore personalized recommendations and cost-saving ideas.
        </p>
      </div>
    );
  }

  const handleRegenerate = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await aiService.regenerateRecommendations(
        activeEvent.id,
        customPrompt || 'Generate fresh cost-saving practical tips'
      );
      setRecommendations(res.data.recommendations);
      if (res.data.decoration_suggestions) setDecorSuggestions(res.data.decoration_suggestions);
      if (res.data.food_catering_ideas) setFoodIdeas(res.data.food_catering_ideas);
      if (res.data.entertainment_suggestions) setEntertainment(res.data.entertainment_suggestions);
      setSuccessMsg('Personalized recommendations and creative alternatives refreshed successfully!');
      await refreshActiveEvent();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={22} color="var(--primary-600)" />
              <span>Personalized Recommendations & Creative Alternatives</span>
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginTop: '2px' }}>
              Tailored for {activeEvent.name} ({activeEvent.category}) • {activeEvent.guest_count} Guests • Budget ₹{activeEvent.total_budget.toLocaleString()}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRegenerate}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Regenerate Fresh Ideas'}</span>
            </button>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="custom-rec-prompt">
            Optional: Focus Fresh Recommendations On (e.g. "Save money on decor", "Gourmet street food fusion")
          </label>
          <input
            id="custom-rec-prompt"
            type="text"
            className="form-input"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Tell the AI what specific area to prioritize for creative ideas..."
          />
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: '14px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ marginTop: '14px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Strategic Cost-Saving Alternatives */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <DollarSign size={20} color="var(--primary-600)" />
            <span>High-Impact Cost Saving Substitutions</span>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--slate-500)' }}>
            <p>No customized strategic advice saved yet. Click "Regenerate Fresh Ideas" or apply an AI Master Plan.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                style={{
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)', marginBottom: '6px' }}>
                  {rec.title}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '12px', lineHeight: 1.5 }}>
                  {rec.content}
                </p>
                {rec.affordable_alternatives && (
                  <div
                    style={{
                      background: 'var(--success-50)',
                      border: '1px solid #a7f3d0',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      fontSize: '0.8125rem',
                      color: 'var(--success-700)',
                    }}
                  >
                    <strong>Cost-Saving Alternative:</strong> {rec.affordable_alternatives}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creative Ideas: Decor, Catering, Entertainment */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            <Layers size={18} color="var(--primary-600)" />
            <span>Decor & Theme Enhancements</span>
          </div>
          {decorSuggestions.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Generate an AI Master Plan to unlock tailored decor suggestions for your theme.
            </p>
          ) : (
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {decorSuggestions.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            <Utensils size={18} color="var(--primary-600)" />
            <span>Food & Catering Innovations</span>
          </div>
          {foodIdeas.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Generate an AI Master Plan to view hospitality and menu concepts.
            </p>
          ) : (
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {foodIdeas.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            <Music size={18} color="var(--primary-600)" />
            <span>Entertainment & Flow</span>
          </div>
          {entertainment.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
              Generate an AI Master Plan to view guest engagement and music ideas.
            </p>
          ) : (
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
              {entertainment.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
