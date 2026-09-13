import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Stethoscope,
  Heart,
  Baby,
  Brain,
  Activity
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
    { name: 'Pediatrician', icon: Baby, description: 'Child & Adolescent Care' },
    { name: 'Neurologist', icon: Brain, description: 'Neurology & Spine' },
    { name: 'General Medicine', icon: Stethoscope, description: 'Primary Care & Diagnostics' }
  ];

  return (
    <div className="page-container space-y-8">
      {/* 1. If Patient has an Active Appointment Today, it is the Uncontested Focal Point */}
      {liveQueue && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <h2 className="font-heading text-sm font-bold text-slate-900">
                Your Consultation Board Today
              </h2>
            </div>
            <Link to="/patient/appointments" className="text-xs font-semibold text-[#0E4F43] hover:underline">
              All Appointments
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

      {/* 2. Primary Action: Specialist Search & Discovery */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
        <div className="max-w-2xl space-y-3">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            Consult verified specialists with real-time waiting visibility.
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Reserve exact consultation slots without double booking. Check live queue progress and arrival times directly from your dashboard.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by doctor name, specialty, or clinic..."
                className="form-input !pl-10 !pr-3.5 !py-2.5 text-xs sm:text-sm"
              />
            </div>
            <Button type="submit" variant="primary" size="md" className="shrink-0">
              Find Doctors
            </Button>
          </form>

          {/* Quick Filter Chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Quick Filters:</span>
            <Link
              to="/doctors?availableToday=true"
              className="px-2.5 py-1 rounded-md bg-[#F0FDF8] text-[#0E4F43] font-medium border border-[#A7F3D0] hover:bg-[#E6F9F2] transition-colors"
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

      {/* 3. Clinical Specialties */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 tracking-tight">Clinical Departments</h2>
            <p className="text-xs text-slate-500">Board-certified specialists across clinical departments</p>
          </div>
          <Link to="/doctors" className="text-xs font-semibold text-[#0E4F43] hover:underline">
            View All Specialties
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {specialties.map((spec) => {
            const Icon = spec.icon;
            return (
              <Link
                key={spec.name}
                to={`/doctors?specialization=${encodeURIComponent(spec.name)}`}
                className="bg-white rounded-xl border border-slate-200/90 p-4 hover:border-slate-300 hover:shadow-xs transition-colors group text-left block"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F0FDF8] text-[#0E4F43] flex items-center justify-center mb-2.5 border border-[#A7F3D0]/60">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-heading text-xs font-bold text-slate-900 group-hover:text-[#0E4F43] transition-colors">
                  {spec.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{spec.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Verified Available Doctors */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 tracking-tight">Practicing Physicians</h2>
            <p className="text-xs text-slate-500">Physicians with open appointment schedules</p>
          </div>
          <Link to="/doctors" className="text-xs font-semibold text-[#0E4F43] hover:underline">
            View All Doctors
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
    </div>
  );
};
