import React from 'react';
import { DoctorStatus, AppointmentStatus, SlotStatus } from '../types';

export interface StatusBadgeProps {
  status: DoctorStatus | AppointmentStatus | SlotStatus | string;
  delayMinutes?: number;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  delayMinutes = 0,
  size = 'md'
}) => {
  let label = status.replace(/_/g, ' ');
  let statusClass = 'badge-neutral';
  let dotClass = 'bg-slate-400';

  switch (status) {
    case 'AVAILABLE':
      label = 'Available';
      statusClass = 'badge-available';
      dotClass = 'bg-emerald-500';
      break;
    case 'BUSY':
    case 'IN_PROGRESS':
      label = status === 'IN_PROGRESS' ? 'In Consultation' : 'Busy';
      statusClass = 'badge-busy';
      dotClass = 'bg-blue-500';
      break;
    case 'ON_BREAK':
      label = 'On Break';
      statusClass = 'badge-neutral';
      dotClass = 'bg-slate-400';
      break;
    case 'DELAYED':
      label = delayMinutes > 0 ? `Delayed (+${delayMinutes}m)` : 'Delayed';
      statusClass = 'badge-delayed';
      dotClass = 'bg-amber-500';
      break;
    case 'OFFLINE':
      label = 'Offline';
      statusClass = 'badge-neutral';
      dotClass = 'bg-slate-400';
      break;
    case 'CONFIRMED':
      label = 'Confirmed';
      statusClass = 'badge-confirmed';
      dotClass = 'bg-emerald-500';
      break;
    case 'CHECKED_IN':
      label = 'Checked In';
      statusClass = 'badge-checked-in';
      dotClass = 'bg-cyan-500';
      break;
    case 'COMPLETED':
      label = 'Completed';
      statusClass = 'badge-neutral';
      dotClass = 'bg-slate-500';
      break;
    case 'CANCELLED':
      label = 'Cancelled';
      statusClass = 'badge-cancelled';
      dotClass = 'bg-rose-500';
      break;
    case 'NO_SHOW':
      label = 'No Show';
      statusClass = 'badge-cancelled';
      dotClass = 'bg-rose-400';
      break;
    case 'BOOKED':
      label = 'Booked';
      statusClass = 'badge-neutral';
      dotClass = 'bg-slate-400';
      break;
    case 'BLOCKED':
      label = 'Unavailable';
      statusClass = 'badge-neutral';
      dotClass = 'bg-slate-400';
      break;
  }

  return (
    <span className={`badge-clinical badge-${size} ${statusClass}`}>
      <span className={`badge-dot ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
};
