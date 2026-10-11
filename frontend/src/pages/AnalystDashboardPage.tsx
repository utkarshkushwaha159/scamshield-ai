import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Search,
  ShieldAlert,
  RefreshCw,
  Loader2
} from 'lucide-react';

import { api, getStoredUser } from '../services/api';
import { CaseSummary, CaseStatus, RiskCategory } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const AnalystDashboardPage: React.FC = () => {
  const currentUser = getStoredUser();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | ''>('');
  const [riskFilter, setRiskFilter] = useState<RiskCategory | ''>('');

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await api.listCases({
        status: (statusFilter || undefined) as CaseStatus,
        risk: (riskFilter || undefined) as RiskCategory,
        search: searchTerm.trim() || undefined,
      });
      setCases(data);
    } catch (err) {
      console.error('Failed to load analyst cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter, riskFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases();
  };

  // Compute live counts from cases
  const pendingCount = cases.filter((c) => c.status === 'pending_review').length;
  const investigatingCount = cases.filter((c) => c.status === 'in_investigation').length;
  const verifiedCount = cases.filter((c) => c.status === 'verified_scam').length;
  const criticalCount = cases.filter((c) => c.risk_category === 'critical').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={24} color="var(--brand-cyan)" />
            Analyst Investigation Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Triaging queue and case management for verified cyber fraud analysts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={loadCases}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
            title="Refresh database records"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          {!currentUser && (
            <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              Sign In with Analyst Token
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Pending Review</div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {pendingCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Active Investigation</div>
          <div className="stat-value" style={{ color: 'var(--brand-cyan)' }}>
            {investigatingCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Verified Scams</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {verifiedCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical Threat Cases</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>
            {criticalCount}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search reference, threat type, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="in_investigation">In Investigation</option>
              <option value="verified_scam">Verified Scam</option>
              <option value="inconclusive">Inconclusive</option>
              <option value="false_positive">False Positive</option>
              <option value="closed_resolved">Closed / Resolved</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              className="form-control"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
            >
              <option value="">All Risk Bands</option>
              <option value="critical">Critical Risk</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Apply Filters
          </button>
        </form>
      </div>

      {/* Cases Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--brand-cyan)', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-muted)' }}>Retrieving cases from database...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <ShieldAlert size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Cases Match Your Criteria</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try broadening your search query or status filter.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Case Ref</th>
                <th>Threat Signature &amp; Context</th>
                <th>Risk Classification</th>
                <th>Workflow Status</th>
                <th>Indicators</th>
                <th>Evidence Items</th>
                <th>Updated</th>
                <th>Investigation</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      to={`/investigate/${c.id}`}
                      className="mono"
                      style={{ fontWeight: 700, color: 'var(--brand-cyan)', textDecoration: 'none' }}
                    >
                      {c.case_reference}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.primary_threat_type}</div>
                    <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>{c.title}</div>
                  </td>
                  <td>
                    <RiskBadge category={c.risk_category} score={c.risk_score} />
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="mono" style={{ fontSize: '0.85rem' }}>
                    {c.indicator_count}
                  </td>
                  <td className="mono" style={{ fontSize: '0.85rem' }}>
                    {c.evidence_count}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(c.updated_at).toLocaleDateString()}
                  </td>
                  <td>
                    <Link
                      to={`/investigate/${c.id}`}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Investigate &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
