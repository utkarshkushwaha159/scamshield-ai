import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft, LogIn, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = []
}) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="spin" style={{ color: 'var(--brand-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Verifying authenticated session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const hasRole = allowedRoles.some((role) => role.toLowerCase() === userRole);

    if (!hasRole) {
      return (
        <div style={{ maxWidth: '580px', margin: '4rem auto', padding: '0 1rem' }}>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}
            >
              <ShieldAlert size={28} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Privilege Restriction (403)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              You are signed in as <strong>{user.username}</strong> with the <strong>{user.role?.toUpperCase()}</strong> role.
              This area requires <strong>{allowedRoles.map(r => r.toUpperCase()).join(' or ')}</strong> privileges.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                <Lock size={14} style={{ color: 'var(--brand-cyan)' }} />
                Why am I seeing this?
              </div>
              New accounts registered via Google Sign-In automatically default to the standard <strong>USER</strong> role to preserve platform integrity. Elevated <strong>ANALYST</strong> or <strong>ADMIN</strong> roles can be granted by an administrator.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/" className="btn btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
                <ArrowLeft size={15} />
                Return to Safe Home
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              >
                <LogIn size={15} />
                Switch Account
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
