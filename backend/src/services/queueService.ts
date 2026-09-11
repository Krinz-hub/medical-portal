import mongoose from 'mongoose';
import { formatDoctorName, getTodayLocalDateStr } from '../utils/format';
import { Appointment, IAppointment } from '../models/Appointment';
import { DoctorProfile } from '../models/DoctorProfile';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

export interface QueueItem {
  appointmentId: string;
  queueNumber: number;
  patientName: string;
  patientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
  checkedInAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface LiveQueueStatus {
  appointmentId: string;
  queueNumber: number;
  startTime: string;
  date: string;
  status: string;
  doctorName: string;
  specialization: string;
  doctorStatus: string;
  delayMinutes: number;
  isDoctorDelayed: boolean;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  currentServingQueueNumber: number | null;
  currentServingPatientName: string | null;
  estimatedConsultationTime: string; // e.g. "10:50 AM"
}

export class QueueService {
  /**
   * Get complete queue for a doctor on a specific date (defaults to today)
   */
  async getDoctorQueue(doctorId: string, dateStr?: string) {
    const isAll = dateStr === 'all';
    const targetDate = isAll ? 'all' : (dateStr || getTodayLocalDateStr());

    const doctor = await DoctorProfile.findById(doctorId).populate('userId', 'name');
    if (!doctor) {
      throw new AppError('Doctor not found', 404, 'NOT_FOUND');
    }

    const query: any = { doctorId };
    if (!isAll) {
      query.date = targetDate;
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, startTime: 1, queueNumber: 1 })
      .populate('patientId', 'name phone email')
      .lean();

    const queueItems: QueueItem[] = appointments.map((appt) => ({
      appointmentId: appt._id.toString(),
      queueNumber: appt.queueNumber,
      patientName: (appt.patientId as any)?.name || 'Unknown Patient',
      patientPhone: (appt.patientId as any)?.phone || '',
      date: appt.date,
      startTime: appt.startTime,
      endTime: appt.endTime,
      status: appt.status,
      reason: appt.reason,
      checkedInAt: appt.checkedInAt,
      startedAt: appt.startedAt,
      completedAt: appt.completedAt
    }));

    const currentServing = appointments.find((a) => a.status === 'IN_PROGRESS');
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
    const waitingCount = appointments.filter((a) => ['CHECKED_IN', 'CONFIRMED'].includes(a.status)).length;
    const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
    const noShowCount = appointments.filter((a) => a.status === 'NO_SHOW').length;

    return {
      date: targetDate,
      doctor: {
        id: doctor._id,
        name: formatDoctorName((doctor.userId as any)?.name),
        status: doctor.status,
        delayMinutes: doctor.delayMinutes,
        averageConsultationMinutes: doctor.averageConsultationMinutes
      },
      stats: {
        totalToday: appointments.length,
        completedCount,
        waitingCount,
        cancelledCount,
        noShowCount,
        currentServingQueueNumber: currentServing ? currentServing.queueNumber : null,
        currentServingPatientName: currentServing ? (currentServing.patientId as any)?.name : null
      },
      queue: queueItems
    };
  }

  /**
   * Get real-time queue position and estimated wait time for a patient appointment
   */
  async getAppointmentLiveQueue(appointmentId: string): Promise<LiveQueueStatus> {
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId')
      .populate('patientId', 'name')
      .lean();

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    const doctor = await DoctorProfile.findById(appointment.doctorId).populate('userId', 'name');
    if (!doctor) {
      throw new AppError('Doctor not found', 404, 'NOT_FOUND');
    }

    // Get all appointments for this doctor on this day
    const allDayAppointments = await Appointment.find({
      doctorId: appointment.doctorId,
      date: appointment.date
    })
      .sort({ startTime: 1, queueNumber: 1 })
      .populate('patientId', 'name')
      .lean();

    const currentServing = allDayAppointments.find((a) => a.status === 'IN_PROGRESS');

    // Count patients ahead who are still waiting or in progress before this appointment
    const patientsAhead = allDayAppointments.filter((a) => {
      // Must be before this appointment in queue
      const isBefore = a.queueNumber < appointment.queueNumber;
      // Must not be completed or cancelled or no-show
      const isStillPending = ['IN_PROGRESS', 'CHECKED_IN', 'CONFIRMED'].includes(a.status);
      return isBefore && isStillPending;
    }).length;

    const avgMinutes = doctor.averageConsultationMinutes || 20;
    const delayMinutes = doctor.delayMinutes || 0;
    const estimatedWaitMinutes = Math.max(0, patientsAhead * avgMinutes + delayMinutes);

    // Calculate updated estimated consultation time based on appointment start time + delay
    const [origH, origM] = appointment.startTime.split(':').map(Number);
    const totalOriginalM = origH * 60 + origM;
    const adjustedTotalM = totalOriginalM + delayMinutes;
    const adjH = Math.floor(adjustedTotalM / 60) % 24;
    const adjM = adjustedTotalM % 60;
    const ampm = adjH >= 12 ? 'PM' : 'AM';
    const displayH = adjH % 12 === 0 ? 12 : adjH % 12;
    const estimatedConsultationTime = `${displayH.toString().padStart(2, '0')}:${adjM.toString().padStart(2, '0')} ${ampm}`;

    return {
      appointmentId: appointment._id.toString(),
      queueNumber: appointment.queueNumber,
      startTime: appointment.startTime,
      date: appointment.date,
      status: appointment.status,
      doctorName: formatDoctorName((doctor.userId as any)?.name),
      specialization: doctor.specialization,
      doctorStatus: doctor.status,
      delayMinutes,
      isDoctorDelayed: doctor.status === 'DELAYED' || delayMinutes > 0,
      patientsAhead,
      estimatedWaitMinutes,
      currentServingQueueNumber: currentServing ? currentServing.queueNumber : null,
      currentServingPatientName: currentServing ? (currentServing.patientId as any)?.name : null,
      estimatedConsultationTime
    };
  }
}

export const queueService = new QueueService();
