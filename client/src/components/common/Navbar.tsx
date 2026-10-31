import React from 'react';
import { Calendar, Plus, Sparkles, LogOut, User as UserIcon, PartyPopper } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEvent } from '../../context/EventContext';

interface NavbarProps {
  onOpenCreateEvent: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateEvent, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const { events, activeEvent, setActiveEventId } = useEvent();

  return (
    <header className="header-navbar" role="banner">
      <div className="navbar-inner">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="brand-logo" aria-label="CelebraPlan AI Home">
            <div className="brand-icon-box" aria-hidden="true">
              <PartyPopper size={22} />
            </div>
            <div>
              <span style={{ color: 'var(--slate-900)' }}>Celebra</span>
              <span style={{ color: 'var(--primary-600)' }}>Plan</span>
              <span style={{ fontSize: '0.75rem', marginLeft: '6px', padding: '2px 6px', background: 'var(--primary-100)', color: 'var(--primary-800)', borderRadius: '4px', verticalAlign: 'middle' }}>
                AI
              </span>
            </div>
          </div>

          {/* Active Event Selector */}
          {user && events.length > 0 && (
            <div className="event-picker" title="Switch active event">
              <Calendar size={16} color="var(--slate-500)" aria-hidden="true" />
              <label htmlFor="active-event-select" className="sr-only" style={{ display: 'none' }}>
                Select Active Event
              </label>
              <select
                id="active-event-select"
                value={activeEvent?.id || ''}
                onChange={(e) => setActiveEventId(e.target.value)}
                aria-label="Active Celebration Event"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Actions & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active Model Indicator */}
          <div
            className="badge badge-info"
            title="Connected to Google Gemini 2.5 Flash GenAI Model"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
          >
            <Sparkles size={14} color="var(--primary-600)" aria-hidden="true" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Gemini 2.5 Flash</span>
          </div>

          {user ? (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onOpenCreateEvent}
                aria-label="Create New Event"
              >
                <Plus size={16} aria-hidden="true" />
                <span>New Event</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                  {user.name}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={logout}
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={14} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenAuth}
              aria-label="Sign In or Register"
            >
              <UserIcon size={16} aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
