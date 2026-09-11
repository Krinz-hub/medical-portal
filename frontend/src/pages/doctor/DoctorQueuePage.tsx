import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  RefreshCw,
  Phone,
  Calendar
} from 'lucide-react';
import { appointmentApi } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { getTodayLocalDate } from '../../utils/dateUtils';

export const DoctorQueuePage: React.FC = () => {
  const [queueData, setQueueData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocalDate());
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await appointmentApi.getDoctorQueue(selectedDate);
      setQueueData(data);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [selectedDate]);

  const handleAction = async (apptId: string, action: 'checkIn' | 'start' | 'complete' | 'noShow') => {
    setActionInProgress(apptId);
    try {
      if (action === 'checkIn') {
        await appointmentApi.checkIn(apptId);
      } else if (action === 'start') {
        await appointmentApi.startConsultation(apptId);
      } else if (action === 'complete') {
        await appointmentApi.completeConsultation(apptId);
      } else if (action === 'noShow') {
        await appointmentApi.markNoShow(apptId);
      }
      await fetchQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operation failed');
    } finally {
      setActionInProgress(null);
    }
  };

  // Find next in line to call
  const nextInLine = queueData?.queue?.find((q: any) =>
    ['CONFIRMED', 'CHECKED_IN'].includes(q.status)
  );

  const currentlyInConsultation = queueData?.queue?.find((q: any) => q.status === 'IN_PROGRESS');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Today's Patient Queue</h1>
          <p className="page-subtitle">
            Operational queue management. Track patient arrival, manage visits, and complete consultations.
          </p>
        </div>

        <div className="page-header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input !w-auto !py-1.5"
          />
          <Button variant="outline" size="sm" onClick={fetchQueue} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Consultation Banner */}
      {currentlyInConsultation && (
        <div className="alert-banner-info flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-lg bg-teal-700 text-white flex items-center justify-center text-lg font-bold shrink-0">
              #{currentlyInConsultation.queueNumber}
            </div>
            <div>
              <span className="badge-clinical badge-sm badge-brand">
                <span className="badge-dot bg-emerald-500"></span>
                Active Consultation
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{currentlyInConsultation.patientName}</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Scheduled: {currentlyInConsultation.startTime} · Reason: {currentlyInConsultation.reason || 'General Consultation'}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            isLoading={actionInProgress === currentlyInConsultation.appointmentId}
            onClick={() => handleAction(currentlyInConsultation.appointmentId, 'complete')}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Mark Consultation Complete
          </Button>
        </div>
      )}

      {/* Queue Table */}
      <div className="section-container">
        <div className="section-header">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Patient Lineup
            </h2>
            <span className="badge-clinical badge-sm badge-neutral">
              {queueData?.queue?.length || 0} Total Patients
            </span>
          </div>

          {nextInLine && !currentlyInConsultation && (
            <Button
              variant="primary"
              size="sm"
              isLoading={actionInProgress === nextInLine.appointmentId}
              onClick={() => handleAction(nextInLine.appointmentId, 'start')}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Call Next: #{nextInLine.queueNumber} ({nextInLine.patientName})
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : !queueData?.queue?.length ? (
          <div className="empty-state-clinical">
            No appointments found for {selectedDate}.
          </div>
        ) : (
          <div className="table-container">
            <table className="table-clinical">
              <thead>
                <tr>
                  <th className="th-clinical">Token #</th>
                  <th className="th-clinical">Patient</th>
                  <th className="th-clinical">Contact</th>
                  <th className="th-clinical">Slot Time</th>
                  <th className="th-clinical">Status</th>
                  <th className="th-clinical text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody>
                {queueData.queue.map((item: any) => {
                  const isPendingAction = actionInProgress === item.appointmentId;
                  const isCurrent = item.status === 'IN_PROGRESS';

                  return (
                    <tr
                      key={item.appointmentId}
                      className={`tr-clinical ${isCurrent ? 'tr-active' : ''}`}
                    >
                      <td className="td-clinical font-bold text-teal-800 text-sm">
                        #{item.queueNumber}
                      </td>

                      <td className="td-clinical">
                        <div className="font-semibold text-slate-900">{item.patientName}</div>
                        <div className="text-[11px] text-slate-500">{item.reason || 'Standard Consultation'}</div>
                      </td>

                      <td className="td-clinical text-slate-600">
                        {item.patientPhone ? (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {item.patientPhone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="td-clinical font-medium text-slate-700">
                        {item.startTime} – {item.endTime}
                      </td>

                      <td className="td-clinical">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* State Machine Transition Actions */}
                      <td className="td-clinical text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {item.status === 'CONFIRMED' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                isLoading={isPendingAction}
                                onClick={() => handleAction(item.appointmentId, 'checkIn')}
                                leftIcon={<UserCheck className="w-3 h-3" />}
                              >
                                Check In
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                isLoading={isPendingAction}
                                onClick={() => handleAction(item.appointmentId, 'start')}
                                leftIcon={<Play className="w-3 h-3" />}
                              >
                                Start
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:bg-rose-50"
                                isLoading={isPendingAction}
                                onClick={() => handleAction(item.appointmentId, 'noShow')}
                              >
                                No Show
                              </Button>
                            </>
                          )}

                          {item.status === 'CHECKED_IN' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                isLoading={isPendingAction}
                                onClick={() => handleAction(item.appointmentId, 'start')}
                                leftIcon={<Play className="w-3 h-3" />}
                              >
                                Start Consultation
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-rose-600 hover:bg-rose-50"
                                isLoading={isPendingAction}
                                onClick={() => handleAction(item.appointmentId, 'noShow')}
                              >
                                No Show
                              </Button>
                            </>
                          )}

                          {item.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              variant="primary"
                              isLoading={isPendingAction}
                              onClick={() => handleAction(item.appointmentId, 'complete')}
                              leftIcon={<CheckCircle2 className="w-3 h-3" />}
                            >
                              Complete
                            </Button>
                          )}

                          {['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(item.status) && (
                            <span className="text-[11px] text-slate-400 italic">No further actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
