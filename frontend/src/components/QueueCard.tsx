import React from 'react';
import { Users, Clock, Stethoscope, RefreshCw, AlertCircle } from 'lucide-react';
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Clinic Header Strip */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0E4F43] text-white flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Stethoscope className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-sm font-bold tracking-tight text-white">
                {doctorDisplayName}
              </h3>
              <span className="text-xs text-slate-300 font-normal">
                ({queueData.specialization})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled Slot: <span className="font-mono text-slate-200">{queueData.startTime}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <StatusBadge status={queueData.doctorStatus} delayMinutes={queueData.delayMinutes} size="sm" />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
              title="Refresh queue status"
              aria-label="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Delay alert if doctor reported delay */}
      {queueData.isDoctorDelayed && (
        <div className="p-4 bg-[#FFFBEB] border-b border-[#FDE68A]">
          <DelayAlert
            delayMinutes={queueData.delayMinutes}
            doctorName={doctorDisplayName}
            updatedTime={queueData.estimatedConsultationTime}
          />
        </div>
      )}

      {/* Triage Status Board - High Legibility Quantitative Grid */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white">
        {/* Your Token Position */}
        <div className="bg-[#F0FDF8] rounded-xl p-4 border border-[#A7F3D0] text-center sm:text-left">
          <span className="text-xs font-semibold text-[#0E4F43] block">
            Your Token Number
          </span>
          <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#090D16] tracking-tight">
              #{queueData.queueNumber}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Assigned for today's clinic session
          </p>
        </div>

        {/* Patients Ahead */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-center sm:text-left">
          <span className="text-xs font-semibold text-slate-600 block">
            Patients Ahead in Line
          </span>
          <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {queueData.patientsAhead}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {queueData.patientsAhead === 1 ? 'patient' : 'patients'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {queueData.patientsAhead === 0 ? 'You are next in line!' : 'Waiting before your consultation'}
          </p>
        </div>

        {/* Estimated Turn Time */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-center sm:text-left">
          <span className="text-xs font-semibold text-slate-600 block">
            Estimated Consultation Time
          </span>
          <div className="mt-1 flex items-baseline justify-center sm:justify-start gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#0E4F43] tracking-tight">
              {queueData.estimatedConsultationTime}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Approx. <strong className="font-mono text-slate-800">{queueData.estimatedWaitMinutes}m</strong> wait from now
          </p>
        </div>
      </div>

      {/* Currently In Room - Live Room Status */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
          <span className="font-medium text-slate-700">Currently in consultation room:</span>
        </div>
        <div className="font-semibold text-slate-900">
          {queueData.currentServingQueueNumber ? (
            <span className="inline-flex items-center gap-1.5 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200">
              Token #{queueData.currentServingQueueNumber} ({queueData.currentServingPatientName || 'Patient'})
            </span>
          ) : (
            <span className="text-slate-500 italic font-normal">Waiting for next patient to enter</span>
          )}
        </div>
      </div>
    </div>
  );
};
