import bcrypt from 'bcryptjs';
import { formatDoctorName } from '../utils/format';
import { User, IUser } from '../models/User';
import { PatientProfile } from '../models/PatientProfile';
import { DoctorProfile } from '../models/DoctorProfile';
import { Schedule } from '../models/Schedule';
import { slotService } from './slotService';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { AuthUserPayload } from '../types';

export interface RegisterPatientDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterDoctorDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  registrationNumber: string;
  specialization: string;
  qualification: string;
  clinicName: string;
  clinicAddress?: string;
  consultationFee?: number;
  experience?: number;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export const authService = {
  async registerPatient(dto: RegisterPatientDTO) {
    const existing = await User.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      passwordHash,
      role: 'PATIENT'
    });

    const profile = await PatientProfile.create({
      userId: user._id
    });

    const payload: AuthUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = generateToken(payload);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      profile,
      token
    };
  },

  async registerDoctor(dto: RegisterDoctorDTO) {
    const existing = await User.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    const existingReg = await DoctorProfile.findOne({ registrationNumber: dto.registrationNumber });
    if (existingReg) {
      throw new AppError('A doctor with this medical registration number already exists', 409, 'REG_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await User.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      passwordHash,
      role: 'DOCTOR'
    });

    const profile = await DoctorProfile.create({
      userId: user._id,
      registrationNumber: dto.registrationNumber,
      specialization: dto.specialization,
      qualification: dto.qualification,
      clinicName: dto.clinicName,
      clinicAddress: dto.clinicAddress || 'Main Clinic, Suite 101',
      consultationFee: dto.consultationFee || 500,
      experience: dto.experience || 5,
      bio: `${formatDoctorName(dto.name)} is a dedicated ${dto.specialization} specialist committed to quality patient care.`,
      status: 'AVAILABLE'
    });

    // Create default schedule Mon-Fri 09:00 - 17:00 with lunch break 13:00 - 14:00
    const defaultDays: Array<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'> = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY'
    ];

    for (const day of defaultDays) {
      await Schedule.create({
        doctorId: profile._id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        slotDuration: 30,
        isActive: true
      });
    }

    // Auto-generate initial slots for today + 14 days
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const twoWeeks = new Date(today);
    twoWeeks.setDate(today.getDate() + 14);
    const twoWeeksStr = twoWeeks.toISOString().split('T')[0];

    try {
      await slotService.generateSlots(user._id.toString(), todayStr, twoWeeksStr);
    } catch (e) {
      console.error('Initial slot generation notice:', e);
    }

    const payload: AuthUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = generateToken(payload);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      profile,
      token
    };
  },

  async login(dto: LoginDTO) {
    const user = await User.findOne({ email: dto.email.toLowerCase() });
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    let profile: any = null;
    if (user.role === 'DOCTOR') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    } else {
      profile = await PatientProfile.findOne({ userId: user._id });
    }

    const payload: AuthUserPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = generateToken(payload);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      profile,
      token
    };
  },

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    let profile: any = null;
    if (user.role === 'DOCTOR') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    } else {
      profile = await PatientProfile.findOne({ userId: user._id });
    }

    return {
      user,
      profile
    };
  }
};

export class AuthService {
  registerPatient = authService.registerPatient;
  registerDoctor = authService.registerDoctor;
  login = authService.login;
  getCurrentUser = authService.getCurrentUser;
}
