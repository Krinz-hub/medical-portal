import React from 'react';
import { Users, Clock, Stethoscope, RefreshCw } from 'lucide-react';
import { LiveQueueStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { DelayAlert } from './DelayAlert';
import { formatDoctorName } from '../utils/dateUtils';

export interface QueueCardProps {
  queueData: LiveQueueStatus;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const QueueCard: React.FC<QueueCardProps> = ({
  queueData,
  onRefresh,
  isRefreshing = false
}) => {
  const doctorDisplayName = formatDoctorName(queueData.doctorName);

  return (
    <div className="card-clinical p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Live Consultation Queue</h3>
            <p className="text-xs text-slate-500 font-medium">
              {doctorDisplayName} · <span className="text-teal-700">{queueData.specialization}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={queueData.doctorStatus} delayMinutes={queueData.delayMinutes} size="sm" />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-700' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Delay alert if doctor reported delay */}
      {queueData.isDoctorDelayed && (
        <DelayAlert
          delayMinutes={queueData.delayMinutes}
          doctorName={doctorDisplayName}
          updatedTime={queueData.estimatedConsultationTime}
        />
      )}

      {/* Main Queue Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Your Position */}
        <div className="bg-teal-50/50 rounded-lg p-3.5 text-center border border-teal-200">
          <span className="text-[10px] uppercase font-semibold text-teal-800 tracking-wider block">
            Your Token
          </span>
          <span className="text-2xl font-bold text-teal-900 mt-0.5 block">
            #{queueData.queueNumber}
          </span>
          <span className="text-[11px] text-slate-600 font-medium mt-0.5 block">
            Slot: <strong>{queueData.startTime}</strong>
          </span>
        </div>

        {/* Patients Ahead */}
        <div className="bg-slate-50 rounded-lg p-3.5 text-center border border-slate-200">
          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
            Patients Ahead
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-0.5 block flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400 inline" />
            {queueData.patientsAhead}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            in line before your turn
          </span>
        </div>

        {/* Estimated Wait */}
        <div className="bg-slate-50 rounded-lg p-3.5 text-center border border-slate-200">
          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
            Estimated Wait
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-0.5 block">
            ~{queueData.estimatedWaitMinutes}m
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            Est. time: <strong>{queueData.estimatedConsultationTime}</strong>
          </span>
        </div>
      </div>

      {/* Current Serving Info */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span className="text-slate-600 font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          Currently in consultation room:
        </span>
        <span className="font-semibold text-slate-900 flex items-center gap-2">
          {queueData.currentServingQueueNumber ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              Token #{queueData.currentServingQueueNumber} ({queueData.currentServingPatientName || 'Patient'})
            </>
          ) : (
            <span className="text-slate-500 font-normal italic">Waiting for next patient to enter</span>
          )}
        </span>
      </div>
    </div>
  );
};
