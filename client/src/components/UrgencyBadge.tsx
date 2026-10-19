import React from 'react';
import { UrgencyLevel } from '../types';
import { AlertOctagon, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  urgency: UrgencyLevel;
  showIcon?: boolean;
}

export const UrgencyBadge: React.FC<Props> = ({ urgency, showIcon = true }) => {
  switch (urgency) {
    case 'EMERGENCY':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse shadow-xs shrink-0 whitespace-nowrap">
          {showIcon && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          EMERGENCY
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 shadow-xs shrink-0 whitespace-nowrap">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
          HIGH PRIORITY
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0 whitespace-nowrap">
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          MODERATE
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 whitespace-nowrap">
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          ROUTINE / LOW
        </span>
      );
    default:
      return null;
  }
};
