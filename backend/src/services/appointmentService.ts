import mongoose from 'mongoose';
import { formatDoctorName } from '../utils/format';
import { Appointment, IAppointment } from '../models/Appointment';
import { Slot } from '../models/Slot';
import { DoctorProfile } from '../models/DoctorProfile';
import { User } from '../models/User';
import { notificationService } from './notificationService';
import { AppError } from '../middleware/errorHandler';
import { AppointmentStatus } from '../types';

export interface BookAppointmentDTO {
  patientId: string;
  doctorId: string;
  slotId: string;
  reason?: string;
}

export class AppointmentService {
  /**
   * Atomically books an appointment with strict double-booking prevention
   */
  async bookAppointment(dto: BookAppointmentDTO) {
    const doctor = await DoctorProfile.findById(dto.doctorId).populate('userId', 'name');
    if (!doctor) {
      throw new AppError('Doctor not found', 404, 'NOT_FOUND');
    }

    const slot = await Slot.findById(dto.slotId);
    if (!slot) {
      throw new AppError('Appointment slot not found', 404, 'NOT_FOUND');
    }

    if (slot.doctorId.toString() !== doctor._id.toString()) {
      throw new AppError('Slot does not belong to the selected doctor', 400, 'INVALID_SLOT');
    }

    if (slot.status !== 'AVAILABLE') {
      throw new AppError(
        'This slot was just booked by another patient. Please select another time.',
        409,
        'SLOT_UNAVAILABLE'
      );
    }

    // Determine queue number for the day
    const existingCount = await Appointment.countDocuments({
      doctorId: doctor._id,
      date: slot.date
    });
    const queueNumber = existingCount + 1;

    // Create provisional appointment
    const newAppointment = new Appointment({
      patientId: new mongoose.Types.ObjectId(dto.patientId),
      doctorId: doctor._id,
      slotId: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'CONFIRMED',
      reason: dto.reason || 'General Consultation',
      queueNumber
    });

    // ATOMIC RESERVATION:
    // Try to atomically claim the slot ONLY if it is still 'AVAILABLE'
    const updatedSlot = await Slot.findOneAndUpdate(
      {
        _id: slot._id,
        status: 'AVAILABLE'
      },
      {
        $set: {
          status: 'BOOKED',
          appointmentId: newAppointment._id
        }
      },
      { new: true }
    );

    if (!updatedSlot) {
      // Another request booked the slot in the race window!
      throw new AppError(
        'This slot was just booked by another patient. Please select another time.',
        409,
        'SLOT_UNAVAILABLE'
      );
    }

    // Save appointment
    await newAppointment.save();

    // Send notification to patient
    await notificationService.sendNotification({
      userId: dto.patientId,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${formatDoctorName((doctor.userId as any)?.name)} is confirmed for ${newAppointment.date} at ${newAppointment.startTime} (Queue #${queueNumber}).`,
      type: 'BOOKING_CONFIRMED',
      metadata: { appointmentId: newAppointment._id }
    });

    return {
      appointment: newAppointment,
      slot: updatedSlot
    };
  }

  /**
   * Cancel appointment and immediately release slot back to AVAILABLE
   */
  async cancelAppointment(appointmentId: string, userId: string, userRole: string, reason?: string) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    // Role check
    if (userRole === 'PATIENT' && appointment.patientId.toString() !== userId) {
      throw new AppError('Unauthorized to cancel this appointment', 403, 'FORBIDDEN');
    }

    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
      throw new AppError(`Cannot cancel an appointment that is already ${appointment.status}`, 400, 'INVALID_STATE');
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason || 'Cancelled by user';
    await appointment.save();

    // Release slot atomically back to AVAILABLE
    await Slot.findByIdAndUpdate(appointment.slotId, {
      $set: {
        status: 'AVAILABLE',
        appointmentId: null
      }
    });

    // Notify patient
    await notificationService.sendNotification({
      userId: appointment.patientId,
      title: 'Appointment Cancelled',
      message: `Your appointment for ${appointment.date} at ${appointment.startTime} has been cancelled.`,
      type: 'APPOINTMENT_CANCELLED',
      metadata: { appointmentId: appointment._id }
    });

    return appointment;
  }

  /**
   * Atomic rescheduling: verify and reserve new slot, release old slot, update appointment
   */
  async rescheduleAppointment(appointmentId: string, newSlotId: string, userId: string) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    if (appointment.patientId.toString() !== userId) {
      throw new AppError('Unauthorized to reschedule this appointment', 403, 'FORBIDDEN');
    }

    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
      throw new AppError(`Cannot reschedule an appointment that is ${appointment.status}`, 400, 'INVALID_STATE');
    }

    const newSlot = await Slot.findById(newSlotId);
    if (!newSlot) {
      throw new AppError('New slot not found', 404, 'NOT_FOUND');
    }

    if (newSlot.status !== 'AVAILABLE') {
      throw new AppError(
        'This slot was just booked by another patient. Please select another time.',
        409,
        'SLOT_UNAVAILABLE'
      );
    }

    // Step 1: Claim new slot atomically
    const reservedNewSlot = await Slot.findOneAndUpdate(
      { _id: newSlotId, status: 'AVAILABLE' },
      { $set: { status: 'BOOKED', appointmentId: appointment._id } },
      { new: true }
    );

    if (!reservedNewSlot) {
      throw new AppError(
        'This slot was just booked by another patient. Please select another time.',
        409,
        'SLOT_UNAVAILABLE'
      );
    }

    // Step 2: Release old slot
    const oldSlotId = appointment.slotId;
    await Slot.findByIdAndUpdate(oldSlotId, {
      $set: {
        status: 'AVAILABLE',
        appointmentId: null
      }
    });

    // Step 3: Recalculate queue number for the new date
    const newQueueNumber =
      (await Appointment.countDocuments({
        doctorId: appointment.doctorId,
        date: reservedNewSlot.date
      })) + 1;

    // Step 4: Update appointment details
    appointment.slotId = reservedNewSlot._id;
    appointment.date = reservedNewSlot.date;
    appointment.startTime = reservedNewSlot.startTime;
    appointment.endTime = reservedNewSlot.endTime;
    appointment.status = 'CONFIRMED';
    appointment.queueNumber = newQueueNumber;
    await appointment.save();

    await notificationService.sendNotification({
      userId: appointment.patientId,
      title: 'Appointment Rescheduled',
      message: `Your appointment has been successfully rescheduled to ${appointment.date} at ${appointment.startTime} (Queue #${newQueueNumber}).`,
      type: 'APPOINTMENT_RESCHEDULED',
      metadata: { appointmentId: appointment._id }
    });

    return appointment;
  }

  /**
   * Strict state machine transitions for doctor queue operations
   */
  async updateStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    userId: string,
    extraData?: { cancellationReason?: string }
  ) {
    const doctor = await DoctorProfile.findOne({ userId });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: doctor._id });
    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    const currentStatus = appointment.status;

    // Validate state machine transitions
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      CONFIRMED: ['CHECKED_IN', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      CHECKED_IN: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
      RESCHEDULED: []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    appointment.status = newStatus;

    if (newStatus === 'CHECKED_IN') {
      appointment.checkedInAt = new Date();
    } else if (newStatus === 'IN_PROGRESS') {
      appointment.startedAt = new Date();
    } else if (newStatus === 'COMPLETED') {
      appointment.completedAt = new Date();
      // Also mark the slot as completed
      await Slot.findByIdAndUpdate(appointment.slotId, { status: 'COMPLETED' });
    } else if (newStatus === 'NO_SHOW') {
      // Slot becomes completed / closed
      await Slot.findByIdAndUpdate(appointment.slotId, { status: 'COMPLETED' });
    } else if (newStatus === 'CANCELLED') {
      appointment.cancelledAt = new Date();
      appointment.cancellationReason = extraData?.cancellationReason || 'Cancelled by doctor';
      // Release slot
      await Slot.findByIdAndUpdate(appointment.slotId, { status: 'AVAILABLE', appointmentId: null });
    }

    await appointment.save();

    // Notify patient
    await notificationService.sendNotification({
      userId: appointment.patientId,
      title: `Appointment Status: ${newStatus.replace('_', ' ')}`,
      message: `Your appointment is now marked as ${newStatus.replace('_', ' ')}.`,
      type: 'STATUS_CHANGED',
      metadata: { appointmentId: appointment._id, status: newStatus }
    });

    return appointment;
  }

  async getPatientAppointments(patientId: string, statusTab?: 'upcoming' | 'completed' | 'cancelled') {
    const query: any = { patientId };

    if (statusTab === 'upcoming') {
      query.status = { $in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] };
    } else if (statusTab === 'completed') {
      query.status = 'COMPLETED';
    } else if (statusTab === 'cancelled') {
      query.status = { $in: ['CANCELLED', 'NO_SHOW'] };
    }

    return Appointment.find(query)
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('slotId')
      .sort({ date: -1, startTime: -1 });
  }

  async getAppointmentById(appointmentId: string) {
    const appt = await Appointment.findById(appointmentId)
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('patientId', 'name email phone')
      .populate('slotId');

    if (!appt) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    return appt;
  }
}

export const appointmentService = new AppointmentService();
