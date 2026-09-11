import mongoose from 'mongoose';
import { formatDoctorName, getTodayLocalDateStr } from '../utils/format';
import { DoctorProfile, IDoctorProfile } from '../models/DoctorProfile';
import { User } from '../models/User';
import { Slot } from '../models/Slot';
import { Appointment } from '../models/Appointment';
import { notificationService } from './notificationService';
import { AppError } from '../middleware/errorHandler';
import { DoctorStatus } from '../types';

export interface DoctorFilterQuery {
  specialization?: string;
  location?: string;
  maxFee?: number;
  minRating?: number;
  availableToday?: boolean;
  search?: string;
  minExperience?: number;
}

export class DoctorService {
  async listDoctors(filters: DoctorFilterQuery) {
    const query: any = {};

    if (filters.specialization) {
      query.specialization = { $regex: filters.specialization, $options: 'i' };
    }

    if (filters.location) {
      query.clinicAddress = { $regex: filters.location, $options: 'i' };
    }

    if (filters.maxFee) {
      query.consultationFee = { $lte: Number(filters.maxFee) };
    }

    if (filters.minRating) {
      query.rating = { $gte: Number(filters.minRating) };
    }

    if (filters.minExperience) {
      query.experience = { $gte: Number(filters.minExperience) };
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      // Find matching user IDs
      const matchingUsers = await User.find({
        name: searchRegex,
        role: 'DOCTOR'
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      query.$or = [
        { specialization: searchRegex },
        { clinicName: searchRegex },
        { clinicAddress: searchRegex },
        { userId: { $in: userIds } }
      ];
    }

    const doctors = await DoctorProfile.find(query)
      .populate('userId', 'name email phone')
      .lean();

    const todayStr = getTodayLocalDateStr();

    // Enhance each doctor with next available slot
    const enrichedDoctors = await Promise.all(
      doctors.map(async (doc) => {
        const nextSlot = await Slot.findOne({
          doctorId: doc._id,
          date: { $gte: todayStr },
          status: 'AVAILABLE'
        }).sort({ date: 1, startTime: 1 });

        return {
          ...doc,
          nextAvailableSlot: nextSlot ? { date: nextSlot.date, startTime: nextSlot.startTime } : null
        };
      })
    );

    if (filters.availableToday) {
      return enrichedDoctors.filter(
        (doc) => doc.nextAvailableSlot && doc.nextAvailableSlot.date === todayStr
      );
    }

    return enrichedDoctors;
  }

  async getDoctorById(doctorId: string) {
    const doctor = await DoctorProfile.findById(doctorId).populate('userId', 'name email phone');
    if (!doctor) {
      throw new AppError('Doctor not found', 404, 'NOT_FOUND');
    }

    const todayStr = getTodayLocalDateStr();
    const upcomingAvailableSlotsCount = await Slot.countDocuments({
      doctorId: doctor._id,
      date: { $gte: todayStr },
      status: 'AVAILABLE'
    });

    return {
      ...doctor.toObject(),
      upcomingAvailableSlotsCount
    };
  }

  async updateDoctorProfile(userId: string, updateData: Partial<IDoctorProfile>) {
    const doctor = await DoctorProfile.findOne({ userId });
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    const allowedFields = [
      'specialization',
      'qualification',
      'clinicName',
      'clinicAddress',
      'consultationFee',
      'bio',
      'profileImage',
      'experience',
      'averageConsultationMinutes'
    ];

    allowedFields.forEach((field) => {
      if ((updateData as any)[field] !== undefined) {
        (doctor as any)[field] = (updateData as any)[field];
      }
    });

    await doctor.save();
    return doctor;
  }

  async updateDoctorStatus(userId: string, status: DoctorStatus, delayMinutes: number = 0) {
    const doctor = await DoctorProfile.findOne({ userId }).populate('userId', 'name');
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    }

    doctor.status = status;
    doctor.delayMinutes = status === 'DELAYED' ? delayMinutes : 0;
    await doctor.save();

    // If doctor is delayed or changed status, notify today's upcoming confirmed patients
    const todayStr = getTodayLocalDateStr();
    const todayAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: todayStr,
      status: { $in: ['CONFIRMED', 'CHECKED_IN'] }
    });

    for (const appt of todayAppointments) {
      if (status === 'DELAYED') {
        await notificationService.sendNotification({
          userId: appt.patientId,
          title: `${formatDoctorName((doctor.userId as any)?.name)} is delayed`,
          message: `Your doctor is currently running approximately ${delayMinutes} minutes behind schedule.`,
          type: 'DOCTOR_DELAYED',
          metadata: { doctorId: doctor._id, delayMinutes }
        });
      } else {
        await notificationService.sendNotification({
          userId: appt.patientId,
          title: `Doctor Status: ${status}`,
          message: `${formatDoctorName((doctor.userId as any)?.name)} status updated to ${status}.`,
          type: 'STATUS_CHANGED',
          metadata: { doctorId: doctor._id, status }
        });
      }
    }

    return doctor;
  }
}

export const doctorService = new DoctorService();
