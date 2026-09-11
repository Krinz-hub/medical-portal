import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle2, Play, Search, RefreshCw, CalendarDays } from 'lucide-react';
import { appointmentApi } from '../../services/api';
import { Appointment } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

import { getTodayLocalDate } from '../../utils/dateUtils';

export const DoctorAppointmentsPage: React.FC = () => {
  const todayStr = getTodayLocalDate();
  const [viewMode, setViewMode] = useState<'all' | 'today' | 'custom'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [queueData, setQueueData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const queryDate = viewMode === 'all' ? 'all' : viewMode === 'today' ? todayStr : selectedDate;
      const data = await appointmentApi.getDoctorQueue(queryDate);
      setQueueData(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [viewMode, selectedDate]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments Schedule</h1>
          <p className="page-subtitle">
            Review booked patient visits across all dates or filter by day.
          </p>
        </div>

        <div className="page-header-actions">
          {/* View Mode Filters */}
          <div className="segmented-control">
            <button
              onClick={() => setViewMode('all')}
              className={viewMode === 'all' ? 'segmented-item segmented-item-active' : 'segmented-item'}
            >
              All Dates
            </button>
            <button
              onClick={() => setViewMode('today')}
              className={viewMode === 'today' ? 'segmented-item segmented-item-active' : 'segmented-item'}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={viewMode === 'custom' ? 'segmented-item segmented-item-active' : 'segmented-item'}
            >
              Pick Date
            </button>
          </div>

          {viewMode === 'custom' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input !w-auto !py-1.5"
            />
          )}

          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Appointments Grid */}
      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : !queueData?.queue?.length ? (
        <div className="empty-state-clinical">
          <CalendarDays className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-slate-800">No appointments found for this filter.</p>
          {viewMode !== 'all' && (
            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={() => setViewMode('all')}>
                Show All Upcoming & Past Appointments
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="section-heading">
              Showing {queueData.queue.length} Patient Visit{queueData.queue.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queueData.queue.map((item: any) => (
              <div
                key={item.appointmentId}
                className="card-clinical p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Token #{item.queueNumber}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">{item.patientName}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {item.patientPhone || 'No phone recorded'}
                    </p>
                  </div>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-800">{item.date || queueData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time Slot:</span>
                    <span className="font-semibold text-slate-800">{item.startTime} – {item.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reason:</span>
                    <span className="font-medium text-slate-700 italic truncate max-w-[200px]">
                      "{item.reason || 'General Consultation'}"
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
