import React, { useState, useEffect } from 'react';
import { Clock, Calendar, ShieldAlert, CheckCircle2, Lock, Unlock, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { scheduleApi, slotApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DoctorProfile, DayOfWeek, Slot } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { getTodayLocalDate, formatDateToYYYYMMDD } from '../../utils/dateUtils';

const ALL_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
];

export const DoctorSchedulePage: React.FC = () => {
  const { profile } = useAuth();
  const doctor = profile as DoctorProfile | null;

  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Slot generation
  const todayStr = getTodayLocalDate();
  const nextWeekStr = formatDateToYYYYMMDD(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [genStartDate, setGenStartDate] = useState(todayStr);
  const [genEndDate, setGenEndDate] = useState(nextWeekStr);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Slot inspection & blocking
  const [inspectDate, setInspectDate] = useState(todayStr);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Block slot modal
  const [selectedSlotForBlock, setSelectedSlotForBlock] = useState<Slot | null>(null);
  const [blockReason, setBlockReason] = useState<'Meeting' | 'Personal' | 'Emergency' | 'Other'>('Personal');
  const [isBlocking, setIsBlocking] = useState(false);

  const loadSchedule = async () => {
    setIsLoadingSchedule(true);
    try {
      const data = await scheduleApi.getDoctorSchedule();
      const map = new Map<string, any>();
      data.forEach((s: any) => map.set(s.dayOfWeek, s));

      // Ensure all 7 days exist in local state
      const initialized = ALL_DAYS.map((day) => {
        return (
          map.get(day) || {
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            breakStart: '13:00',
            breakEnd: '14:00',
            slotDuration: doctor?.averageConsultationMinutes || 30,
            isActive: day !== 'SUNDAY'
          }
        );
      });

      setSchedules(initialized);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const loadSlots = async () => {
    if (!doctor) return;
    setIsLoadingSlots(true);
    try {
      const data = await slotApi.getDoctorSlots(doctor._id, inspectDate);
      setSlots(data);
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    if (doctor) {
      loadSlots();
    }
  }, [inspectDate, doctor]);

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    setSaveSuccess(false);
    try {
      await scheduleApi.saveSchedule(schedules);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save schedule:', err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleGenerateSlots = async () => {
    setIsGenerating(true);
    setGenerationNotice(null);
    try {
      const res = await slotApi.generateSlots(genStartDate, genEndDate);
      setGenerationNotice(`Successfully generated ${res.generatedCount} slots across ${res.datesProcessed} days!`);
      loadSlots();
    } catch (err: any) {
      setGenerationNotice(`Error: ${err.response?.data?.message || 'Slot generation failed'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!selectedSlotForBlock) return;
    setIsBlocking(true);
    try {
      await slotApi.blockSlot(selectedSlotForBlock._id, blockReason);
      setSelectedSlotForBlock(null);
      loadSlots();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to block slot');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async (slotId: string) => {
    try {
      await slotApi.unblockSlot(slotId);
      loadSlots();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unblock slot');
    }
  };

  const updateDaySchedule = (index: number, field: string, value: any) => {
    setSchedules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Working Schedule & Slot Generator</h1>
          <p className="page-subtitle">
            Configure weekly clinic hours, generate dynamic bookable slots, and block specific hours.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSaveSchedule}
          isLoading={isSavingSchedule}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Save Working Hours
        </Button>
      </div>

      {saveSuccess && (
        <div className="alert-banner-success">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Working hours saved successfully!</span>
        </div>
      )}

      {/* 1. Weekly Schedule Table */}
      <div className="section-container">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-700" />
          <span>Weekly Recurring Working Hours</span>
        </h2>

        {isLoadingSchedule ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <div className="table-container">
            <table className="table-clinical">
              <thead>
                <tr>
                  <th className="th-clinical">Day</th>
                  <th className="th-clinical">Active</th>
                  <th className="th-clinical">Start Time</th>
                  <th className="th-clinical">End Time</th>
                  <th className="th-clinical">Break Start</th>
                  <th className="th-clinical">Break End</th>
                  <th className="th-clinical">Slot (Mins)</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((daySched, idx) => (
                  <tr key={daySched.dayOfWeek} className={`tr-clinical ${daySched.isActive ? '' : 'opacity-50 bg-slate-50/50'}`}>
                    <td className="td-clinical font-semibold text-slate-900">{daySched.dayOfWeek}</td>
                    <td className="td-clinical">
                      <input
                        type="checkbox"
                        checked={daySched.isActive}
                        onChange={(e) => updateDaySchedule(idx, 'isActive', e.target.checked)}
                        className="form-checkbox"
                      />
                    </td>
                    <td className="td-clinical">
                      <input
                        type="time"
                        disabled={!daySched.isActive}
                        value={daySched.startTime}
                        onChange={(e) => updateDaySchedule(idx, 'startTime', e.target.value)}
                        className="form-input !w-auto !py-1"
                      />
                    </td>
                    <td className="td-clinical">
                      <input
                        type="time"
                        disabled={!daySched.isActive}
                        value={daySched.endTime}
                        onChange={(e) => updateDaySchedule(idx, 'endTime', e.target.value)}
                        className="form-input !w-auto !py-1"
                      />
                    </td>
                    <td className="td-clinical">
                      <input
                        type="time"
                        disabled={!daySched.isActive}
                        value={daySched.breakStart || ''}
                        onChange={(e) => updateDaySchedule(idx, 'breakStart', e.target.value)}
                        className="form-input !w-auto !py-1"
                      />
                    </td>
                    <td className="td-clinical">
                      <input
                        type="time"
                        disabled={!daySched.isActive}
                        value={daySched.breakEnd || ''}
                        onChange={(e) => updateDaySchedule(idx, 'breakEnd', e.target.value)}
                        className="form-input !w-auto !py-1"
                      />
                    </td>
                    <td className="td-clinical">
                      <select
                        disabled={!daySched.isActive}
                        value={daySched.slotDuration || 30}
                        onChange={(e) => updateDaySchedule(idx, 'slotDuration', Number(e.target.value))}
                        className="form-select !w-auto !py-1"
                      >
                        <option value="15">15 min</option>
                        <option value="20">20 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Automated Slot Generator Tool */}
      <div className="section-container">
        <div>
          <h2 className="font-heading text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0E4F43]" />
            <span>Generate Appointment Slots</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generates individual bookable slots from your weekly working hours schedule, respecting breaks and existing bookings.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-end gap-3">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={genStartDate}
              onChange={(e) => setGenStartDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={genEndDate}
              onChange={(e) => setGenEndDate(e.target.value)}
              className="form-input"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleGenerateSlots}
            isLoading={isGenerating}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Generate Slots
          </Button>
        </div>

        {generationNotice && (
          <div className="alert-banner-info">
            {generationNotice}
          </div>
        )}
      </div>

      {/* 3. Slot Inspection & Blocking Tool */}
      <div className="section-container">
        <div className="section-header flex-col sm:flex-row sm:items-center gap-2">
          <div>
            <h2 className="font-heading text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0E4F43]" />
              <span>Inspect & Block Specific Slots</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Block individual slots for meetings, personal leave, or emergencies. Blocked slots instantly vanish from patient search.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={inspectDate}
              onChange={(e) => setInspectDate(e.target.value)}
              className="form-input !w-auto !py-1.5"
            />
            <Button variant="outline" size="sm" onClick={loadSlots} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
          </div>
        </div>

        {isLoadingSlots ? (
          <LoadingSkeleton rows={2} />
        ) : slots.length === 0 ? (
          <div className="empty-state-clinical">
            No slots found for {inspectDate}. Generate slots using the tool above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isAvailable = slot.status === 'AVAILABLE';
              const isBlocked = slot.status === 'BLOCKED';
              const isBooked = slot.status === 'BOOKED';

              return (
                <div
                  key={slot._id}
                  className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${
                    isBlocked
                      ? 'bg-slate-100 border-slate-300 opacity-80'
                      : isBooked
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      {slot.startTime} – {slot.endTime}
                    </span>
                    <StatusBadge status={slot.status} size="sm" />
                  </div>

                  {isBlocked && (
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Reason: {slot.blockReason || 'Personal'}
                    </p>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                    {isAvailable && (
                      <button
                        type="button"
                        onClick={() => setSelectedSlotForBlock(slot)}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        Block Slot
                      </button>
                    )}
                    {isBlocked && (
                      <button
                        type="button"
                        onClick={() => handleUnblock(slot._id)}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <Unlock className="w-3 h-3" />
                        Unblock
                      </button>
                    )}
                    {isBooked && (
                      <span className="text-[10px] text-slate-400 italic">Booked by patient</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block Slot Modal */}
      {selectedSlotForBlock && (
        <Modal
          isOpen={!!selectedSlotForBlock}
          onClose={() => setSelectedSlotForBlock(null)}
          title="Block Appointment Slot"
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600">
              Block slot at <strong>{selectedSlotForBlock.startTime}</strong> on{' '}
              <strong>{selectedSlotForBlock.date}</strong> from patient booking.
            </p>

            <div className="form-group">
              <label className="form-label">Reason for Blocking</label>
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value as any)}
                className="form-select"
              >
                <option value="Meeting">Meeting</option>
                <option value="Personal">Personal</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setSelectedSlotForBlock(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleConfirmBlock}
                isLoading={isBlocking}
              >
                Confirm Block
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
