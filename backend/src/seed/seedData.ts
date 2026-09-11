import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { DoctorProfile } from '../models/DoctorProfile';
import { PatientProfile } from '../models/PatientProfile';
import { Schedule } from '../models/Schedule';
import { Slot } from '../models/Slot';
import { Appointment } from '../models/Appointment';
import { slotService } from '../services/slotService';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { formatDateToYYYYMMDD, getTodayLocalDateStr } from '../utils/format';

export const seedDatabase = async () => {
  console.log('--- Starting Database Seeding ---');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    DoctorProfile.deleteMany({}),
    PatientProfile.deleteMany({}),
    Schedule.deleteMany({}),
    Slot.deleteMany({}),
    Appointment.deleteMany({})
  ]);

  console.log('Cleared existing data.');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 1. Create Doctors
  const doctorsData = [
    {
      name: 'Dr. Ananya Sharma',
      email: 'dr.sharma@healthhub.com',
      phone: '+91 98765 43210',
      registrationNumber: 'MCI-2015-8842',
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD (Cardiology), FACC',
      experience: 12,
      clinicName: 'City Care Hospital',
      clinicAddress: '42 Medical Enclave, Central Avenue, New Delhi',
      consultationFee: 800,
      bio: 'Dr. Ananya Sharma has over 12 years of experience in interventional cardiology and preventive cardiovascular health.',
      rating: 4.9,
      reviewCount: 48,
      status: 'AVAILABLE' as const,
      delayMinutes: 0,
      averageConsultationMinutes: 20
    },
    {
      name: 'Dr. Vikram Seth',
      email: 'dr.vikram@healthhub.com',
      phone: '+91 98111 22334',
      registrationNumber: 'MCI-2018-4921',
      specialization: 'Dermatologist',
      qualification: 'MBBS, DVD, MD (Dermatology)',
      experience: 8,
      clinicName: 'Apex Skin & Laser Clinic',
      clinicAddress: '15 Park Street, Greater Kailash, New Delhi',
      consultationFee: 700,
      bio: 'Specialist in clinical dermatology, acne therapies, pediatric skin conditions, and aesthetic treatments.',
      rating: 4.8,
      reviewCount: 32,
      status: 'AVAILABLE' as const,
      delayMinutes: 0,
      averageConsultationMinutes: 15
    },
    {
      name: 'Dr. Priya Patel',
      email: 'dr.priya@healthhub.com',
      phone: '+91 97222 33445',
      registrationNumber: 'MCI-2016-7731',
      specialization: 'Pediatrician',
      qualification: 'MBBS, DCH, DNB (Pediatrics)',
      experience: 10,
      clinicName: 'Little Wonders Children Hospital',
      clinicAddress: '78 Sector 14, Ring Road, New Delhi',
      consultationFee: 650,
      bio: 'Caring pediatrician dedicated to child nutrition, growth assessment, developmental screening, and immunizations.',
      rating: 4.9,
      reviewCount: 64,
      status: 'AVAILABLE' as const,
      delayMinutes: 0,
      averageConsultationMinutes: 20
    },
    {
      name: 'Dr. Rajesh Verma',
      email: 'dr.rajesh@healthhub.com',
      phone: '+91 96333 44556',
      registrationNumber: 'MCI-2011-3019',
      specialization: 'Neurologist',
      qualification: 'MBBS, MD, DM (Neurology)',
      experience: 15,
      clinicName: 'Metro Brain & Spine Institute',
      clinicAddress: '109 Health Parkway, Vasant Kunj, New Delhi',
      consultationFee: 1000,
      bio: 'Senior Neurologist with extensive expertise in stroke management, epilepsy, headaches, and neuromuscular disorders.',
      rating: 4.7,
      reviewCount: 29,
      status: 'AVAILABLE' as const,
      delayMinutes: 0,
      averageConsultationMinutes: 25
    }
  ];

  const createdDoctors: Array<{ user: any; profile: any }> = [];

  for (const docData of doctorsData) {
    const user = await User.create({
      name: docData.name,
      email: docData.email,
      phone: docData.phone,
      passwordHash,
      role: 'DOCTOR'
    });

    const profile = await DoctorProfile.create({
      userId: user._id,
      registrationNumber: docData.registrationNumber,
      specialization: docData.specialization,
      qualification: docData.qualification,
      experience: docData.experience,
      clinicName: docData.clinicName,
      clinicAddress: docData.clinicAddress,
      consultationFee: docData.consultationFee,
      bio: docData.bio,
      rating: docData.rating,
      reviewCount: docData.reviewCount,
      status: docData.status,
      delayMinutes: docData.delayMinutes,
      averageConsultationMinutes: docData.averageConsultationMinutes
    });

    // Create Schedule for Mon - Fri
    const days: Array<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'> = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY'
    ];

    for (const day of days) {
      await Schedule.create({
        doctorId: profile._id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        breakStart: '13:00',
        breakEnd: '14:00',
        slotDuration: profile.averageConsultationMinutes || 30,
        isActive: true
      });
    }

    createdDoctors.push({ user, profile });
  }

  // 2. Create Patients
  const patientsData = [
    {
      name: 'Rahul Kumar',
      email: 'rahul.patient@gmail.com',
      phone: '+91 99887 76655',
      address: 'B-12 Defence Colony, New Delhi',
      emergencyContact: '+91 99887 76650',
      dateOfBirth: '1992-05-14',
      gender: 'MALE' as const,
      bloodGroup: 'O+'
    },
    {
      name: 'Neha Singh',
      email: 'neha.patient@gmail.com',
      phone: '+91 98776 65544',
      address: 'C-45 Saket, New Delhi',
      emergencyContact: '+91 98776 65540',
      dateOfBirth: '1995-11-20',
      gender: 'FEMALE' as const,
      bloodGroup: 'B+'
    },
    {
      name: 'Amit Verma',
      email: 'amit.patient@gmail.com',
      phone: '+91 97665 54433',
      address: 'Plot 88 Hauz Khas, New Delhi',
      emergencyContact: '+91 97665 54430',
      dateOfBirth: '1988-08-03',
      gender: 'MALE' as const,
      bloodGroup: 'A+'
    }
  ];

  const createdPatients: Array<{ user: any; profile: any }> = [];

  for (const patData of patientsData) {
    const user = await User.create({
      name: patData.name,
      email: patData.email,
      phone: patData.phone,
      passwordHash,
      role: 'PATIENT'
    });

    const profile = await PatientProfile.create({
      userId: user._id,
      address: patData.address,
      emergencyContact: patData.emergencyContact,
      dateOfBirth: patData.dateOfBirth,
      gender: patData.gender,
      bloodGroup: patData.bloodGroup
    });

    createdPatients.push({ user, profile });
  }

  // 3. Generate slots for all doctors for today + next 7 days
  const todayStr = getTodayLocalDateStr();
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeekStr = formatDateToYYYYMMDD(nextWeekDate);

  console.log(`Generating slots from ${todayStr} to ${nextWeekStr}...`);

  for (const { user } of createdDoctors) {
    await slotService.generateSlots(user._id.toString(), todayStr, nextWeekStr);
  }

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log('All doctors initialized with fresh open appointment slots.');
  console.log('\nReady Demo Credentials:');
  console.log('====================================================');
  console.log('DOCTOR:  dr.sharma@healthhub.com  | Password: Password123!');
  console.log('DOCTOR:  dr.vikram@healthhub.com  | Password: Password123!');
  console.log('PATIENT: rahul.patient@gmail.com  | Password: Password123!');
  console.log('PATIENT: neha.patient@gmail.com   | Password: Password123!');
  console.log('====================================================');
};

export const seedInitialDataIfEmpty = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('Database is empty. Populating initial seed data...');
    await seedDatabase();
  }
};

// If run directly from terminal: npm run seed
if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase();
      await disconnectDatabase();
      process.exit(0);
    } catch (err) {
      console.error('Seed execution error:', err);
      process.exit(1);
    }
  })();
}
