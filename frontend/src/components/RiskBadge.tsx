import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';
import { RiskCategory } from '../types';

interface RiskBadgeProps {
  category: RiskCategory;
  score?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, showScore = true }) => {
  const getBadgeConfig = () => {
    switch (category) {
      case 'low':
        return {
          className: 'badge-risk-low',
          icon: <ShieldCheck size={14} />,
          label: 'Low Risk',
        };
      case 'medium':
        return {
          className: 'badge-risk-medium',
          icon: <AlertTriangle size={14} />,
          label: 'Medium Risk',
        };
      case 'high':
        return {
          className: 'badge-risk-high',
          icon: <AlertOctagon size={14} />,
          label: 'High Risk',
        };
      case 'critical':
        return {
          className: 'badge-risk-critical',
          icon: <Flame size={14} />,
          label: 'Critical Risk',
        };
      default:
        return {
          className: 'badge-status',
          icon: <ShieldCheck size={14} />,
          label: category,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`badge ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="mono" style={{ opacity: 0.85, marginLeft: '2px' }}>
          ({score.toFixed(1)})
        </span>
      )}
    </span>
  );
};
