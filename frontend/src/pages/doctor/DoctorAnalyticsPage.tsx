import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, XCircle, Users, Clock, CalendarDays } from 'lucide-react';
import { doctorApi } from '../../services/api';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export const DoctorAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    doctorApi
      .getAnalytics()
      .then(setAnalytics)
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  const today = analytics?.today || {};
  const overall = analytics?.overall || {};
  const hasOverallData = overall.total && overall.total > 0;
  const completionRateDisplay = hasOverallData ? `${overall.completionRate}%` : '0%';

  return (
    <div className="page-container">
      <div className="page-header items-start">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="page-title">Practice Performance & Analytics</h1>
            <p className="page-subtitle">
              Key performance indicators, attendance completion rates, and patient volume trends.
            </p>
          </div>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="space-y-3">
        <h2 className="section-heading px-1">
          Today's Patient Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Total Today"
            value={today.total || 0}
            colorScheme="brand"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Completed"
            value={today.completed || 0}
            colorScheme="emerald"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            title="Waiting in Queue"
            value={today.waiting || 0}
            colorScheme="amber"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            title="Cancelled"
            value={today.cancelled || 0}
            colorScheme="rose"
            icon={<XCircle className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Overall Lifetime Stats */}
      <div className="space-y-3">
        <h2 className="section-heading px-1">
          All-Time Performance Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-clinical p-5 space-y-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Consultations</span>
            <p className="text-3xl font-bold text-slate-900">{overall.total || 0}</p>
            <p className="text-xs text-slate-500">Recorded patient visits on platform</p>
          </div>

          <div className="card-clinical p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-emerald-700">Completion Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-3xl font-bold text-emerald-700">{completionRateDisplay}</p>
            <p className="text-xs text-slate-500">
              {hasOverallData
                ? `${overall.completed || 0} of ${overall.total} visits completed`
                : 'No consultations recorded yet'}
            </p>
          </div>

          <div className="card-clinical p-5 space-y-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Average Duration</span>
            <p className="text-3xl font-bold text-teal-800">{overall.averageConsultationMinutes || 20}m</p>
            <p className="text-xs text-slate-500">Standard consultation buffer per patient</p>
          </div>
        </div>
      </div>

      {!hasOverallData && (
        <div className="empty-state-clinical">
          <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">Practice data is live and synchronized.</p>
          <p className="max-w-md mx-auto text-slate-500">
            As you check in and complete real patient appointments from your Live Queue, accurate attendance and turnaround metrics will automatically populate here.
          </p>
        </div>
      )}
    </div>
  );
};
