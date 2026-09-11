import React from 'react';
import { Calendar, Clock, MapPin, Activity, RotateCcw, XCircle, ChevronRight } from 'lucide-react';
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
  const isCompleted = appointment.status === 'COMPLETED';
  const isCancelled = appointment.status === 'CANCELLED';

  const todayStr = getTodayLocalDate();
  const isToday = appointment.date === todayStr;
  const canTrackQueue = (isConfirmed || isCheckedIn || isInProgress) && isToday;
  const canModify = isConfirmed;

  return (
    <div className="card-clinical-interactive p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{doctorName}</h3>
            {doctor?.specialization && (
              <span className="badge-clinical badge-primary badge-sm">
                {doctor.specialization}
              </span>
            )}
          </div>
          {doctor?.clinicName && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {doctor.clinicName} · {doctor.clinicAddress}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start">
          <StatusBadge status={appointment.status} />
          <span className="badge-clinical badge-neutral badge-sm font-semibold">
            Token #{appointment.queueNumber}
          </span>
        </div>
      </div>

      {/* Date & Time Row */}
      <div className="py-3 flex flex-wrap items-center gap-4 text-xs text-slate-700">
        <span className="flex items-center gap-1.5 font-semibold">
          <Calendar className="w-4 h-4 text-brand-600" />
          {appointment.date}
          {isToday && (
            <span className="text-[10px] uppercase font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
              Today
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5 font-semibold">
          <Clock className="w-4 h-4 text-brand-600" />
          {appointment.startTime} – {appointment.endTime}
        </span>
        <span className="text-slate-500 italic truncate max-w-xs">
          "{appointment.reason || 'General Consultation'}"
        </span>
      </div>

      {/* Action Buttons */}
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
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
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
