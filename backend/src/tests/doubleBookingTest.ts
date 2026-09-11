import { connectDatabase, disconnectDatabase } from '../config/database';
import { appointmentService } from '../services/appointmentService';
import { DoctorProfile } from '../models/DoctorProfile';
import { User } from '../models/User';
import { Slot } from '../models/Slot';
import { Appointment } from '../models/Appointment';
import { seedDatabase } from '../seed/seedData';
import { formatDoctorName } from '../utils/format';

export const runDoubleBookingConcurrencyTest = async () => {
  console.log('\n======================================================');
  console.log('   RUNNING ATOMIC DOUBLE-BOOKING CONCURRENCY TEST    ');
  console.log('   Stress Test: 100 Concurrent Requests -> 1 Slot    ');
  console.log('======================================================\n');

  await connectDatabase();
  await seedDatabase();

  // Pick a doctor and an available slot
  const doctor = await DoctorProfile.findOne().populate('userId');
  if (!doctor) {
    throw new Error('No doctor found for test');
  }

  const patient = await User.findOne({ role: 'PATIENT' });
  if (!patient) {
    throw new Error('No patient found for test');
  }

  // Find an available slot
  const targetSlot = await Slot.findOne({ doctorId: doctor._id, status: 'AVAILABLE' });
  if (!targetSlot) {
    throw new Error('No available slot found for test');
  }

  console.log(`Target Doctor: ${formatDoctorName((doctor.userId as any)?.name)}`);
  console.log(`Target Slot ID: ${targetSlot._id}`);
  console.log(`Target Date: ${targetSlot.date} at ${targetSlot.startTime}`);
  console.log(`Launching 100 concurrent booking attempts...\n`);

  const NUM_CONCURRENT_REQUESTS = 100;
  const promises: Promise<any>[] = [];

  const startTime = Date.now();

  for (let i = 0; i < NUM_CONCURRENT_REQUESTS; i++) {
    promises.push(
      appointmentService.bookAppointment({
        patientId: patient._id.toString(),
        doctorId: doctor._id.toString(),
        slotId: targetSlot._id.toString(),
        reason: `Concurrent Test Stress Request #${i + 1}`
      })
    );
  }

  const results = await Promise.allSettled(promises);
  const elapsedMs = Date.now() - startTime;

  let successCount = 0;
  let rejectedCount = 0;
  const failureReasons: Record<string, number> = {};

  results.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      successCount++;
    } else {
      rejectedCount++;
      const reasonMsg = (res.reason as any)?.message || 'Unknown error';
      failureReasons[reasonMsg] = (failureReasons[reasonMsg] || 0) + 1;
    }
  });

  // Verify final database state
  const finalSlot = await Slot.findById(targetSlot._id);
  const dbAppointmentsCount = await Appointment.countDocuments({ slotId: targetSlot._id });

  console.log('------------------ TEST RESULTS ------------------');
  console.log(`Total Concurrent Requests: ${NUM_CONCURRENT_REQUESTS}`);
  console.log(`Successful Bookings:       ${successCount}`);
  console.log(`Rejected Requests:         ${rejectedCount}`);
  console.log(`Execution Time:            ${elapsedMs}ms`);
  console.log(`Final Slot DB Status:      ${finalSlot?.status}`);
  console.log(`DB Appointments for Slot:  ${dbAppointmentsCount}`);
  console.log('--------------------------------------------------');
  console.log('Rejection Breakdown:');
  Object.entries(failureReasons).forEach(([msg, count]) => {
    console.log(`  - [${count}x]: "${msg}"`);
  });
  console.log('--------------------------------------------------\n');

  let passed = true;

  if (successCount !== 1) {
    console.error(`❌ FAILED: Expected exactly 1 successful booking, but got ${successCount}`);
    passed = false;
  }

  if (rejectedCount !== NUM_CONCURRENT_REQUESTS - 1) {
    console.error(`❌ FAILED: Expected ${NUM_CONCURRENT_REQUESTS - 1} rejections, but got ${rejectedCount}`);
    passed = false;
  }

  if (finalSlot?.status !== 'BOOKED') {
    console.error(`❌ FAILED: Slot status in DB should be BOOKED, got ${finalSlot?.status}`);
    passed = false;
  }

  if (dbAppointmentsCount !== 1) {
    console.error(`❌ FAILED: Exactly 1 appointment should exist in DB, found ${dbAppointmentsCount}`);
    passed = false;
  }

  if (passed) {
    console.log('✅ PASS: Atomic double-booking lock successfully prevented race conditions!');
    console.log('   1 patient booked the slot; 99 were safely rejected with HTTP 409 Conflict.\n');
  }

  await disconnectDatabase();

  if (!passed) {
    process.exit(1);
  }
};

if (require.main === module) {
  runDoubleBookingConcurrencyTest().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
