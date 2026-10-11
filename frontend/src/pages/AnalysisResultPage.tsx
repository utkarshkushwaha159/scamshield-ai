import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  ArrowLeft,
  Loader2,
  FileText,
  Search
} from 'lucide-react';

import { api } from '../services/api';
import { CaseDetail } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const AnalysisResultPage: React.FC = () => {
  const { caseRef } = useParams<{ caseRef: string }>();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!caseRef) return;
    const fetchCase = async () => {
      try {
        setLoading(true);
        const data = await api.getCaseByReference(caseRef);
        setCaseData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve case assessment.');
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseRef]);

  const copyRefToClipboard = () => {
    if (!caseData) return;
    navigator.clipboard.writeText(caseData.case_reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} className="spin" style={{ color: 'var(--brand-cyan)', margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Analyzing Evidence &amp; Correlating Graph...</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Evaluating deterministic rules and indicators...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Case Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error || `No record exists for reference '${caseRef}'.`}
        </p>
        <Link to="/submit" className="btn btn-primary">
          Submit New Evidence
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/submit" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={14} />
          Submit Another
        </Link>
        <Link to={`/investigate/${caseData.id}`} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
          <Search size={14} />
          Open in Analyst Workspace &rarr;
        </Link>
      </div>

      {/* Case Header Card */}
      <div className="card" style={{ marginBottom: '1.75rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>
                {caseData.case_reference}
              </span>
              <button
                type="button"
                onClick={copyRefToClipboard}
                className="btn btn-outline"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                title="Copy reference ID"
              >
                <Copy size={12} />
                {copied ? 'Copied!' : 'Copy Ref'}
              </button>
              <StatusBadge status={caseData.status} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {caseData.title}
            </h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <RiskBadge category={caseData.risk_category} score={caseData.risk_score} />
            <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Score: {caseData.risk_score.toFixed(1)} / 100.0
            </div>
          </div>
        </div>

        {/* Risk Score Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--bg-app)',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '1rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(caseData.risk_score, 100)}%`,
              backgroundColor:
                caseData.risk_category === 'critical' ? '#dc2626' :
                caseData.risk_category === 'high' ? '#ef4444' :
                caseData.risk_category === 'medium' ? '#f59e0b' : '#10b981',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Summary Description */}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {caseData.summary}
        </p>
      </div>

      {/* Honest Uncertainty & Confidence Callout */}
      <div className="card" style={{
        backgroundColor: 'var(--bg-app)',
        marginBottom: '1.75rem',
        borderLeft: `4px solid ${
          caseData.uncertainty_level === 'high' ? '#ef4444' :
          caseData.uncertainty_level === 'moderate' ? '#f59e0b' : '#10b981'
        }`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <HelpCircle size={16} color="var(--brand-cyan)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            System Assessment Confidence &amp; Honest Uncertainty
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <strong>Uncertainty Level: {caseData.uncertainty_level.toUpperCase()} </strong> (Confidence Score: {(caseData.confidence_score * 100).toFixed(0)}%).
          {caseData.uncertainty_level === 'high'
            ? ' This assessment is based on limited or ambiguous evidence. Do not take punitive action without independent corroboration.'
            : caseData.uncertainty_level === 'moderate'
            ? ' Indicators were detected with reasonable confidence, but human verification is advised before taking formal legal or banking escalation.'
            : ' Multiple high-confidence concrete indicators corroborate this risk classification.'}
        </p>
      </div>

      {/* Safe Recommended Actions */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <span className="card-title">
            <CheckCircle2 size={18} color="#10b981" />
            Safe Recommended Actions (Immediate Next Steps)
          </span>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {caseData.safe_recommendations.map((rec, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-app)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '1px'
              }}>
                {idx + 1}
              </div>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Transparent Indicators Breakdown Table */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <span className="card-title">
            <ShieldAlert size={18} color="var(--brand-cyan)" />
            Transparent Indicator Breakdown ({caseData.indicators.length} Triggered)
          </span>
        </div>

        {caseData.indicators.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
            No malicious scam indicators were triggered by the submitted text.
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Detection Rule</th>
                  <th>Severity</th>
                  <th>Contribution</th>
                  <th>Matched Pattern</th>
                </tr>
              </thead>
              <tbody>
                {caseData.indicators.map((ind, idx) => (
                  <tr key={idx}>
                    <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--brand-cyan)' }}>
                      {ind.rule_id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ind.rule_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {ind.explanation}
                      </div>
                    </td>
                    <td>
                      <RiskBadge category={ind.severity} showScore={false} />
                    </td>
                    <td className="mono" style={{ fontWeight: 700, color: '#f59e0b' }}>
                      +{ind.score_contribution.toFixed(1)}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '220px' }}>
                      {ind.matched_value ? (
                        <span style={{ backgroundColor: 'var(--bg-app)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          &ldquo;{ind.matched_value}&rdquo;
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submitted Evidence Records */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <FileText size={18} color="var(--text-secondary)" />
            Submitted Evidence Items ({caseData.evidences.length})
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {caseData.evidences.map((ev, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-app)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Channel: <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{ev.evidence_type}</strong></span>
                <span>ID: #{ev.id}</span>
              </div>
              <pre
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit'
                }}
              >
                {ev.raw_content}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
