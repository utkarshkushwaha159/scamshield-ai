import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, Search, ShieldAlert, Loader2, Trash2, PhoneCall } from 'lucide-react';

import { api } from '../services/api';
import { CaseSummary } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const CaseHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRef, setSearchRef] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchSubmittedCases = async () => {
    try {
      setLoading(true);
      const allCases = await api.listCases();
      const storedRefs: string[] = JSON.parse(
        localStorage.getItem('scamshield_submitted_cases') || '[]'
      );

      if (storedRefs.length > 0) {
        const matched = allCases.filter((c) => storedRefs.includes(c.case_reference));
        const others = allCases.filter((c) => !storedRefs.includes(c.case_reference));
        setCases([...matched, ...others]);
      } else {
        setCases(allCases);
      }
    } catch (err) {
      console.error('Failed to load case history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmittedCases();
  }, []);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    setSearchError(null);
    navigate(`/analysis/${searchRef.trim()}`);
  };

  const handleDelete = async (caseId: number, caseRef: string) => {
    const confirmed = window.confirm(
      `Permanently delete case ${caseRef}? This purges all associated evidence under user privacy rights.`
    );
    if (!confirmed) return;

    try {
      await api.deleteCase(caseId);
      const storedRefs: string[] = JSON.parse(
        localStorage.getItem('scamshield_submitted_cases') || '[]'
      );
      const filtered = storedRefs.filter((r) => r !== caseRef);
      localStorage.setItem('scamshield_submitted_cases', JSON.stringify(filtered));
      setCases((prev) => prev.filter((c) => c.id !== caseId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={24} color="var(--brand-cyan)" />
            Case History &amp; User Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Inspect previously submitted evidence cases and track ongoing verification statuses.
          </p>
        </div>

        {/* Quick Reference Search */}
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. SCAM-2026-8812"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            style={{ width: '200px' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
            <Search size={15} />
            Lookup
          </button>
        </form>
      </div>

      {/* 1930 Helpline Assistance Banner */}
      <div className="notice" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <PhoneCall size={18} color="#f87171" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            Need immediate help with unauthorized bank debits or cyber fraud? <strong>National Cyber Fraud Helpline: 1930</strong>
          </span>
        </div>
        <a
          href="tel:1930"
          className="btn btn-outline"
          style={{ borderColor: '#f87171', color: '#f87171', fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <PhoneCall size={13} />
          Call 1930
        </a>
      </div>

      {searchError && (
        <div className="notice notice-danger" style={{ marginBottom: '1.25rem' }}>
          {searchError}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--brand-cyan)', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading case records...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <ShieldAlert size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Cases Submitted Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            You have not submitted any suspicious payment messages or calls in this session.
          </p>
          <Link to="/submit" className="btn btn-primary">
            Submit Your First Case
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Case Reference</th>
                  <th>Threat Classification</th>
                  <th>Risk Level</th>
                  <th>Case Status</th>
                  <th>Indicators</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        to={`/analysis/${c.case_reference}`}
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
                      {c.indicator_count} rules
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Link
                          to={`/analysis/${c.case_reference}`}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        >
                          View &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.case_reference)}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="Purge case per privacy right"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
