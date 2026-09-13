import React from 'react';
import { Calendar, Clock, MapPin, Activity, RotateCcw, XCircle } from 'lucide-react';
import { Appointment, DoctorProfile } from '../types';
import { StatusBadge } from './StatusBadge';
import { Button } from './ui/Button';
import { formatDoctorName, getTodayLocalDate } from '../utils/dateUtils';

export interface AppointmentCardProps {
  appointment: Appointment;
  onViewLiveQueue?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewLiveQueue,
  onReschedule,
  onCancel
}) => {
  const doctor = typeof appointment.doctorId === 'object' ? (appointment.doctorId as DoctorProfile) : null;
  const doctorUser = doctor && typeof doctor.userId === 'object' ? doctor.userId : null;
  const doctorName = formatDoctorName(doctorUser?.name);

  const isConfirmed = appointment.status === 'CONFIRMED';
  const isCheckedIn = appointment.status === 'CHECKED_IN';
  const isInProgress = appointment.status === 'IN_PROGRESS';
  const todayStr = getTodayLocalDate();
  const isToday = appointment.date === todayStr;
  const canTrackQueue = (isConfirmed || isCheckedIn || isInProgress) && isToday;
  const canModify = isConfirmed;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 hover:border-slate-300 transition-colors duration-150">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-slate-900">{doctorName}</h3>
            {doctor?.specialization && (
              <span className="text-xs font-medium text-[#0E4F43] bg-[#F0FDF8] px-2 py-0.5 rounded border border-[#A7F3D0]/60">
                {doctor.specialization}
              </span>
            )}
          </div>
          {doctor?.clinicName && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{doctor.clinicName} — {doctor.clinicAddress}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start">
          <StatusBadge status={appointment.status} />
          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
            Token #{appointment.queueNumber}
          </span>
        </div>
      </div>

      {/* Date, Time & Reason */}
      <div className="py-3.5 flex flex-wrap items-center gap-4 text-xs text-slate-700">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#0E4F43]" />
          <span className="font-mono font-medium">{appointment.date}</span>
          {isToday && (
            <span className="text-[10px] font-bold uppercase font-mono bg-[#ECFDF5] text-[#059669] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
              Today
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#0E4F43]" />
          <span className="font-mono font-semibold text-slate-900">
            {appointment.startTime} – {appointment.endTime}
          </span>
        </div>

        {appointment.reason && (
          <div className="text-slate-500 truncate max-w-xs pl-2 border-l border-slate-200">
            "{appointment.reason}"
          </div>
        )}
      </div>

      {/* Contextual Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 justify-end">
        {canTrackQueue && onViewLiveQueue && (
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Activity className="w-3.5 h-3.5" />}
            onClick={() => onViewLiveQueue(appointment)}
          >
            Track Live Queue
          </Button>
        )}

        {canModify && onReschedule && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
            onClick={() => onReschedule(appointment)}
          >
            Reschedule
          </Button>
        )}

        {canModify && onCancel && (
          <Button
            size="sm"
            variant="ghost"
            className="text-[#E11D48] hover:bg-rose-50 hover:text-rose-700"
            leftIcon={<XCircle className="w-3.5 h-3.5" />}
            onClick={() => onCancel(appointment)}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
