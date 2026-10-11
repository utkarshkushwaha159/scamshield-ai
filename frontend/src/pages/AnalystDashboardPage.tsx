import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Search,
  ShieldAlert,
  RefreshCw,
  Loader2,
  Radio,
  Bell,
  ArrowRight
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
  const [wsConnected, setWsConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState<{
    id: number;
    case_reference: string;
    title: string;
    risk_category: string;
    risk_score: number;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

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

  // Connect to live WebSocket feed
  useEffect(() => {
    const wsUrl = `ws://127.0.0.1:8000/api/ws/cases`;
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
        console.log('Analyst live WebSocket feed connected.');
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NEW_CASE' && msg.case) {
            setLiveAlert(msg.case);
            // Prepend new case to list if it matches filters
            setCases((prev) => {
              if (prev.some((c) => c.id === msg.case.id)) return prev;
              const newSummary: CaseSummary = {
                id: msg.case.id,
                case_reference: msg.case.case_reference,
                title: msg.case.title,
                status: msg.case.status,
                risk_category: msg.case.risk_category,
                risk_score: msg.case.risk_score,
                uncertainty_level: 'low',
                primary_threat_type: msg.case.primary_threat_type,
                indicator_count: 1,
                evidence_count: 1,
                created_at: msg.case.created_at,
                updated_at: msg.case.created_at,
              };
              return [newSummary, ...prev];
            });
          }
        } catch (e) {
          // Heartbeat pong or non-json
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
      };

      socket.onerror = () => {
        setWsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket connection not supported in this context', err);
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={24} color="var(--brand-cyan)" />
            Analyst Investigation Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Live triaging queue, explainable score review, and case management for verified cyber fraud analysts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* WebSocket Status Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: wsConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${wsConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: wsConnected ? '#34d399' : '#f87171',
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <Radio size={12} className={wsConnected ? 'pulse' : ''} />
            <span>{wsConnected ? 'LIVE FEED CONNECTED' : 'OFFLINE'}</span>
          </div>

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

      {/* Real-Time Alert Banner from WebSocket */}
      {liveAlert && (
        <div
          className="notice"
          style={{
            backgroundColor: 'rgba(2, 132, 199, 0.15)',
            border: '1px solid var(--brand-cyan)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'fadeIn 0.3s ease',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bell size={20} color="var(--brand-cyan)" className="pulse" />
            <div>
              <strong style={{ color: 'var(--brand-cyan)' }}>REAL-TIME ALERT: New Case Submitted</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                <span className="mono" style={{ fontWeight: 700 }}>{liveAlert.case_reference}</span> &mdash; {liveAlert.title} (Score: {liveAlert.risk_score.toFixed(1)} / 100)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to={`/investigate/${liveAlert.id}`}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Investigate Now <ArrowRight size={13} />
            </Link>
            <button
              onClick={() => setLiveAlert(null)}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Try broadening your search term or clearing the status/risk band filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setRiskFilter('');
            }}
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Case Reference</th>
                  <th>Title / Modus Operandi</th>
                  <th>Status</th>
                  <th>Risk Level</th>
                  <th>Score</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        to={`/investigate/${c.id}`}
                        className="mono"
                        style={{ color: 'var(--brand-cyan)', fontWeight: 700, textDecoration: 'none' }}
                      >
                        {c.case_reference}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Threat: {c.primary_threat_type}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <RiskBadge category={c.risk_category} />
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700 }}>
                        {c.risk_score.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/investigate/${c.id}`}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        Investigate &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
