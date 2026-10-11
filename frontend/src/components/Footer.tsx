import React from 'react';
import { ShieldCheck, PhoneCall, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              <ShieldCheck size={18} color="var(--brand-cyan)" />
              ScamShield AI
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px' }}>
              &ldquo;Detect the pattern. Understand the threat. Act before the loss.&rdquo; Explainable scam pattern recognition for UPI, banking, and digital wallets.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              National Cyber Emergency Support
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 600, fontSize: '0.9rem' }}>
              <PhoneCall size={16} />
              Toll-Free Cyber Fraud Helpline: 1930
            </div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
            >
              National Cyber Crime Reporting Portal (cybercrime.gov.in) &rarr;
            </a>
          </div>
        </div>

        <div className="footer-disclaimer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            <Info size={14} />
            Privacy &amp; Safety Commitment
          </div>
          ScamShield AI operates strictly on voluntarily submitted evidence records. We never request OTPs, PINs, passwords, or full card details. Risk assessments provide explainable indicator analysis and must not be used as calibrated probabilities or sole justification for punitive action. Human oversight is mandatory for all high-impact determinations.
        </div>
      </div>
    </footer>
  );
};
