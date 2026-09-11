export type UserRole = 'PATIENT' | 'DOCTOR';

export type DoctorStatus = 'AVAILABLE' | 'BUSY' | 'ON_BREAK' | 'DELAYED' | 'OFFLINE';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type SlotStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED' | 'COMPLETED';

export type AppointmentStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

export interface DoctorProfile {
  _id: string;
  userId: User | string;
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
  nextAvailableSlot?: {
    date: string;
    startTime: string;
  } | null;
  upcomingAvailableSlotsCount?: number;
}

export interface PatientProfile {
  _id: string;
  userId: User | string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
}

export interface Slot {
  _id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: SlotStatus;
  appointmentId?: string | null;
  blockReason?: string;
}

export interface Appointment {
  _id: string;
  patientId: User | string;
  doctorId: DoctorProfile | string;
  slotId: Slot | string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  queueNumber: number;
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface LiveQueueStatus {
  appointmentId: string;
  queueNumber: number;
  startTime: string;
  date: string;
  status: string;
  doctorName: string;
  specialization: string;
  doctorStatus: DoctorStatus;
  delayMinutes: number;
  isDoctorDelayed: boolean;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  currentServingQueueNumber: number | null;
  currentServingPatientName: string | null;
  estimatedConsultationTime: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
