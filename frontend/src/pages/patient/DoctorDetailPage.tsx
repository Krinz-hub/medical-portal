import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Award,
  ShieldCheck,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi, slotApi, appointmentApi } from '../../services/api';
import { DoctorProfile, Slot, Appointment } from '../../types';
import { Calendar } from '../../components/Calendar';
import { TimeSlot } from '../../components/TimeSlot';
import { StatusBadge } from '../../components/StatusBadge';
import { DelayAlert } from '../../components/DelayAlert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { DoctorCard } from '../../components/DoctorCard';
import { formatDoctorName, getTodayLocalDate } from '../../utils/dateUtils';

export const DoctorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isPatient } = useAuth();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocalDate());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [consultationReason, setConsultationReason] = useState<string>('');

  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Success modal
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      doctorApi
        .getDoctorById(id)
        .then((doc) => {
          setDoctor(doc);
        })
        .catch((err) => console.error('Failed to load doctor details:', err))
        .finally(() => setIsLoadingDoctor(false));
    }
  }, [id]);

  const loadSlots = async (dateStr: string) => {
    if (!id) return;
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    setBookingError(null);
    try {
      const data = await slotApi.getDoctorSlots(id, dateStr);
      setSlots(data);
      const firstAvailable = data.find((s: Slot) => s.status === 'AVAILABLE');
      if (firstAvailable) {
        setSelectedSlot(firstAvailable);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (doctor) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, doctor]);

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isPatient) {
      setBookingError('You are logged in as a Doctor. Please log in with a Patient account to book appointments.');
      return;
    }
    if (!selectedSlot || !doctor) return;

    setIsBooking(true);
    setBookingError(null);

    try {
      const res = await appointmentApi.book(doctor._id, selectedSlot._id, consultationReason);
      setConfirmedAppointment(res.appointment);
      setIsSuccessModalOpen(true);
      // Refresh slots
      loadSlots(selectedDate);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        'This slot was just booked by another patient. Please select another time.';
      setBookingError(msg);
      // Refresh slots immediately to show latest availability
      loadSlots(selectedDate);
    } finally {
      setIsBooking(false);
    }
  };

  const [fallbackDoctors, setFallbackDoctors] = useState<DoctorProfile[]>([]);

  useEffect(() => {
    if (!doctor && !isLoadingDoctor) {
      doctorApi.listDoctors().then(setFallbackDoctors).catch(() => {});
    }
  }, [doctor, isLoadingDoctor]);

  if (isLoadingDoctor) {
    return <LoadingSkeleton rows={3} />;
  }

  if (!doctor) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <div className="p-6 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Doctor Profile Not Found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The requested doctor profile ID may be from an earlier session. Select one of our verified doctors below to view their profile and book an appointment:
          </p>
          <div className="pt-1">
            <Link to="/doctors">
              <Button variant="primary" size="sm">
                Browse All Doctors
              </Button>
            </Link>
          </div>
        </div>

        {fallbackDoctors.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-xs">
              Available Doctors for Consultation:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fallbackDoctors.map((doc) => (
                <DoctorCard key={doc._id} doctor={doc} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const doctorName = formatDoctorName(typeof doctor.userId === 'object' ? doctor.userId.name : '');
  const availableSlotsCount = slots.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div className="page-container max-w-5xl space-y-6">
      {/* Back button */}
      <Link
        to="/doctors"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to doctors
      </Link>

      {/* Doctor Profile Banner */}
      <div className="card-clinical p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden">
            {doctor.profileImage ? (
              <img src={doctor.profileImage} alt={doctorName} className="w-full h-full object-cover" />
            ) : (
              <span>{doctorName.replace(/^Dr\.\s*/, '').charAt(0) || 'D'}</span>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{doctorName}</h1>
                  <span className="badge-clinical badge-success badge-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
                <p className="text-sm font-medium text-teal-700 mt-0.5">{doctor.specialization}</p>
                <p className="text-xs text-slate-500">{doctor.qualification}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={doctor.status} delayMinutes={doctor.delayMinutes} size="md" />
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900">₹{doctor.consultationFee}</span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                    Consultation Fee
                  </span>
                </div>
                <a href="#booking-section">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CalendarIcon className="w-3.5 h-3.5" />}
                  >
                    Book Appointment
                  </Button>
                </a>
              </div>
            </div>

            {/* Delay alert if doctor is delayed */}
            {doctor.delayMinutes > 0 && (
              <div className="pt-2">
                <DelayAlert delayMinutes={doctor.delayMinutes} doctorName={doctorName} />
              </div>
            )}

            {/* Quick Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-brand-600" />
                <strong>{doctor.experience}+ Years</strong> Experience
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Reg: <strong>{doctor.registrationNumber}</strong>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                <strong>{doctor.clinicName}</strong>, {doctor.clinicAddress}
              </span>
            </div>

            {/* About / Bio */}
            {doctor.bio && (
              <div className="pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">About Doctor</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{doctor.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date & Slot Booking Section */}
      <div id="booking-section" className="card-clinical p-6 sm:p-7 space-y-5 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-teal-700" />
              <span>Select Available Appointment Slot</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose an open consultation time. Slot updates are reflected in real time.
            </p>
          </div>
          {availableSlotsCount > 0 && !selectedSlot && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const first = slots.find((s) => s.status === 'AVAILABLE');
                if (first) setSelectedSlot(first);
              }}
            >
              Pick Next Available Slot
            </Button>
          )}
        </div>

        {/* Horizontal Date Picker Strip */}
        <Calendar selectedDate={selectedDate} onDateChange={setSelectedDate} daysCount={14} />

        {/* Slots Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-800">
                {selectedDate} ({availableSlotsCount} open slots)
              </span>
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Booked
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Blocked
                </span>
              </div>
            </div>
          </div>

          {isLoadingSlots ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading open slots...</div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
              No consultation slots configured for this date. Please select another date above.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map((slot) => (
                <TimeSlot
                  key={slot._id}
                  slot={slot}
                  isSelected={selectedSlot?._id === slot._id}
                  onSelect={(s) => {
                    setSelectedSlot(s);
                    setBookingError(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Selected Slot Confirmation Bar */}
        {selectedSlot ? (
          <div className="p-4 rounded-lg bg-teal-50/60 border border-teal-200 space-y-3.5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 block">
                  Selected Time Slot
                </span>
                <p className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-teal-700" />
                  {selectedSlot.startTime} – {selectedSlot.endTime} on {selectedSlot.date}
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-900 bg-white px-3 py-1 rounded border border-teal-200 self-start">
                Consultation Fee: ₹{doctor.consultationFee}
              </span>
            </div>

            {/* Consultation Reason Input */}
            <div className="form-group">
              <label className="form-label">
                Reason for Consultation (Optional)
              </label>
              <input
                type="text"
                value={consultationReason}
                onChange={(e) => setConsultationReason(e.target.value)}
                placeholder="e.g. Routine checkup, follow-up, symptom review..."
                className="form-input"
              />
            </div>

            {/* Error banner if double booking conflict */}
            {bookingError && (
              <div className="alert-banner-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Book Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-teal-200/60">
              <p className="text-xs text-slate-500">
                Direct atomic reservation. Your token number is issued immediately upon confirmation.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={handleBooking}
                isLoading={isBooking}
                className="w-full sm:w-auto px-6"
              >
                Confirm & Book Appointment
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <span className="text-xs text-slate-500">
              Please click any available time slot above to reserve an appointment.
            </span>
            {availableSlotsCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const first = slots.find((s) => s.status === 'AVAILABLE');
                  if (first) setSelectedSlot(first);
                }}
              >
                Auto-Select First Slot
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal (Section 30) */}
      {confirmedAppointment && (
        <Modal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            setIsSuccessModalOpen(false);
            navigate('/patient/appointments');
          }}
          title="Appointment Confirmed"
        >
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{doctorName}</h3>
              <p className="text-xs text-brand-700 font-semibold">{doctor.specialization}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-bold text-slate-900">{confirmedAppointment.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-900">{doctor.clinicName}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Queue Token:</span>
                <span className="font-extrabold text-brand-700">#{confirmedAppointment.queueNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Appointment ID:</span>
                <span className="font-mono text-[11px] text-slate-600">{confirmedAppointment._id}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate('/patient/appointments');
                }}
              >
                View My Appointments
              </Button>
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                }}
              >
                Book Another Slot
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
