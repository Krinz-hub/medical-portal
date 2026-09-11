import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { appointmentService } from '../services/appointmentService';
import { queueService } from '../services/queueService';
import { DoctorProfile } from '../models/DoctorProfile';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
  reason: z.string().optional()
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().optional()
});

export const rescheduleAppointmentSchema = z.object({
  newSlotId: z.string().min(1, 'New Slot ID is required')
});

export class AppointmentController {
  async book(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { doctorId, slotId, reason } = req.body;
      const result = await appointmentService.bookAppointment({
        patientId: req.user!.userId,
        doctorId,
        slotId,
        reason
      });
      sendSuccess(res, result, 'Appointment booked successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentService.getAppointmentById(req.params.id);
      sendSuccess(res, appointment, 'Appointment details fetched');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const appointment = await appointmentService.cancelAppointment(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        reason
      );
      sendSuccess(res, appointment, 'Appointment cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  async reschedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { newSlotId } = req.body;
      const appointment = await appointmentService.rescheduleAppointment(
        req.params.id,
        newSlotId,
        req.user!.userId
      );
      sendSuccess(res, appointment, 'Appointment rescheduled successfully');
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentService.updateStatus(
        req.params.id,
        'CHECKED_IN',
        req.user!.userId
      );
      sendSuccess(res, appointment, 'Patient checked in');
    } catch (error) {
      next(error);
    }
  }

  async startConsultation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentService.updateStatus(
        req.params.id,
        'IN_PROGRESS',
        req.user!.userId
      );
      sendSuccess(res, appointment, 'Consultation started');
    } catch (error) {
      next(error);
    }
  }

  async completeConsultation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentService.updateStatus(
        req.params.id,
        'COMPLETED',
        req.user!.userId
      );
      sendSuccess(res, appointment, 'Consultation completed');
    } catch (error) {
      next(error);
    }
  }

  async markNoShow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentService.updateStatus(
        req.params.id,
        'NO_SHOW',
        req.user!.userId
      );
      sendSuccess(res, appointment, 'Appointment marked as No Show');
    } catch (error) {
      next(error);
    }
  }

  async getDoctorQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const doctor = await DoctorProfile.findOne({ userId: req.user!.userId });
      if (!doctor) {
        throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
      }

      const dateStr = req.query.date as string | undefined;
      const queueData = await queueService.getDoctorQueue(doctor._id.toString(), dateStr);
      sendSuccess(res, queueData, 'Doctor queue fetched');
    } catch (error) {
      next(error);
    }
  }

  async getLiveQueue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const liveQueue = await queueService.getAppointmentLiveQueue(req.params.id);
      sendSuccess(res, liveQueue, 'Live queue status fetched');
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentController = new AppointmentController();
