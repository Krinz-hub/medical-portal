import mongoose from 'mongoose';
import { Slot, ISlot } from '../models/Slot';
import { Schedule } from '../models/Schedule';
import { DoctorProfile } from '../models/DoctorProfile';
import { AppError } from '../middleware/errorHandler';
import { DayOfWeek } from '../types';
import { formatDateToYYYYMMDD, getTodayLocalDateStr } from '../utils/format';

const DAYS_MAP: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export class SlotService {
  /**
   * Automatically generate slots for a doctor across a date range
   */
  async generateSlots(
    userId: string,
    startDateStr: string,
    endDateStr: string
  ): Promise<{ generatedCount: number; datesProcessed: number }> {
    const doctor = await DoctorProfile.findOne({ userId });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    const schedules = await Schedule.find({ doctorId: doctor._id, isActive: true });
    if (!schedules.length) {
      throw new AppError('No active schedule found for doctor. Please set working hours first.', 400, 'NO_SCHEDULE');
    }

    const scheduleByDay = new Map<string, (typeof schedules)[0]>();
    schedules.forEach((s) => scheduleByDay.set(s.dayOfWeek, s));

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD', 400, 'INVALID_DATE');
    }

    let generatedCount = 0;
    let datesProcessed = 0;
    const curr = new Date(startDate);

    while (curr <= endDate) {
      const dateString = curr.toISOString().split('T')[0];
      const dayName = DAYS_MAP[curr.getDay()];
      const daySchedule = scheduleByDay.get(dayName);

      if (daySchedule) {
        const startM = timeToMinutes(daySchedule.startTime);
        const endM = timeToMinutes(daySchedule.endTime);
        const duration = daySchedule.slotDuration || 30;

        const hasBreak = daySchedule.breakStart && daySchedule.breakEnd;
        const breakStartM = hasBreak ? timeToMinutes(daySchedule.breakStart!) : -1;
        const breakEndM = hasBreak ? timeToMinutes(daySchedule.breakEnd!) : -1;

        for (let m = startM; m + duration <= endM; m += duration) {
          const slotStart = m;
          const slotEnd = m + duration;

          // Skip if slot overlaps break interval
          if (hasBreak && slotStart < breakEndM && slotEnd > breakStartM) {
            continue;
          }

          const slotStartTimeStr = minutesToTime(slotStart);
          const slotEndTimeStr = minutesToTime(slotEnd);

          // Check if slot already exists
          const exists = await Slot.findOne({
            doctorId: doctor._id,
            date: dateString,
            startTime: slotStartTimeStr
          });

          if (!exists) {
            await Slot.create({
              doctorId: doctor._id,
              date: dateString,
              startTime: slotStartTimeStr,
              endTime: slotEndTimeStr,
              status: 'AVAILABLE'
            });
            generatedCount++;
          }
        }
      }

      curr.setDate(curr.getDate() + 1);
      datesProcessed++;
    }

    return { generatedCount, datesProcessed };
  }

  /**
   * Get slots for a doctor on a specific date or date range
   */
  async getDoctorSlots(doctorId: string, date?: string, status?: string) {
    const existingCount = await Slot.countDocuments({ doctorId });
    if (existingCount === 0) {
      const doctor = await DoctorProfile.findById(doctorId);
      if (doctor) {
        const todayStr = getTodayLocalDateStr();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);
        const futureStr = formatDateToYYYYMMDD(futureDate);

        // Ensure schedule exists
        const schedCount = await Schedule.countDocuments({ doctorId });
        if (schedCount === 0) {
          const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
          for (const d of days) {
            await Schedule.create({
              doctorId: doctor._id,
              dayOfWeek: d,
              startTime: '09:00',
              endTime: '17:00',
              breakStart: '13:00',
              breakEnd: '14:00',
              slotDuration: doctor.averageConsultationMinutes || 30,
              isActive: true
            });
          }
        }

        try {
          await this.generateSlots(doctor.userId.toString(), todayStr, futureStr);
        } catch (e) {
          console.error('Auto slot generation fallback notice:', e);
        }
      }
    }

    const query: any = { doctorId };
    if (date) {
      query.date = date;
    } else {
      const todayStr = getTodayLocalDateStr();
      query.date = { $gte: todayStr };
    }
    if (status) {
      query.status = status;
    }

    return Slot.find(query).sort({ date: 1, startTime: 1 }).populate('appointmentId');
  }

  /**
   * Block a specific slot
   */
  async blockSlot(userId: string, slotId: string, reason: string = 'Other') {
    const doctor = await DoctorProfile.findOne({ userId });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    const slot = await Slot.findOne({ _id: slotId, doctorId: doctor._id });
    if (!slot) {
      throw new AppError('Slot not found', 404, 'NOT_FOUND');
    }

    if (slot.status === 'BOOKED') {
      throw new AppError('Cannot block a slot that has already been booked by a patient', 400, 'SLOT_ALREADY_BOOKED');
    }

    slot.status = 'BLOCKED';
    slot.blockReason = reason;
    await slot.save();

    return slot;
  }

  /**
   * Unblock a previously blocked slot
   */
  async unblockSlot(userId: string, slotId: string) {
    const doctor = await DoctorProfile.findOne({ userId });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    const slot = await Slot.findOne({ _id: slotId, doctorId: doctor._id });
    if (!slot) {
      throw new AppError('Slot not found', 404, 'NOT_FOUND');
    }

    if (slot.status !== 'BLOCKED') {
      throw new AppError('Slot is not currently blocked', 400, 'SLOT_NOT_BLOCKED');
    }

    slot.status = 'AVAILABLE';
    slot.blockReason = '';
    await slot.save();

    return slot;
  }
}

export const slotService = new SlotService();
