import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, KeyRound, AlertCircle, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithCredentials, isFirebaseConfigured } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const redirectAfterLogin = (role: string) => {
    const from = (location.state as any)?.from;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }
    const normalized = role.toLowerCase();
    if (normalized === 'admin') {
      navigate('/admin', { replace: true });
    } else if (normalized === 'analyst') {
      navigate('/analyst', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const profile = await loginWithCredentials(username, password);
      setSuccessMsg(`Welcome, ${profile.full_name || profile.username}! Redirecting...`);
      setTimeout(() => redirectAfterLogin(profile.role), 300);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!isFirebaseConfigured) {
      setError('Firebase is not yet configured with valid credentials in frontend/.env. You can also sign in with the hackathon demo credentials below.');
      return;
    }

    setGoogleLoading(true);
    try {
      const profile = await loginWithGoogle();
      setSuccessMsg(`Authenticated via Google as ${profile.full_name || profile.username}! Redirecting...`);
      setTimeout(() => redirectAfterLogin(profile.role), 300);
    } catch (err: any) {
      let message = err.message || 'Firebase Google Sign-In failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed before completing authentication.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Multiple popup requests initiated. Please try again.';
      } else if (err.code === 'auth/unauthorized-domain') {
        message = 'This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).';
      }
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div style={{ maxWidth: '460px', margin: '3rem auto' }}>
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
            Privileged Portal Login
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Secure Firebase Authentication and Role-Based Access Control (USER, ANALYST, ADMIN).
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {googleLoading ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            <span>Sign in with Google (Firebase)</span>
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            New Google accounts default to the USER role. Elevated roles require admin grant.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR LOCAL VERIFIED CREDENTIALS</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
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
            HACKATHON VERIFIED ACCOUNTS
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

        {successMsg && (
          <div className="notice notice-success" style={{ marginBottom: '1.25rem', padding: '0.65rem 0.85rem', fontSize: '0.825rem' }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

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
            disabled={loading || googleLoading}
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
