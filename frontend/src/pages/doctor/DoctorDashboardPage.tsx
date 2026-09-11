import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorApi, appointmentApi } from '../../services/api';
import { DoctorProfile, DoctorStatus } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DoctorDashboardPage: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();
  const doctor = profile as DoctorProfile | null;

  const [queueData, setQueueData] = useState<any>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<DoctorStatus>(doctor?.status || 'AVAILABLE');
  const [delayMinutes, setDelayMinutes] = useState<number>(doctor?.delayMinutes || 20);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const data = await appointmentApi.getDoctorQueue();
      setQueueData(data);
    } catch (err) {
      console.error('Failed to load doctor queue:', err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      await doctorApi.updateStatus(selectedStatus, selectedStatus === 'DELAYED' ? delayMinutes : 0);
      await refreshUser();
      setIsStatusModalOpen(false);
      loadQueue();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const nextPatient = queueData?.queue?.find((q: any) =>
    ['CHECKED_IN', 'CONFIRMED'].includes(q.status)
  );

  const currentServing = queueData?.queue?.find((q: any) => q.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {todayStr}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Good day, {user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : 'Doctor'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clinic: <strong>{doctor?.clinicName}</strong> · Standard Consultation: {doctor?.averageConsultationMinutes} mins
          </p>
        </div>

        {/* Live Status Controls */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              Current Status
            </span>
            <div className="mt-0.5">
              {doctor && (
                <StatusBadge
                  status={doctor.status}
                  delayMinutes={doctor.delayMinutes}
                  size="md"
                />
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStatus(doctor?.status || 'AVAILABLE');
              setDelayMinutes(doctor?.delayMinutes || 20);
              setIsStatusModalOpen(true);
            }}
          >
            Change Status
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid (Section 36) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={queueData?.stats?.totalToday || 0}
          icon={<Calendar className="w-5 h-5" />}
          colorScheme="brand"
        />
        <StatCard
          title="Waiting In Queue"
          value={queueData?.stats?.waitingCount || 0}
          icon={<Users className="w-5 h-5" />}
          colorScheme="amber"
        />
        <StatCard
          title="Completed Consultations"
          value={queueData?.stats?.completedCount || 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          colorScheme="emerald"
        />
        <StatCard
          title="Next Patient Due"
          value={nextPatient ? nextPatient.startTime : 'None'}
          subtitle={nextPatient ? `Token #${nextPatient.queueNumber} (${nextPatient.patientName})` : 'All cleared'}
          icon={<Clock className="w-5 h-5" />}
          colorScheme="slate"
        />
      </div>

      {/* Current Active Consultation Callout */}
      {currentServing ? (
        <div className="p-4 sm:p-5 rounded-xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-base shrink-0">
              #{currentServing.queueNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-teal-200/80 text-teal-900 px-2 py-0.5 rounded">
                  Currently Consulting
                </span>
                <span className="text-xs text-teal-800 font-medium">
                  Started at {currentServing.startedAt ? new Date(currentServing.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : currentServing.startTime}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{currentServing.patientName}</h3>
              <p className="text-xs text-slate-600">Reason: {currentServing.reason}</p>
            </div>
          </div>

          <Link to="/doctor/queue">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Manage in Live Queue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">No Consultation In Progress</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {nextPatient ? `Next in line is ${nextPatient.patientName} (Token #${nextPatient.queueNumber})` : 'Queue is currently clear.'}
            </p>
          </div>
          <Link to="/doctor/queue">
            <Button variant="primary" size="sm" rightIcon={<Play className="w-3.5 h-3.5" />}>
              Open Queue
            </Button>
          </Link>
        </div>
      )}

      {/* Queue Preview Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Patient Lineup</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time appointments for {queueData?.date || todayStr}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadQueue} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Link to="/doctor/queue">
              <Button variant="outline" size="sm">
                Full Queue View →
              </Button>
            </Link>
          </div>
        </div>

        {isLoadingQueue ? (
          <LoadingSkeleton rows={2} />
        ) : !queueData?.queue?.length ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No appointments scheduled for today. Use the <strong>Schedule & Slots</strong> manager to generate bookable slots.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Token #</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Scheduled Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queueData.queue.slice(0, 5).map((item: any) => (
                  <tr key={item.appointmentId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-extrabold text-brand-700">#{item.queueNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{item.patientName}</td>
                    <td className="py-3 px-3 text-slate-600">{item.startTime}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link to="/doctor/queue">
                        <span className="text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
                          Manage →
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Status Modal (Section 37) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Live Operational Status"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            Changing your status immediately propagates to patient searches and live queues across the platform.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(['AVAILABLE', 'BUSY', 'ON_BREAK', 'DELAYED', 'OFFLINE'] as DoctorStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-colors ${
                  selectedStatus === st
                    ? 'bg-teal-50 border-teal-700 ring-1 ring-teal-700 text-teal-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Delay Input if DELAYED is selected */}
          {selectedStatus === 'DELAYED' && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-2 animate-fade-in">
              <label className="block text-xs font-semibold text-amber-900">
                Estimated Delay Duration (Minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  className="w-28 text-sm font-semibold p-2 rounded-lg border border-amber-300 bg-white"
                />
                <span className="text-xs text-amber-800">
                  Adds {delayMinutes}m to patient wait estimates and flags delay notice.
                </span>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleUpdateStatus}
              isLoading={isUpdatingStatus}
            >
              Apply Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
