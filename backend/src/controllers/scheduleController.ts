import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scheduleService } from '../services/scheduleService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const saveScheduleSchema = z.object({
  schedules: z.array(
    z.object({
      dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
      breakStart: z.string().optional(),
      breakEnd: z.string().optional(),
      slotDuration: z.number().min(10).max(120).optional().default(30),
      isActive: z.boolean().optional().default(true)
    })
  )
});

export class ScheduleController {
  async getDoctorSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schedule = await scheduleService.getDoctorSchedule(req.user!.userId);
      sendSuccess(res, schedule, 'Doctor schedule retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getPublicSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await scheduleService.getPublicDoctorSchedule(req.params.doctorId);
      sendSuccess(res, schedule, 'Public doctor schedule retrieved');
    } catch (error) {
      next(error);
    }
  }

  async saveSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await scheduleService.createOrUpdateSchedule(req.user!.userId, req.body.schedules);
      sendSuccess(res, updated, 'Schedule saved successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteScheduleDay(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await scheduleService.deleteScheduleDay(req.user!.userId, req.params.id);
      sendSuccess(res, result, 'Schedule day deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const scheduleController = new ScheduleController();
