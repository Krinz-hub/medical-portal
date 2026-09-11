import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { slotService } from '../services/slotService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const generateSlotsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
});

export const blockSlotSchema = z.object({
  reason: z.enum(['Meeting', 'Personal', 'Emergency', 'Other']).optional().default('Other')
});

export class SlotController {
  async getDoctorSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { doctorId } = req.params;
      const { date, status } = req.query;
      const slots = await slotService.getDoctorSlots(
        doctorId,
        date as string | undefined,
        status as string | undefined
      );
      sendSuccess(res, slots, 'Doctor slots retrieved');
    } catch (error) {
      next(error);
    }
  }

  async generateSlots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.body;
      const result = await slotService.generateSlots(req.user!.userId, startDate, endDate);
      sendSuccess(res, result, `Generated ${result.generatedCount} slots across ${result.datesProcessed} days`, 201);
    } catch (error) {
      next(error);
    }
  }

  async blockSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const blockedSlot = await slotService.blockSlot(req.user!.userId, id, reason);
      sendSuccess(res, blockedSlot, 'Slot blocked successfully');
    } catch (error) {
      next(error);
    }
  }

  async unblockSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const unblockedSlot = await slotService.unblockSlot(req.user!.userId, id);
      sendSuccess(res, unblockedSlot, 'Slot unblocked successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const slotController = new SlotController();
