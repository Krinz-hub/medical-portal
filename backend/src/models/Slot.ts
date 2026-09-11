import mongoose, { Document, Schema } from 'mongoose';
import { SlotStatus } from '../types';

export interface ISlot extends Document {
  doctorId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: SlotStatus;
  appointmentId?: mongoose.Types.ObjectId;
  blockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const slotSchema = new Schema<ISlot>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true, // "YYYY-MM-DD"
      index: true
    },
    startTime: {
      type: String,
      required: true // "09:00"
    },
    endTime: {
      type: String,
      required: true // "09:30"
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED', 'COMPLETED'],
      default: 'AVAILABLE',
      index: true
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    blockReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

slotSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });
slotSchema.index({ doctorId: 1, date: 1, status: 1 });

export const Slot = mongoose.model<ISlot>('Slot', slotSchema);
