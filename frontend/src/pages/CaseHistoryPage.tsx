import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, Search, ShieldAlert, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    const fetchSubmittedCases = async () => {
      try {
        setLoading(true);
        // Get all cases or user submitted references
        const allCases = await api.listCases();
        const storedRefs: string[] = JSON.parse(
          localStorage.getItem('scamshield_submitted_cases') || '[]'
        );

        if (storedRefs.length > 0) {
          // Prioritize stored references first
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

    fetchSubmittedCases();
  }, []);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRef.trim()) return;
    setSearchError(null);
    navigate(`/analysis/${searchRef.trim()}`);
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={24} color="var(--brand-cyan)" />
            Case History &amp; Tracking
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
                <th>Action</th>
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
                    <Link
                      to={`/analysis/${c.case_reference}`}
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      View &rarr;
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
