import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, KeyRound, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { api, setAuthToken, setStoredUser } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await api.login(username.trim(), password);
      setAuthToken(resp.access_token);
      setStoredUser({
        id: resp.user_id,
        username: resp.username,
        email: `${resp.username}@scamshield.local`,
        full_name: resp.full_name,
        role: resp.role,
        is_active: true,
        created_at: new Date().toISOString(),
      });

      if (resp.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/analyst');
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'var(--brand-cyan-dim)',
              color: 'var(--brand-cyan)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
            }}
          >
            <Lock size={22} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Privileged Analyst Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Sign in to access case triage, notes, and audit workflows.
          </p>
        </div>

        {/* Demo Fast-Fill Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-cyan)', marginBottom: '0.5rem' }}>
            <Sparkles size={13} />
            HACKATHON DEMO ACCOUNTS
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => handleFillDemo('analyst', 'Analyst@ScamShield2026!')}
            >
              Sign in as Analyst
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => handleFillDemo('admin', 'Admin@ScamShield2026!')}
            >
              Sign in as Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="notice notice-danger" style={{ marginBottom: '1.25rem', padding: '0.65rem 0.85rem', fontSize: '0.825rem' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.25rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="analyst or admin"
                required
              />
              <User
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.25rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
              <KeyRound
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.7rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Authenticating...
              </>
            ) : (
              'Authenticate Session'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
