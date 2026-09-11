import mongoose, { Document, Schema } from 'mongoose';
import { AppointmentStatus } from '../types';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  slotId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  reason: string;
  queueNumber: number;
  checkedInAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  rescheduledToAppointmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
      index: true
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: 'Slot',
      required: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
      default: 'CONFIRMED',
      index: true
    },
    reason: {
      type: String,
      default: 'General Consultation'
    },
    queueNumber: {
      type: Number,
      required: true
    },
    checkedInAt: {
      type: Date
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    rescheduledToAppointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.index({ doctorId: 1, date: 1, queueNumber: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
