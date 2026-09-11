import { Schedule, ISchedule } from '../models/Schedule';
import { DoctorProfile } from '../models/DoctorProfile';
import { AppError } from '../middleware/errorHandler';
import { DayOfWeek } from '../types';

export class ScheduleService {
  async getDoctorSchedule(userId: string) {
    const doctor = await DoctorProfile.findOne({ userId });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    return Schedule.find({ doctorId: doctor._id }).sort({ dayOfWeek: 1 });
  }

  async getPublicDoctorSchedule(doctorId: string) {
    return Schedule.find({ doctorId, isActive: true }).sort({ dayOfWeek: 1 });
  }

  async createOrUpdateSchedule(
    userId: string,
    schedules: Array<{
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      breakStart?: string;
      breakEnd?: string;
      slotDuration?: number;
      isActive?: boolean;
    }>
  ) {
    const doctor = await DoctorProfile.findOne({ userId });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    const results = [];
    for (const item of schedules) {
      const updated = await Schedule.findOneAndUpdate(
        { doctorId: doctor._id, dayOfWeek: item.dayOfWeek },
        {
          doctorId: doctor._id,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          breakStart: item.breakStart || '',
          breakEnd: item.breakEnd || '',
          slotDuration: item.slotDuration || 30,
          isActive: item.isActive !== undefined ? item.isActive : true
        },
        { upsert: true, new: true, runValidators: true }
      );
      results.push(updated);
    }

    return results;
  }

  async deleteScheduleDay(userId: string, scheduleId: string) {
    const doctor = await DoctorProfile.findOne({ userId });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    const deleted = await Schedule.findOneAndDelete({ _id: scheduleId, doctorId: doctor._id });
    if (!deleted) {
      throw new AppError('Schedule entry not found', 404, 'NOT_FOUND');
    }
    return { success: true };
  }
}

export const scheduleService = new ScheduleService();
