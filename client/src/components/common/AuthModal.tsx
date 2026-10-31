import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError(null);
    setLoading(true);
    const demoEmail = 'organizer@celebraplan.com';
    const demoPassword = 'Password123!';
    try {
      try {
        await login(demoEmail, demoPassword);
      } catch (err) {
        // If demo user doesn't exist yet, register them
        await register('Demo Event Organizer', demoEmail, demoPassword);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2 id="auth-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
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

        <div className="modal-body">
          {/* Quick Demo One-Click Access */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                width: '100%',
                background: 'var(--primary-50)',
                borderColor: 'var(--primary-200)',
                color: 'var(--primary-800)',
                padding: '10px 16px',
              }}
              onClick={handleQuickDemoLogin}
              disabled={loading}
            >
              <Sparkles size={16} color="var(--primary-600)" aria-hidden="true" />
              <span>One-Click Demo Access</span>
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textAlign: 'center', marginTop: '6px' }}>
              Instant access for hackathon evaluators with preloaded sample events
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
            <hr style={{ flex: 1, borderColor: 'var(--slate-200)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>
              Or with email
            </span>
            <hr style={{ flex: 1, borderColor: 'var(--slate-200)' }} />
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.875rem' }}>
            {isRegister ? (
              <p style={{ color: 'var(--slate-600)' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setIsRegister(false)}
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p style={{ color: 'var(--slate-600)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setIsRegister(true)}
                >
                  Create one now
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
