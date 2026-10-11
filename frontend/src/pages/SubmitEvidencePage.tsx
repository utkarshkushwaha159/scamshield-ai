import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Lock,
  AlertCircle,
  Sparkles,
  Send,
  Loader2
} from 'lucide-react';

import { api } from '../services/api';

interface EvidenceDraft {
  evidence_type: string;
  content: string;
  sender_or_source: string;
}

const PRESET_SCENARIOS = [
  {
    label: 'Reverse UPI Collect Scam',
    type: 'payment_interaction',
    sender: 'PhonePe Refund Desk',
    content: 'Sir your payment of Rs 3,500 failed. Open your Google Pay / PhonePe app and approve the collect request sent by refund.agent42@ybl and enter your UPI PIN to receive the money immediately back into your account.',
    notes: 'Received an unsolicited call after ordering food online.',
  },
  {
    label: 'Electricity Disconnection Threat',
    type: 'sms',
    sender: 'SMS-9876543210',
    content: 'Dear consumer electricity power will disconnect tonight at 9:30 PM from the power office because your previous month bill was not updated. Please call officer immediately at 9876543210. Discom Helpline.',
    notes: 'Urgent evening SMS threatening power outage.',
  },
  {
    label: 'AnyDesk Support Takeover',
    type: 'payment_interaction',
    sender: '+919123456789',
    content: 'Caller stated he was SBI fraud department checking unauthorized transaction of Rs 15,000. He instructed me to download AnyDesk from Play Store and provide the 9 digit address number to verify my bank device identity.',
    notes: 'Caller insisted this was required by RBI guidelines.',
  },
  {
    label: 'Legitimate Bank Alert (Baseline)',
    type: 'sms',
    sender: 'VK-HDFCBK',
    content: 'Dear Customer, OTP for your transaction of Rs 1,250 at Flipkart on card 9812 is 749102. Valid for 10 minutes. Do not share this OTP with anyone, including bank staff. HDFC Bank.',
    notes: 'Routine purchase confirmation OTP.',
  },
];

export const SubmitEvidencePage: React.FC = () => {
  const navigate = useNavigate();
  const [evidenceItems, setEvidenceItems] = useState<EvidenceDraft[]>([
    { evidence_type: 'payment_interaction', content: '', sender_or_source: '' },
  ]);
  const [userNotes, setUserNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    setEvidenceItems([
      ...evidenceItems,
      { evidence_type: 'sms', content: '', sender_or_source: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (evidenceItems.length <= 1) return;
    setEvidenceItems(evidenceItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof EvidenceDraft, value: string) => {
    const updated = [...evidenceItems];
    updated[index][field] = value;
    setEvidenceItems(updated);
  };

  const handleLoadPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setEvidenceItems([
      {
        evidence_type: preset.type,
        content: preset.content,
        sender_or_source: preset.sender,
      },
    ]);
    setUserNotes(preset.notes);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const emptyItem = evidenceItems.find((it) => it.content.trim().length < 5);
    if (emptyItem) {
      setError('Please provide at least 5 characters for each submitted evidence item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.submitEvidence({
        evidence_items: evidenceItems.map((it) => ({
          evidence_type: it.evidence_type,
          content: it.content.trim(),
          sender_or_source: it.sender_or_source.trim() || undefined,
        })),
        user_notes: userNotes.trim() || undefined,
      });

      // Save reference to local history
      const existingHistory: string[] = JSON.parse(
        localStorage.getItem('scamshield_submitted_cases') || '[]'
      );
      if (!existingHistory.includes(response.case_reference)) {
        existingHistory.unshift(response.case_reference);
        localStorage.setItem(
          'scamshield_submitted_cases',
          JSON.stringify(existingHistory.slice(0, 30))
        );
      }

      // Navigate to detailed results
      navigate(`/analysis/${response.case_reference}`);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Submit Suspicious Evidence
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Voluntarily submit suspicious payment requests, deceptive messages, URLs, or caller instructions.
          Our deterministic engine will analyze the indicators and provide an explainable risk breakdown.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="notice notice-warning" style={{ alignItems: 'center' }}>
        <Lock size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#fbbf24' }}>Privacy &amp; Security Rule: </strong>
          Never share your OTP, ATM PIN, UPI MPIN, or banking passwords. ScamShield AI only analyzes
          communication patterns and never requests payment credentials.
        </div>
      </div>

      {/* Quick Scenario Fill Buttons for Evaluators */}
      <div className="card" style={{ marginBottom: '1.75rem', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="var(--brand-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Demonstration Presets (Click to autofill known scam &amp; legitimate test cases)
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => handleLoadPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="notice notice-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {evidenceItems.map((item, idx) => (
          <div key={idx} className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '0.95rem' }}>
                <ShieldAlert size={16} color="var(--brand-cyan)" />
                Evidence Item #{idx + 1}
              </span>
              {evidenceItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="btn btn-outline"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#ef4444' }}
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Evidence Channel</label>
                <select
                  className="form-control"
                  value={item.evidence_type}
                  onChange={(e) => handleUpdateItem(idx, 'evidence_type', e.target.value)}
                >
                  <option value="payment_interaction">Payment Interaction / Collect Request</option>
                  <option value="sms">SMS / Text Message</option>
                  <option value="email">Email</option>
                  <option value="url">Suspicious URL / Phishing Domain</option>
                  <option value="other">Social Media / Messaging App (WhatsApp/Telegram)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Sender / Origin Contact (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +919876543210, SMS-SBIBNK, or unknown"
                  value={item.sender_or_source}
                  onChange={(e) => handleUpdateItem(idx, 'sender_or_source', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Content or Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                placeholder="Paste the exact text received, URL link, or describe what the caller/interaction demanded..."
                rows={4}
                value={item.content}
                onChange={(e) => handleUpdateItem(idx, 'content', e.target.value)}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.content.length} characters
                </span>
              </div>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={handleAddItem}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={15} />
            Add Another Evidence Source
          </button>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Optional Context / Reporter Notes</label>
            <textarea
              className="form-control"
              placeholder="Any context? (e.g. 'I was selling an item on OLX when the buyer sent this collect request...')"
              rows={2}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin" />
                Analyzing Indicators...
              </>
            ) : (
              <>
                <Send size={18} />
                Analyze &amp; Generate Case
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
