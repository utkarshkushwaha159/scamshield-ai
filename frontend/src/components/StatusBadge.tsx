import React from 'react';
import { Clock, Search, ShieldAlert, HelpCircle, CheckCircle2, Archive } from 'lucide-react';
import { CaseStatus } from '../types';

interface StatusBadgeProps {
  status: CaseStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending_review':
        return {
          className: 'badge-status',
          icon: <Clock size={13} />,
          label: 'Pending Review',
        };
      case 'in_investigation':
        return {
          className: 'badge-status-in_investigation',
          icon: <Search size={13} />,
          label: 'In Investigation',
        };
      case 'verified_scam':
        return {
          className: 'badge-status-verified_scam',
          icon: <ShieldAlert size={13} />,
          label: 'Verified Scam',
        };
      case 'inconclusive':
        return {
          className: 'badge-status',
          icon: <HelpCircle size={13} />,
          label: 'Inconclusive',
        };
      case 'false_positive':
        return {
          className: 'badge-status-false_positive',
          icon: <CheckCircle2 size={13} />,
          label: 'Legitimate / False Positive',
        };
      case 'closed_resolved':
        return {
          className: 'badge-status',
          icon: <Archive size={13} />,
          label: 'Closed / Resolved',
        };
      default:
        return {
          className: 'badge-status',
          icon: <Clock size={13} />,
          label: status,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`badge ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
