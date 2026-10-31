import React, { useState } from 'react';
import { X, Sparkles, Calendar, Users, DollarSign, MapPin } from 'lucide-react';
import { EVENT_CATEGORIES, EventCategory, Event } from '../../types';
import { eventService } from '../../services/eventService';
import { useEvent } from '../../context/EventContext';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: Event | null;
  onEventCreated?: (newEventId: string, triggerAiPlan: boolean) => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  onEventCreated,
}) => {
  const { refreshEvents, setActiveEventId } = useEvent();

  const [name, setName] = useState(eventToEdit?.name || '');
  const [category, setCategory] = useState<EventCategory>(eventToEdit?.category || 'Wedding');
  const [eventDate, setEventDate] = useState(
    eventToEdit?.event_date || new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0]
  );
  const [location, setLocation] = useState(eventToEdit?.location || '');
  const [guestCount, setGuestCount] = useState<number>(eventToEdit?.guest_count || 100);
  const [totalBudget, setTotalBudget] = useState<number>(eventToEdit?.total_budget || 200000);
  const [theme, setTheme] = useState(eventToEdit?.theme || '');
  const [preferences, setPreferences] = useState(eventToEdit?.preferences || '');
  const [triggerAiPlan, setTriggerAiPlan] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        category,
        event_date: eventDate,
        location: location.trim(),
        guest_count: Number(guestCount),
        total_budget: Number(totalBudget),
        theme: theme.trim() || undefined,
        preferences: preferences.trim() || undefined,
      };

      if (eventToEdit) {
        await eventService.updateEvent(eventToEdit.id, payload);
        await refreshEvents();
      } else {
        const res = await eventService.createEvent(payload);
        await refreshEvents();
        setActiveEventId(res.data.id);
        if (onEventCreated) {
          onEventCreated(res.data.id, triggerAiPlan);
        }
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save event. Please verify all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="event-form-title">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h2 id="event-form-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {eventToEdit ? 'Edit Event Details' : 'Create New Celebration Event'}
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ border: 'none', padding: '6px' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="event-name">
                Event Name <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                id="event-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arjun & Riya's Royal Wedding"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="event-category">
                  Event Category <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <select
                  id="event-category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  required
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="event-date">
                  Event Date <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  id="event-date"
                  type="date"
                  className="form-input"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="event-location">
                  Location / City <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  id="event-location"
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Jaipur, Rajasthan"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="event-guests">
                  Expected Guests <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  id="event-guests"
                  type="number"
                  min="1"
                  className="form-input"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 0))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="event-budget">
                Total Available Budget (₹) <span style={{ color: 'var(--danger-500)' }}>*</span>
              </label>
              <input
                id="event-budget"
                type="number"
                min="0"
                step="500"
                className="form-input"
                value={totalBudget}
                onChange={(e) => setTotalBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="e.g. 500000"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '4px', display: 'block' }}>
                Budget is used by the AI assistant to calculate optimal allocations across venue, catering, decor & entertainment.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="event-theme">
                Theme / Desired Style (Optional)
              </label>
              <input
                id="event-theme"
                type="text"
                className="form-input"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Royal Heritage, Modern Minimalist, Pastel Floral"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="event-preferences">
                Event Preferences & Special Requirements
              </label>
              <textarea
                id="event-preferences"
                className="form-textarea"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g. Needs live counter, acoustic band, candid photographer, outdoor evening lawn setup..."
                rows={3}
              />
            </div>

            {!eventToEdit && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--primary-50)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--primary-200)',
                }}
              >
                <input
                  id="trigger-ai-plan"
                  type="checkbox"
                  checked={triggerAiPlan}
                  onChange={(e) => setTriggerAiPlan(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="trigger-ai-plan"
                  style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-900)', cursor: 'pointer' }}
                >
                  <Sparkles size={16} color="var(--primary-600)" style={{ display: 'inline', marginRight: '6px' }} />
                  Automatically launch AI Master Planner after creation
                </label>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
