import React from 'react';
import { AppointmentStatus } from '../types';
import { Clock, CheckCircle2, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  status: AppointmentStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
          Pending
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 shrink-0 whitespace-nowrap">
          <CheckCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          Confirmed
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          Cancelled
        </span>
      );
    default:
      return null;
  }
};
