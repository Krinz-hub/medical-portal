import mongoose, { Document, Schema } from 'mongoose';
import { DoctorStatus } from '../types';

export interface IDoctorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  specialization: string;
  qualification: string;
  registrationNumber: string;
  experience: number;
  clinicName: string;
  clinicAddress: string;
  consultationFee: number;
  bio: string;
  profileImage: string;
  rating: number;
  reviewCount: number;
  status: DoctorStatus;
  delayMinutes: number;
  averageConsultationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const doctorProfileSchema = new Schema<IDoctorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    qualification: {
      type: String,
      required: true,
      trim: true
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },
    clinicName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    clinicAddress: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },
    bio: {
      type: String,
      default: ''
    },
    profileImage: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 24
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'ON_BREAK', 'DELAYED', 'OFFLINE'],
      default: 'AVAILABLE',
      index: true
    },
    delayMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    averageConsultationMinutes: {
      type: Number,
      default: 20,
      min: 5
    }
  },
  {
    timestamps: true
  }
);

doctorProfileSchema.index({ specialization: 1, clinicAddress: 1 });

export const DoctorProfile = mongoose.model<IDoctorProfile>('DoctorProfile', doctorProfileSchema);
