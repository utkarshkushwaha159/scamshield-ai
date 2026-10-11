import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Lock,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  PhoneCall,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

interface EvidenceDraft {
  evidence_type: string;
  content: string;
  sender_or_source: string;
}

const PRESET_SCENARIOS = [
  {
    label: 'Reverse UPI Collect (Hinglish/English)',
    type: 'payment_interaction',
    sender: 'PhonePe Refund Desk',
    content: 'Sir your payment of Rs 3,500 failed. Open your Google Pay / PhonePe app and approve the collect request sent by refund.agent42@ybl and enter your UPI PIN to receive the money immediately back into your account.',
    notes: 'Received an unsolicited call after ordering food online.',
  },
  {
    label: 'बिजली कनेक्शन चेतावनी (Hindi)',
    type: 'sms',
    sender: 'SMS-9876543210',
    content: 'प्रिय उपभोक्ता, आपका बिजली कनेक्शन आज रात 9:30 बजे बिजली कार्यालय से काट दिया जाएगा क्योंकि पिछले महीने का बिल अपडेट नहीं था। कृपया तुरंत अधिकारी 9876543210 पर संपर्क करें।',
    notes: 'Urgent evening SMS threatening electricity disconnection.',
  },
  {
    label: 'এসবিআই অ্যাকাউন্ট ব্লক নোটিশ (Bengali)',
    type: 'sms',
    sender: 'VK-SBISEC',
    content: 'প্রিয় গ্রাহক, আপনার এসবিআই ব্যাঙ্ক অ্যাকাউন্ট অস্থায়ীভাবে স্থগিত করা হয়েছে। অবিলম্বে প্যান কার্ড এবং কেওয়াইসি আপডেট করতে এই লিঙ্কে ক্লিক করুন: http://sbi-kyc-verify-portal.in',
    notes: 'Deceptive phishing SMS received in Bengali.',
  },
  {
    label: 'AnyDesk Support Takeover (English)',
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [evidenceItems, setEvidenceItems] = useState<EvidenceDraft[]>([
    { evidence_type: 'payment_interaction', content: '', sender_or_source: '' },
  ]);
  const [userNotes, setUserNotes] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);
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

    if (!consentGiven) {
      setError('Please provide explicit consent to voluntarily submit and analyze this interaction.');
      return;
    }

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
        consent_to_analyze: true
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

      navigate(`/analysis/${response.case_reference}`);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          {t('submit.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('submit.subtitle')}
        </p>
      </div>

      {/* 1930 Helpline Alert Banner */}
      <div className="notice" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <PhoneCall size={20} color="#f87171" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#f87171', display: 'block' }}>{t('helpline.banner')}</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('helpline.note')}</span>
          </div>
        </div>
        <a
          href="tel:1930"
          className="btn btn-outline"
          style={{ borderColor: '#f87171', color: '#f87171', fontSize: '0.85rem', padding: '0.4rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <PhoneCall size={14} />
          {t('helpline.callBtn')}
        </a>
      </div>

      {/* Safety Notice Banner */}
      <div className="notice notice-warning" style={{ alignItems: 'center', marginBottom: '1.5rem' }}>
        <Lock size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#fbbf24' }}>Privacy Rule: </strong>
          {t('submit.privacyWarning')}
        </div>
      </div>

      {/* Multilingual Tip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.6rem 0.9rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <Globe size={16} color="var(--brand-cyan)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {t('submit.multilingualTip')}
        </span>
      </div>

      {/* Quick Scenario Fill Buttons for Evaluators */}
      <div className="card" style={{ marginBottom: '1.75rem', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="var(--brand-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Evaluation Presets (Multilingual &amp; Common Financial Modus Operandi)
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
                {t('submit.evidenceType')} #{idx + 1}
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
                <label className="form-label">{t('submit.evidenceType')}</label>
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
                <label className="form-label">{t('submit.sender')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('submit.senderPlaceholder')}
                  value={item.sender_or_source}
                  onChange={(e) => handleUpdateItem(idx, 'sender_or_source', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                {t('submit.content')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-control"
                placeholder={t('submit.contentPlaceholder')}
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

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('submit.notes')}</label>
            <textarea
              className="form-control"
              placeholder={t('submit.notesPlaceholder')}
              rows={2}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
            />
          </div>
        </div>

        {/* User Consent Checkbox */}
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              style={{ marginTop: '0.25rem', width: '16px', height: '16px', accentColor: 'var(--brand-cyan)' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              <CheckCircle2 size={14} color="#10b981" style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
              {t('submit.consentLabel')}
            </span>
          </label>
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
                {t('submit.analyzingBtn')}
              </>
            ) : (
              <>
                <Send size={18} />
                {t('submit.analyzeBtn')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
