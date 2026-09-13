import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

import { formatDoctorName } from '../utils/dateUtils';

export interface DelayAlertProps {
  delayMinutes: number;
  doctorName?: string;
  updatedTime?: string;
}

export const DelayAlert: React.FC<DelayAlertProps> = ({
  delayMinutes,
  doctorName = 'The doctor',
  updatedTime
}) => {
  if (!delayMinutes || delayMinutes <= 0) return null;
  const displayName = doctorName === 'The doctor' ? doctorName : formatDoctorName(doctorName);

  return (
    <div className="alert-banner-warning">
      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
        <AlertCircle className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-amber-950">
            {displayName} is running {delayMinutes} minutes late
          </h4>
          <span className="badge-clinical badge-sm badge-warning">
            Delay Notice
          </span>
        </div>
        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
          Due to extended care during earlier consultations, current consultations are delayed.
        </p>
        {updatedTime && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md text-xs font-medium text-amber-950 border border-amber-200 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Updated estimated start: <strong className="font-mono font-bold text-amber-950">{updatedTime}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
