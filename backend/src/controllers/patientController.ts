import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { PatientProfile } from '../models/PatientProfile';
import { appointmentService } from '../services/appointmentService';
import { notificationService } from '../services/notificationService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const updatePatientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodGroup: z.string().optional()
});

export class PatientController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let profile = await PatientProfile.findOne({ userId: req.user!.userId }).populate(
        'userId',
        'name email phone'
      );
      if (!profile) {
        profile = await PatientProfile.create({ userId: req.user!.userId });
      }
      sendSuccess(res, profile, 'Patient profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const profile = await PatientProfile.findOneAndUpdate(
        { userId: req.user!.userId },
        { $set: req.body },
        { new: true, upsert: true }
      ).populate('userId', 'name email phone');
      sendSuccess(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAppointments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tab = req.query.tab as 'upcoming' | 'completed' | 'cancelled' | undefined;
      const appointments = await appointmentService.getPatientAppointments(req.user!.userId, tab);
      sendSuccess(res, appointments, 'Appointments retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user!.userId);
      sendSuccess(res, notifications, 'Notifications retrieved');
    } catch (error) {
      next(error);
    }
  }

  async markNotificationRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(req.params.id, req.user!.userId);
      sendSuccess(res, { read: true }, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();
