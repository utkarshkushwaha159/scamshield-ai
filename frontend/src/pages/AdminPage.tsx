import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Sliders,
  History,
  Activity,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStats, AuditEvent, RuleConfigItem } from '../types';

export const AdminPage: React.FC = () => {

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [rules, setRules] = useState<RuleConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'analyst' | 'admin'>('analyst');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData, rulesData] = await Promise.all([
        api.getAdminStats(),
        api.getAuditLogs(),
        api.getRules(),
      ]);
      setStats(statsData);
      setAuditLogs(logsData);
      setRules(rulesData);
    } catch (err: any) {
      setError(err.message || 'Access denied or failed to load administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccess(null);
    setCreatingUser(true);
    try {
      const token = localStorage.getItem('scamshield_token');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          full_name: newFullName.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create user');
      }

      setUserSuccess(`User ${newUsername} successfully created!`);
      setNewUsername('');
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
    } catch (err: any) {
      alert(`User creation failed: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} className="spin" style={{ color: 'var(--brand-cyan)', margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--text-muted)' }}>Retrieving system telemetry and configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Administrator Access Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}. Please log in with administrator credentials (admin / Admin@ScamShield2026!).
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Settings size={24} color="var(--brand-cyan)" />
          Administration &amp; System Telemetry
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Real database metrics, detection rules registry, authorized personnel, and tamper-evident audit logs.
        </p>
      </div>

      {/* Database-Backed Metrics */}
      {stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total Cases Persisted</div>
            <div className="stat-value">{stats.total_cases}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Evidence Items Ingested</div>
            <div className="stat-value">{stats.total_evidences}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Indicators Flagged</div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>
              {stats.total_indicators_flagged}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Syndicate Links Correlated</div>
            <div className="stat-value" style={{ color: 'var(--brand-cyan)' }}>
              {stats.total_relationships}
            </div>
          </div>
        </div>
      )}

      {/* Threat Distribution Table */}
      {stats && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <span className="card-title">
              <Activity size={18} color="var(--brand-cyan)" />
              Database Threat Distribution Breakdown
            </span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Threat Vector / Signature</th>
                  <th>Occurrences</th>
                  <th>Proportion of Corpus</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.threat_breakdown).map(([threat, count]) => (
                  <tr key={threat}>
                    <td style={{ fontWeight: 600 }}>{threat}</td>
                    <td className="mono">{count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '120px', height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(count / stats.total_cases) * 100}%`, height: '100%', backgroundColor: 'var(--brand-cyan)' }} />
                        </div>
                        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {((count / stats.total_cases) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detection Rules Registry */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <span className="card-title">
            <Sliders size={18} color="var(--brand-cyan)" />
            Explainable Detection Rules Registry ({rules.length} Rules Active)
          </span>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Rule Identifier</th>
                <th>Rule Name &amp; Description</th>
                <th>Category</th>
                <th>Base Weight</th>
                <th>Severity</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.rule_id}>
                  <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--brand-cyan)' }}>
                    {rule.rule_id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{rule.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rule.description}</div>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                    {rule.category.replace('_', ' ')}
                  </td>
                  <td className="mono" style={{ fontWeight: 700, color: '#f59e0b' }}>
                    +{rule.base_weight.toFixed(1)}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: rule.severity === 'critical' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: rule.severity === 'critical' ? '#ef4444' : '#fbbf24' }}>
                      {rule.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management & Audit Log (Two Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '1.5rem' }}>
        {/* Provision Analyst User */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Users size={18} color="var(--brand-cyan)" />
              Provision Analyst / Admin Account
            </span>
          </div>

          {userSuccess && (
            <div className="notice notice-success" style={{ marginBottom: '1rem', padding: '0.65rem 1rem' }}>
              {userSuccess}
            </div>
          )}

          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. investigator2"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="investigator2@scamshield.local"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Rohan Sharma"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role Assignment</label>
              <select
                className="form-control"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
              >
                <option value="analyst">Fraud Analyst</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Provision User Account'}
            </button>
          </form>
        </div>

        {/* Audit Events Log */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <History size={18} color="var(--brand-cyan)" />
              Tamper-Evident System Audit Trail
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-cyan)' }}>
                    {log.action_type}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  Actor: <strong style={{ color: 'var(--text-primary)' }}>@{log.actor_username}</strong> &bull; Entity: {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                </div>
                {log.details && (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {log.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
