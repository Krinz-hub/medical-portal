import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ShieldCheck, Stethoscope } from 'lucide-react';
import { DoctorProfile } from '../types';
import { StatusBadge } from './StatusBadge';
import { Button } from './ui/Button';
import { formatDoctorName } from '../utils/dateUtils';

export interface DoctorCardProps {
  doctor: DoctorProfile;
  onBookClick?: (doctor: DoctorProfile) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const rawName = typeof doctor.userId === 'object' ? doctor.userId.name : 'Doctor';
  const doctorName = formatDoctorName(rawName);
  const initials = doctorName.replace(/^Dr\.\s*/, '').charAt(0) || 'D';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors duration-150">
      <div className="space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-heading font-bold text-base shrink-0 overflow-hidden">
            {doctor.profileImage ? (
              <img src={doctor.profileImage} alt={doctorName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-heading text-base font-bold text-slate-900 truncate">
                {doctorName}
              </h3>
              <span className="badge-clinical badge-sm badge-success shrink-0">
                <ShieldCheck className="w-3 h-3 text-[#059669]" />
                Verified
              </span>
            </div>

            <p className="text-xs font-medium text-[#0E4F43] mt-0.5 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-[#0E4F43]" />
              {doctor.specialization}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{doctor.qualification}</p>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
              <span className="text-slate-500 font-medium">
                {doctor.experience}+ yrs exp
              </span>
              <span className="font-mono font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs">
                ₹{doctor.consultationFee}
              </span>
              {doctor.registrationNumber && (
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Reg: {doctor.registrationNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Practice Location */}
        <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="truncate">
            <strong className="text-slate-800 font-medium">{doctor.clinicName}</strong> · {doctor.clinicAddress}
          </span>
        </div>

        {/* Practice Status & Next Open Slot */}
        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/80 flex items-center justify-between">
          <StatusBadge status={doctor.status} delayMinutes={doctor.delayMinutes} size="sm" />
          {doctor.nextAvailableSlot ? (
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block font-medium">Next open slot</span>
              <span className="font-mono text-xs font-semibold text-[#0E4F43] flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-slate-400" />
                {doctor.nextAvailableSlot.startTime} ({doctor.nextAvailableSlot.date.split('-').slice(1).join('/')})
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No open slots today</span>
          )}
        </div>
      </div>

      {/* Direct Actions (no trailing arrow filler) */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <Link to={`/doctors/${doctor._id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View Profile
          </Button>
        </Link>
        <Link to={`/doctors/${doctor._id}#booking-section`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full">
            Book Slot
          </Button>
        </Link>
      </div>
    </div>
  );
};
