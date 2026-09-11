import mongoose, { Document, Schema } from 'mongoose';
import { DayOfWeek } from '../types';

export interface ISchedule extends Document {
  doctorId: mongoose.Types.ObjectId;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  slotDuration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
      index: true
    },
    dayOfWeek: {
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      required: true
    },
    startTime: {
      type: String,
      required: true // e.g. "09:00"
    },
    endTime: {
      type: String,
      required: true // e.g. "17:00"
    },
    breakStart: {
      type: String,
      default: '' // e.g. "13:00"
    },
    breakEnd: {
      type: String,
      default: '' // e.g. "14:00"
    },
    slotDuration: {
      type: Number,
      default: 30, // minutes
      min: 10,
      max: 120
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

scheduleSchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

export const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);
