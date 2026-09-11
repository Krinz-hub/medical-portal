import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { doctorService } from '../services/doctorService';
import { DoctorProfile } from '../models/DoctorProfile';
import { Appointment } from '../models/Appointment';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { getTodayLocalDateStr } from '../utils/format';

export const updateDoctorStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'BUSY', 'ON_BREAK', 'DELAYED', 'OFFLINE']),
  delayMinutes: z.number().min(0).max(300).optional().default(0)
});

export const updateDoctorProfileSchema = z.object({
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  consultationFee: z.number().min(0).optional(),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  experience: z.number().min(0).optional(),
  averageConsultationMinutes: z.number().min(5).max(120).optional()
});

export class DoctorController {
  async listDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        specialization: req.query.specialization as string,
        location: req.query.location as string,
        maxFee: req.query.maxFee ? Number(req.query.maxFee) : undefined,
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
        minExperience: req.query.minExperience ? Number(req.query.minExperience) : undefined,
        availableToday: req.query.availableToday === 'true',
        search: req.query.search as string
      };

      const doctors = await doctorService.listDoctors(filters);
      sendSuccess(res, doctors, 'Doctors list retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getDoctorById(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);
      sendSuccess(res, doctor, 'Doctor profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await doctorService.updateDoctorProfile(req.user!.userId, req.body);
      sendSuccess(res, updated, 'Doctor profile updated');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, delayMinutes } = req.body;
      const updated = await doctorService.updateDoctorStatus(req.user!.userId, status, delayMinutes);
      sendSuccess(res, updated, `Doctor status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorProfile.findOne({ userId: req.user!.userId });
      if (!doctor) {
        return sendSuccess(res, {}, 'No doctor profile');
      }

      const todayStr = getTodayLocalDateStr();

      // Today's stats
      const todayAppointments = await Appointment.find({
        doctorId: doctor._id,
        date: todayStr
      });

      const todayTotal = todayAppointments.length;
      const todayCompleted = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
      const todayWaiting = todayAppointments.filter((a) => ['CHECKED_IN', 'CONFIRMED'].includes(a.status)).length;
      const todayCancelled = todayAppointments.filter((a) => a.status === 'CANCELLED').length;
      const todayNoShow = todayAppointments.filter((a) => a.status === 'NO_SHOW').length;

      // Overall stats
      const allAppointments = await Appointment.find({ doctorId: doctor._id });
      const totalAll = allAppointments.length;
      const totalCompleted = allAppointments.filter((a) => a.status === 'COMPLETED').length;
      const totalCancelled = allAppointments.filter((a) => a.status === 'CANCELLED').length;
      const totalNoShow = allAppointments.filter((a) => a.status === 'NO_SHOW').length;

      const completionRate = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 100;
      const cancellationRate = totalAll > 0 ? Math.round((totalCancelled / totalAll) * 100) : 0;

      sendSuccess(
        res,
        {
          today: {
            total: todayTotal,
            completed: todayCompleted,
            waiting: todayWaiting,
            cancelled: todayCancelled,
            noShow: todayNoShow
          },
          overall: {
            total: totalAll,
            completed: totalCompleted,
            cancelled: totalCancelled,
            noShow: totalNoShow,
            completionRate,
            cancellationRate,
            averageConsultationMinutes: doctor.averageConsultationMinutes
          }
        },
        'Doctor analytics retrieved'
      );
    } catch (error) {
      next(error);
    }
  }
}

export const doctorController = new DoctorController();
