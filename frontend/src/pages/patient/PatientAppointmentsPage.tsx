import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import { patientApi, appointmentApi, slotApi } from '../../services/api';
import { Appointment, LiveQueueStatus, Slot, DoctorProfile } from '../../types';
import { AppointmentCard } from '../../components/AppointmentCard';
import { QueueCard } from '../../components/QueueCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const PatientAppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live queue modal
  const [activeLiveQueue, setActiveLiveQueue] = useState<LiveQueueStatus | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);

  // Cancel modal
  const [selectedForCancel, setSelectedForCancel] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [isCancelling, setIsCancelling] = useState(false);

  // Reschedule modal
  const [selectedForReschedule, setSelectedForReschedule] = useState<Appointment | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<Slot | null>(null);
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await patientApi.getAppointments(activeTab);
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load patient appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [activeTab]);

  const handleOpenLiveQueue = async (appt: Appointment) => {
    try {
      const queue = await appointmentApi.getLiveQueue(appt._id);
      setActiveLiveQueue(queue);
      setIsQueueModalOpen(true);
    } catch (err) {
      console.error('Failed to load live queue:', err);
    }
  };

  const handleRefreshQueue = async () => {
    if (!activeLiveQueue) return;
    setIsRefreshingQueue(true);
    try {
      const queue = await appointmentApi.getLiveQueue(activeLiveQueue.appointmentId);
      setActiveLiveQueue(queue);
    } catch (err) {
      console.error('Failed to refresh queue:', err);
    } finally {
      setIsRefreshingQueue(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedForCancel) return;
    setIsCancelling(true);
    try {
      await appointmentApi.cancel(selectedForCancel._id, cancelReason);
      setSelectedForCancel(null);
      loadAppointments();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenReschedule = async (appt: Appointment) => {
    setSelectedForReschedule(appt);
    setSelectedNewSlot(null);
    setRescheduleError(null);
    setIsLoadingRescheduleSlots(true);

    const docId = typeof appt.doctorId === 'object' ? appt.doctorId._id : appt.doctorId;

    try {
      // Fetch available slots for today or next few days
      const slots = await slotApi.getDoctorSlots(docId, undefined, 'AVAILABLE');
      setRescheduleSlots(slots);
    } catch (err) {
      console.error('Failed to load slots for rescheduling:', err);
    } finally {
      setIsLoadingRescheduleSlots(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedForReschedule || !selectedNewSlot) return;
    setIsRescheduling(true);
    setRescheduleError(null);
    try {
      await appointmentApi.reschedule(selectedForReschedule._id, selectedNewSlot._id);
      setSelectedForReschedule(null);
      loadAppointments();
    } catch (err: any) {
      setRescheduleError(
        err.response?.data?.message || 'Failed to reschedule. Please pick an alternative slot.'
      );
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="page-container max-w-4xl animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">
            Manage your booked consultations, track live token queues, and reschedule slots.
          </p>
        </div>

        <div className="page-header-actions">
          <Link to="/doctors">
            <Button variant="primary" size="sm">
              + Book New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-[#0E4F43] text-[#0E4F43]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'completed'
              ? 'border-[#0E4F43] text-[#0E4F43]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'cancelled'
              ? 'border-[#0E4F43] text-[#0E4F43]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={`No ${activeTab} appointments`}
          description={
            activeTab === 'upcoming'
              ? "You don't have any upcoming doctor appointments scheduled."
              : `No appointments found under ${activeTab} status.`
          }
          action={
            activeTab === 'upcoming' ? (
              <Link to="/doctors">
                <Button variant="primary" size="md">
                  Find & Book a Doctor
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt._id}
              appointment={appt}
              onViewLiveQueue={handleOpenLiveQueue}
              onReschedule={handleOpenReschedule}
              onCancel={(a) => setSelectedForCancel(a)}
            />
          ))}
        </div>
      )}

      {/* Live Queue Modal (Section 32) */}
      {activeLiveQueue && (
        <Modal
          isOpen={isQueueModalOpen}
          onClose={() => setIsQueueModalOpen(false)}
          title="Live Doctor Queue Tracker"
          maxWidth="md"
        >
          <QueueCard
            queueData={activeLiveQueue}
            onRefresh={handleRefreshQueue}
            isRefreshing={isRefreshingQueue}
          />
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {selectedForCancel && (
        <Modal
          isOpen={!!selectedForCancel}
          onClose={() => setSelectedForCancel(null)}
          title="Cancel Appointment"
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your consultation for{' '}
              <strong>{selectedForCancel.date}</strong> at{' '}
              <strong>{selectedForCancel.startTime}</strong>? The slot will immediately become
              available for other patients.
            </p>

            <div className="form-group">
              <label className="form-label">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="form-select"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Doctor schedule conflict">Schedule conflict</option>
                <option value="Feeling better">Feeling better</option>
                <option value="Booked another appointment">Booked another appointment</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setSelectedForCancel(null)}
              >
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reschedule Modal (Section 61) */}
      {selectedForReschedule && (
        <Modal
          isOpen={!!selectedForReschedule}
          onClose={() => setSelectedForReschedule(null)}
          title="Reschedule Appointment"
          maxWidth="lg"
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600">
              Currently booked for <strong>{selectedForReschedule.date}</strong> at{' '}
              <strong>{selectedForReschedule.startTime}</strong>. Select an open slot to atomically
              swap your reservation:
            </p>

            {rescheduleError && (
              <div className="alert-banner-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            {isLoadingRescheduleSlots ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading open slots...</div>
            ) : rescheduleSlots.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-lg text-xs text-slate-500">
                No alternative open slots currently available. Please check back later.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
                {rescheduleSlots.map((slot) => (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={() => setSelectedNewSlot(slot)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors shadow-xs ${
                      selectedNewSlot?._id === slot._id
                        ? 'bg-[#F0FDF8] border-[#0E4F43] ring-1 ring-[#0E4F43]'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-semibold text-slate-900 block font-mono">{slot.date}</span>
                    <span className="font-mono text-[11px] text-[#0E4F43] font-semibold">{slot.startTime} – {slot.endTime}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setSelectedForReschedule(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!selectedNewSlot}
                onClick={handleConfirmReschedule}
                isLoading={isRescheduling}
              >
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
