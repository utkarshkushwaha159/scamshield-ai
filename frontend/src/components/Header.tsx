import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldAlert, Network, History, Lock, User, LogOut, Settings, PhoneCall, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('scamshield_ui_lang', newLang);
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo-icon">
            <Shield size={20} />
          </div>
          <div>
            <span>{t('appName')}</span>
            <span className="navbar-tagline">{t('tagline')}</span>
          </div>
        </Link>

        {/* 1930 National Cyber Fraud Helpline Emergency Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href="tel:1930"
            className="helpline-badge-header"
            title="National Cyber Fraud Helpline: Call 1930 immediately in case of financial fraud"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <PhoneCall size={13} />
            <span>1930 Helpline</span>
          </a>

          {/* Interface Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Globe size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={i18n.language || 'en'}
              onChange={handleLanguageChange}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                outline: 'none',
                fontWeight: 500
              }}
              title="Select Interface Language"
            >
              <option value="en" style={{ background: 'var(--bg-surface)' }}>EN (English)</option>
              <option value="hi" style={{ background: 'var(--bg-surface)' }}>HI (हिंदी)</option>
              <option value="bn" style={{ background: 'var(--bg-surface)' }}>BN (বাংলা)</option>
            </select>
          </div>
        </div>

        <nav className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/submit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={16} />
            {t('nav.submit')}
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <History size={16} />
            {t('nav.history')}
          </NavLink>
          <NavLink to="/graph" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Network size={16} />
            {t('nav.graph')}
          </NavLink>
          <NavLink to="/analyst" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Lock size={16} />
            {t('nav.analyst')}
          </NavLink>
          {currentUser?.role?.toLowerCase() === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={16} />
              {t('nav.admin')}
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
                title="Log out of session"
              >
                <LogOut size={13} />
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <Lock size={14} />
              {t('nav.login')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
