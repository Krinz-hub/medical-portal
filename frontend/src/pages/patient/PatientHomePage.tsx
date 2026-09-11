import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Heart,
  Baby,
  Brain,
  Activity,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi, patientApi, appointmentApi } from '../../services/api';
import { DoctorProfile, Appointment, LiveQueueStatus } from '../../types';
import { DoctorCard } from '../../components/DoctorCard';
import { QueueCard } from '../../components/QueueCard';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { getTodayLocalDate } from '../../utils/dateUtils';

export const PatientHomePage: React.FC = () => {
  const { user, isPatient } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [todayAppointment, setTodayAppointment] = useState<Appointment | null>(null);
  const [liveQueue, setLiveQueue] = useState<LiveQueueStatus | null>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  useEffect(() => {
    // Load top doctors
    doctorApi
      .listDoctors({ availableToday: false })
      .then((data) => setDoctors(data.slice(0, 4)))
      .catch((err) => console.error('Failed to load doctors:', err))
      .finally(() => setIsLoadingDoctors(false));

    // Check if patient has a live appointment today
    if (user && isPatient) {
      patientApi
        .getAppointments('upcoming')
        .then(async (appts: Appointment[]) => {
          const todayStr = getTodayLocalDate();
          const todayAppt = appts.find(
            (a) => a.date === todayStr && ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(a.status)
          );
          if (todayAppt) {
            setTodayAppointment(todayAppt);
            setIsLoadingQueue(true);
            try {
              const q = await appointmentApi.getLiveQueue(todayAppt._id);
              setLiveQueue(q);
            } catch (e) {
              console.error('Failed to load queue:', e);
            } finally {
              setIsLoadingQueue(false);
            }
          }
        })
        .catch(() => {});
    }
  }, [user, isPatient]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  const specialties = [
    { name: 'Cardiologist', icon: Heart, description: 'Heart & Vascular' },
    { name: 'Dermatologist', icon: Sparkles, description: 'Skin & Aesthetics' },
    { name: 'Pediatrician', icon: Baby, description: 'Child Care' },
    { name: 'Neurologist', icon: Brain, description: 'Brain & Spine' },
    { name: 'General Medicine', icon: Stethoscope, description: 'Primary Health' }
  ];

  return (
    <div className="page-container space-y-8 animate-fade-in">
      {/* Search & Header Portal */}
      <section className="card-clinical p-6 sm:p-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Verified Doctors · Real-time Clinic Queue Tracking</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Book doctor consultations and monitor your queue position.
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Reserve your appointment slot with verified specialists. Track live queue wait times before arriving at the clinic to minimize waiting room delays.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by doctor name, specialty (e.g. Cardiology), or clinic..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors"
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="shrink-0">
              Find Doctors
            </Button>
          </form>

          {/* Quick Filter Links */}
          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Popular:</span>
            <Link
              to="/doctors?availableToday=true"
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
            >
              Available Today
            </Link>
            <Link
              to="/doctors?specialization=Cardiologist"
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
            >
              Cardiology
            </Link>
            <Link
              to="/doctors?specialization=Dermatologist"
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
            >
              Dermatology
            </Link>
            <Link
              to="/doctors?specialization=Pediatrician"
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
            >
              Pediatrics
            </Link>
          </div>
        </div>
      </section>

      {/* Live Today's Appointment Queue Tracker */}
      {liveQueue && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Your Appointment Today</span>
            </h2>
            <Link to="/patient/appointments" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1">
              View all appointments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <QueueCard
            queueData={liveQueue}
            onRefresh={async () => {
              if (todayAppointment) {
                const q = await appointmentApi.getLiveQueue(todayAppointment._id);
                setLiveQueue(q);
              }
            }}
            isRefreshing={isLoadingQueue}
          />
        </section>
      )}

      {/* Specialty Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Browse by Specialty</h2>
            <p className="text-xs text-slate-500">Consult with verified specialists across clinical disciplines</p>
          </div>
          <Link to="/doctors" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1">
            All specialties <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {specialties.map((spec) => {
            const Icon = spec.icon;
            return (
              <Link
                key={spec.name}
                to={`/doctors?specialization=${encodeURIComponent(spec.name)}`}
                className="card-clinical-interactive p-4 group text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5 border border-teal-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {spec.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{spec.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top Doctors Available */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Available Doctors</h2>
            <p className="text-xs text-slate-500">Verified physicians accepting appointments</p>
          </div>
          <Link to="/doctors" className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1">
            View all doctors <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoadingDoctors ? (
          <LoadingSkeleton rows={2} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        )}
      </section>

      {/* Clinical Standards & Queue Transparency */}
      <section className="card-clinical p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Verified Credentials</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Official medical council registration numbers displayed for every practicing doctor.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Direct Slot Reservation</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Atomic database reservation prevents double bookings and holds your chosen time.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Live Delay Tracking</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Real-time doctor delay updates allow patients to arrive exactly when consultations are ready.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
