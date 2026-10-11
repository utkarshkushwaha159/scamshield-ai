import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  History,
  Network,
  Loader2,
  Send
} from 'lucide-react';

import { api, getStoredUser } from '../services/api';
import { CaseDetail, CaseStatus } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const CaseInvestigationPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const currentUser = getStoredUser();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note form state
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<CaseStatus>('in_investigation');
  const [statusReason, setStatusReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Graph relations for this case
  const [relatedEdges, setRelatedEdges] = useState<any[]>([]);

  const loadCase = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const data = await api.getCaseById(Number(caseId));
      setCaseData(data);
      setTargetStatus(data.status);

      // Load graph relationships for this case
      const graph = await api.getGraph(Number(caseId));
      setRelatedEdges(graph.edges);
    } catch (err: any) {
      setError(err.message || 'Failed to load case investigation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !caseData) return;
    setSubmittingNote(true);
    try {
      await api.addAnalystNote(caseData.id, noteContent.trim());
      setNoteContent('');
      await loadCase();
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusReason.trim() || !caseData) return;
    setSubmittingStatus(true);
    try {
      await api.updateCaseStatus(caseData.id, targetStatus, statusReason.trim());
      setShowStatusModal(false);
      setStatusReason('');
      await loadCase();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setSubmittingStatus(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} className="spin" style={{ color: 'var(--brand-cyan)', margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading Investigation Dossier...</h2>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dossier Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</p>
        <Link to="/analyst" className="btn btn-primary">
          Return to Queue
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Navigation & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/analyst" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
          <ArrowLeft size={14} />
          Back to Analyst Queue
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to={`/graph?case_id=${caseData.id}`} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Network size={14} />
            Visual Graph View
          </Link>
          <button
            onClick={() => setShowStatusModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            Update Case Status &rarr;
          </button>
        </div>
      </div>

      {/* Case Dossier Title Banner */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>
                {caseData.case_reference}
              </span>
              <StatusBadge status={caseData.status} />
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Database ID: #{caseData.id}
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {caseData.title}
            </h1>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Primary Threat: <strong style={{ color: 'var(--text-primary)' }}>{caseData.primary_threat_type}</strong></span>
              <span>Submitted: {new Date(caseData.created_at).toLocaleString()}</span>
              <span>Updated: {new Date(caseData.updated_at).toLocaleString()}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <RiskBadge category={caseData.risk_category} score={caseData.risk_score} />
            <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Uncertainty: {caseData.uncertainty_level.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Split Investigation Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: Evidence & Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Evidence Records */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Search size={18} color="var(--brand-cyan)" />
                Evidence Provenance &amp; Raw Content
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {caseData.evidences.map((ev, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                    <span className="badge" style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--brand-cyan)' }}>
                      {ev.evidence_type.toUpperCase()}
                    </span>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>Evidence ID #{ev.id}</span>
                  </div>
                  <pre style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', marginBottom: '0.75rem' }}>
                    {ev.raw_content}
                  </pre>
                  {ev.extracted_entities && (
                    <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                      <strong>Extracted Anchors: </strong>
                      {ev.extracted_entities.upi_ids?.length > 0 && (
                        <span className="mono" style={{ color: 'var(--brand-cyan)', marginRight: '8px' }}>
                          UPI: {ev.extracted_entities.upi_ids.join(', ')}
                        </span>
                      )}
                      {ev.extracted_entities.phone_numbers?.length > 0 && (
                        <span className="mono" style={{ color: '#fbbf24', marginRight: '8px' }}>
                          Phone: {ev.extracted_entities.phone_numbers.join(', ')}
                        </span>
                      )}
                      {ev.extracted_entities.domains?.length > 0 && (
                        <span className="mono" style={{ color: '#f87171' }}>
                          Host: {ev.extracted_entities.domains.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Triggered Rule Indicators */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <ShieldAlert size={18} color="var(--brand-cyan)" />
                Detected Indicators ({caseData.indicators.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {caseData.indicators.map((ind, idx) => (
                <div key={idx} style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-cyan)' }}>
                      {ind.rule_id}
                    </span>
                    <span className="mono" style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700 }}>
                      +{ind.score_contribution.toFixed(1)} pts
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {ind.rule_name}
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.4rem' }}>
                    {ind.explanation}
                  </p>
                  {ind.matched_value && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Matched excerpt: <span className="mono" style={{ color: 'var(--text-primary)' }}>&ldquo;{ind.matched_value}&rdquo;</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Correlation, Notes & Audit Trail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Correlated Cases */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Network size={18} color="var(--brand-cyan)" />
                Defensible Syndicate Correlations
              </span>
            </div>
            {relatedEdges.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                No cross-case correlations identified. This case does not currently share indicators with other repository cases.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {relatedEdges.map((edge, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span className="badge" style={{ backgroundColor: edge.is_inferred ? 'rgba(245, 158, 11, 0.15)' : 'rgba(2, 132, 199, 0.15)', color: edge.is_inferred ? '#fbbf24' : '#38bdf8' }}>
                        {edge.relationship_type.replace('_', ' ').toUpperCase()} ({edge.is_inferred ? 'INFERRED' : 'OBSERVED'})
                      </span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      {edge.justification}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analyst Notes Section */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <MessageSquare size={18} color="var(--brand-cyan)" />
                Analyst Findings &amp; Notes ({caseData.notes.length})
              </span>
            </div>

            {/* Note submission form */}
            <form onSubmit={handleAddNote} style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <textarea
                  className="form-control"
                  placeholder={currentUser ? "Record investigation findings, bank confirmation, or victim outreach notes..." : "Sign in to add investigation notes."}
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  disabled={!currentUser}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                  disabled={submittingNote || !noteContent.trim() || !currentUser}
                >
                  <Send size={14} />
                  Add Finding Note
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {caseData.notes.map((note) => (
                <div key={note.id} style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--brand-cyan)' }}>@{note.author_username}</span>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Review Audit Trail */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <History size={18} color="var(--text-secondary)" />
                Status Transition Audit Log
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {caseData.review_actions.map((act) => (
                <div key={act.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>@{act.actor_username}</strong> moved status from{' '}
                      <span className="mono">{act.previous_status}</span> &rarr; <strong style={{ color: 'var(--brand-cyan)' }}>{act.new_status}</strong>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(act.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Rationale: &ldquo;{act.reason}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal Dialog */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Transition Case Status
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Provide a defensible rationale for transitioning this case. All changes are permanently recorded in the audit log.
            </p>

            <form onSubmit={handleUpdateStatus}>
              <div className="form-group">
                <label className="form-label">Target Status</label>
                <select
                  className="form-control"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="in_investigation">In Active Investigation</option>
                  <option value="verified_scam">Verified Scam</option>
                  <option value="inconclusive">Inconclusive</option>
                  <option value="false_positive">Legitimate / False Positive</option>
                  <option value="closed_resolved">Closed / Resolved</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mandatory Transition Rationale <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Document why this status is justified (e.g. 'Confirmed with NPCI portal that collect request was malicious' or 'Genuine transaction from official banking sender')..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingStatus || !statusReason.trim()}
                >
                  {submittingStatus ? 'Persisting...' : 'Confirm Status Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
