import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  ArrowLeft,
  Loader2,
  FileText,
  Search,
  Globe,
  PhoneCall,
  Trash2
} from 'lucide-react';

import { api } from '../services/api';
import { CaseDetail } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const AnalysisResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { caseRef } = useParams<{ caseRef: string }>();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeEvidenceView, setActiveEvidenceView] = useState<'original' | 'translation'>('original');
  const [selectedTranslationLang, setSelectedTranslationLang] = useState<'en' | 'hi' | 'bn'>('en');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteCase = async () => {
    if (!caseData) return;
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this report? This satisfies your privacy deletion rights and permanently purges records.'
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.deleteCase(caseData.id);
      // Remove from local storage history
      const existingHistory: string[] = JSON.parse(
        localStorage.getItem('scamshield_submitted_cases') || '[]'
      );
      const filtered = existingHistory.filter((ref) => ref !== caseData.case_reference);
      localStorage.setItem('scamshield_submitted_cases', JSON.stringify(filtered));

      alert('Case successfully purged from database.');
      navigate('/history');
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} className="spin" style={{ color: 'var(--brand-cyan)', margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Analyzing Evidence &amp; Correlating Graph...</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Evaluating deterministic rules, language signals, and indicators...</p>
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

  const isHighRisk = caseData.risk_category === 'high' || caseData.risk_category === 'critical';

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/submit" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={14} />
            Submit Another
          </Link>
          <button
            type="button"
            onClick={handleDeleteCase}
            disabled={isDeleting}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            title="Permanently purge this report per privacy data deletion rights"
          >
            <Trash2 size={13} />
            {isDeleting ? 'Purging...' : 'Delete Report (Privacy Purge)'}
          </button>
        </div>

        <Link to={`/investigate/${caseData.id}`} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
          <Search size={14} />
          Open in Analyst Workspace &rarr;
        </Link>
      </div>

      {/* High-Risk 1930 Emergency Helpline Box */}
      {isHighRisk && (
        <div className="notice" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.5)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PhoneCall size={24} color="#f87171" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#f87171', fontSize: '1rem' }}>
                Suspected Financial Fraud Workflow Detected
              </strong>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                If money was transferred or an unauthorized collect request approved, immediately contact the National Cyber Fraud Helpline at <strong>1930</strong> to initiate account/UPI freeze.
              </div>
            </div>
          </div>
          <a
            href="tel:1930"
            className="btn btn-primary"
            style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <PhoneCall size={16} />
            Call 1930 Helpline
          </a>
        </div>
      )}

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
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Weight</th>
                  <th>Observed Match / Explanation</th>
                </tr>
              </thead>
              <tbody>
                {caseData.indicators.map((ind, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--brand-cyan)' }}>
                        {ind.rule_id}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ind.rule_name}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>
                        {ind.category}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            ind.severity === 'critical' ? 'rgba(220, 38, 38, 0.2)' :
                            ind.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' :
                            ind.severity === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color:
                            ind.severity === 'critical' ? '#f87171' :
                            ind.severity === 'high' ? '#ef4444' :
                            ind.severity === 'medium' ? '#fbbf24' : '#34d399',
                        }}
                      >
                        {ind.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="mono" style={{ fontWeight: 700 }}>+{ind.score_contribution.toFixed(1)}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div>{ind.explanation}</div>
                      {ind.matched_value && (
                        <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Matched: "{ind.matched_value}"
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Multilingual Evidence Inspection (Original Unicode vs Translation) */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span className="card-title">
              <FileText size={18} color="var(--text-secondary)" />
              Submitted Evidence ({caseData.evidences.length} Items)
            </span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Detected Input Language: <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{caseData.source_language || 'EN'}</strong> (Confidence: {((caseData.language_confidence || 1.0) * 100).toFixed(0)}%)
            </div>
          </div>

          {/* Toggle between Original and Machine Translation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-app)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setActiveEvidenceView('original')}
                className={`btn ${activeEvidenceView === 'original' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', border: 'none' }}
              >
                Original (Unmodified Unicode)
              </button>
              <button
                type="button"
                onClick={() => setActiveEvidenceView('translation')}
                className={`btn ${activeEvidenceView === 'translation' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', border: 'none' }}
              >
                Machine Translation
              </button>
            </div>

            {activeEvidenceView === 'translation' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Globe size={14} color="var(--text-muted)" />
                <select
                  value={selectedTranslationLang}
                  onChange={(e) => setSelectedTranslationLang(e.target.value as any)}
                  className="form-control"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                  title="Target Translation Language"
                >
                  <option value="en">English (EN)</option>
                  <option value="hi">Hindi (HI)</option>
                  <option value="bn">Bengali (BN)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {activeEvidenceView === 'translation' && (
          <div className="notice" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderLeft: '3px solid var(--brand-cyan)', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <strong>Translation Notice: </strong>
            Machine translation is generated for analyst and admin reading convenience. Original Unicode evidence is preserved intact and never overwritten.
          </div>
        )}

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
                <span>
                  {activeEvidenceView === 'original' ? (
                    <span className="badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--brand-cyan)' }}>
                      Preserved Original
                    </span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                      Machine Translated ({selectedTranslationLang.toUpperCase()})
                    </span>
                  )}
                </span>
              </div>
              <pre
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  lineHeight: 1.5
                }}
              >
                {activeEvidenceView === 'original'
                  ? ev.raw_content
                  : (caseData.translations && caseData.translations[selectedTranslationLang])
                  ? caseData.translations[selectedTranslationLang]
                  : ev.raw_content}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
