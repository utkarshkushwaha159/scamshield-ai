import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Network,
  Lock,
  ShieldCheck,
  HelpCircle,
  Zap
} from 'lucide-react';


export const LandingPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '840px', margin: '1rem auto 0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          backgroundColor: 'var(--brand-cyan-dim)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: 'var(--brand-cyan)',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '1.25rem'
        }}>
          <Zap size={14} />
          RAKSHAM PS-02 &bull; Explainable Financial Scam Intelligence
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1.2,
          marginBottom: '1rem',
          color: 'var(--text-primary)'
        }}>
          Detect the pattern. Understand the threat. <br />
          <span style={{ color: 'var(--brand-cyan)' }}>Act before the loss.</span>
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          ScamShield AI provides transparent, evidence-linked financial scam workflow intelligence
          for UPI, digital wallets, and net banking. We evaluate malicious deceptive workflows,
          explain every risk indicator, and correlate multi-victim syndicate patterns.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            <ShieldAlert size={18} />
            Submit Suspicious Evidence
          </Link>
          <Link to="/analyst" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            <Search size={18} />
            Explore Analyst Portal
          </Link>
          <Link to="/graph" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            <Network size={18} />
            View Correlation Graph
          </Link>
        </div>
      </section>

      {/* Core Principles & Differentiators */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Why ScamShield AI is Different
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Moving beyond opaque black-box classifiers to explainable, evidence-linked scam intelligence.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          <div className="card">
            <div style={{ color: 'var(--brand-cyan)', marginBottom: '0.75rem' }}>
              <ShieldCheck size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Explainable Detection
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Every risk score is backed by explicit, deterministic rules with documented contributions,
              matched excerpts, and clear cybersecurity explanations—never an opaque score without reasoning.
            </p>
          </div>

          <div className="card">
            <div style={{ color: 'var(--brand-primary)', marginBottom: '0.75rem' }}>
              <Network size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Defensible Evidence Correlation
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Connects disparate cases only through concrete verified anchors (shared UPI VPAs, phone numbers,
              or phishing hosts) to uncover syndicate infrastructure without spurious connections.
            </p>
          </div>

          <div className="card">
            <div style={{ color: '#10b981', marginBottom: '0.75rem' }}>
              <Lock size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Privacy &amp; Safety by Design
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Voluntary evidence ingestion with automatic negative-qualifier handling. We never collect or
              store credentials, OTPs, or private banking tokens, and never automatically execute transactions.
            </p>
          </div>

          <div className="card">
            <div style={{ color: '#f59e0b', marginBottom: '0.75rem' }}>
              <HelpCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Honest Uncertainty &amp; Oversight
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              The engine explicitly calculates confidence and uncertainty levels, preventing false accusations
              and reserving high-impact classifications for human analyst review.
            </p>
          </div>
        </div>
      </section>

      {/* Common Modus Operandi Addressed */}
      <section className="card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Deceptive Scam Workflows Analyzed
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.25rem'
        }}>
          <div style={{ background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
              Reverse UPI Collect Requests
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Tricking victims into entering their UPI PIN under the false pretext of receiving a refund or prize.
            </p>
          </div>

          <div style={{ background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
              Remote Desktop Takeover
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Fake customer care instructing installation of AnyDesk or TeamViewer to intercept banking OTPs.
            </p>
          </div>

          <div style={{ background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
              Utility Disconnection Threats
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Urgent evening SMS threats claiming imminent electricity shut-off with fake personal helpline numbers.
            </p>
          </div>

          <div style={{ background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
              Bank KYC Suspension Links
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Phishing messages warning of PAN / account freeze paired with shortened or obfuscated web domains.
            </p>
          </div>
        </div>
      </section>

      {/* Safe Action Callout */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(6, 182, 212, 0.08))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Received a suspicious payment message or call?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '600px' }}>
            Submit the text, link, or description. In less than a second, get an explainable risk breakdown
            and safe steps to protect your account.
          </p>
        </div>
        <Link to="/submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
          Analyze Now &rarr;
        </Link>
      </section>
    </div>
  );
};
