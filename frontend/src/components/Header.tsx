import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, Network, History, Lock, User, LogOut, Settings } from 'lucide-react';
import { getStoredUser, setAuthToken, setStoredUser } from '../services/api';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  const handleLogout = () => {
    setAuthToken(null);
    setStoredUser(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo-icon">
            <Shield size={20} />
          </div>
          <div>
            <span>ScamShield AI</span>
            <span className="navbar-tagline">Financial Scam Intelligence</span>
          </div>
        </Link>

        <nav className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            Home
          </NavLink>
          <NavLink to="/submit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={16} />
            Submit Evidence
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <History size={16} />
            Case History
          </NavLink>
          <NavLink to="/graph" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Network size={16} />
            Evidence Graph
          </NavLink>
          <NavLink to="/analyst" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Lock size={16} />
            Analyst Portal
          </NavLink>
          {currentUser?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={16} />
              Admin
            </NavLink>
          )}

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.5rem' }}>
              <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                <User size={12} />
                {currentUser.username} ({currentUser.role})
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                title="Log out of analyst session"
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Lock size={14} />
              Analyst Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
