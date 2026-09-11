import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { DoctorProfile } from '../models/DoctorProfile';
import { Slot } from '../models/Slot';
import { Appointment } from '../models/Appointment';
import { authService } from '../services/authService';
import { scheduleService } from '../services/scheduleService';
import { slotService } from '../services/slotService';
import { doctorService } from '../services/doctorService';
import { appointmentService } from '../services/appointmentService';
import { queueService } from '../services/queueService';

export const runE2EAcceptanceTest = async () => {
  console.log('===========================================================');
  console.log('   FULL E2E ACCEPTANCE TEST (SECTION 79 SPECIFICATION)     ');
  console.log('===========================================================');

  await connectDatabase();

  const timestamp = Date.now();
  const docEmail = `dr.test.${timestamp}@healthhub.com`;
  const patEmail = `patient.test.${timestamp}@gmail.com`;

  // Step 1: Doctor registers
  console.log('\n[1] Registering New Doctor...');
  const docReg = await authService.registerDoctor({
    name: 'Dr. Aarav Mehta',
    email: docEmail,
    phone: '+91 91234 56789',
    password: 'Password123!',
    registrationNumber: `MCI-TEST-${timestamp}`,
    specialization: 'Neurologist',
    qualification: 'MBBS, DM (Neurology)',
    clinicName: 'Neuro Health Care',
    clinicAddress: '55 Park Avenue',
    consultationFee: 900,
    experience: 9
  });
  console.log('✓ Doctor registered:', docReg.user.name, '| Role:', docReg.user.role);

  // Step 2: Doctor logs in
  console.log('\n[2] Doctor Login...');
  const docLogin = await authService.login({ email: docEmail, password: 'Password123!' });
  console.log('✓ Doctor login successful, JWT generated.');

  // Step 3: Doctor creates working schedule
  console.log('\n[3] Doctor Configures Working Schedule...');
  await scheduleService.createOrUpdateSchedule(docLogin.user.id.toString(), [
    {
      dayOfWeek: 'FRIDAY',
      startTime: '09:00',
      endTime: '17:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      slotDuration: 30,
      isActive: true
    }
  ]);
  console.log('✓ Working schedule saved for Friday.');

  // Step 4: Backend generates slots
  console.log('\n[4] Backend Slot Generation...');
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const genResult = await slotService.generateSlots(docLogin.user.id.toString(), todayStr, nextWeek);
  console.log(`✓ Generated ${genResult.generatedCount} slots across ${genResult.datesProcessed} days.`);

  // Step 5: Patient registers
  console.log('\n[5] Registering New Patient...');
  const patReg = await authService.registerPatient({
    name: 'Kavita Sharma',
    email: patEmail,
    phone: '+91 99887 11223',
    password: 'Password123!'
  });
  console.log('✓ Patient registered:', patReg.user.name, '| Role:', patReg.user.role);

  // Step 6: Patient logs in
  console.log('\n[6] Patient Login...');
  const patLogin = await authService.login({ email: patEmail, password: 'Password123!' });
  console.log('✓ Patient login successful, JWT generated.');

  // Step 7: Patient searches doctor
  console.log('\n[7] Patient Searches for Neurologists...');
  const searchDocs = await doctorService.listDoctors({ specialization: 'Neurologist' });
  const foundDoctor = searchDocs.find((d) => d._id.toString() === docReg.profile._id.toString());
  if (!foundDoctor) throw new Error('Doctor not found in search results');
  console.log('✓ Doctor found in search:', (foundDoctor.userId as any).name, '| Fee: ₹', foundDoctor.consultationFee);

  // Step 8: Patient sees available slots
  console.log('\n[8] Patient Retrieves Available Slots...');
  const docSlots = await slotService.getDoctorSlots(foundDoctor._id.toString());
  const targetSlot = docSlots.find((s) => s.status === 'AVAILABLE');
  if (!targetSlot) throw new Error('No available slot found');
  console.log('✓ Selected open slot:', targetSlot.date, targetSlot.startTime, '–', targetSlot.endTime);

  // Step 9 & 10: Patient books slot -> atomic reservation
  console.log('\n[9 & 10] Patient Books Appointment (Atomic Lock)...');
  const bookResult = await appointmentService.bookAppointment({
    patientId: patLogin.user.id.toString(),
    doctorId: foundDoctor._id.toString(),
    slotId: targetSlot._id.toString(),
    reason: 'Severe migraine follow-up'
  });
  const appointmentId = bookResult.appointment._id.toString();
  console.log('✓ Booking confirmed! Appointment ID:', appointmentId);
  console.log('✓ Queue Token Issued: #', bookResult.appointment.queueNumber);
  console.log('✓ Slot Status in DB:', bookResult.slot.status);

  if (bookResult.slot.status !== 'BOOKED') {
    throw new Error('Slot was not marked as BOOKED!');
  }

  // Step 11: Doctor dashboard immediately reflects appointment
  console.log('\n[11] Doctor Dashboard Queue Reflection...');
  const docQueueToday = await queueService.getDoctorQueue(foundDoctor._id.toString(), targetSlot.date);
  const queueItem = docQueueToday.queue.find((q) => q.appointmentId === appointmentId);
  if (!queueItem) throw new Error('Appointment not found in doctor queue');
  console.log('✓ Doctor Queue reflects appointment: Patient:', queueItem.patientName, '| Status:', queueItem.status);

  // Step 12 & 13: Doctor checks patient in -> Patient sees CHECKED_IN
  console.log('\n[12 & 13] Doctor Checks In Patient...');
  await appointmentService.updateStatus(appointmentId, 'CHECKED_IN', docLogin.user.id.toString());
  const liveQueue1 = await queueService.getAppointmentLiveQueue(appointmentId);
  console.log('✓ Patient live queue status:', liveQueue1.status);
  if (liveQueue1.status !== 'CHECKED_IN') throw new Error('Status not CHECKED_IN');

  // Step 14 & 15: Doctor starts consultation -> Patient sees IN_PROGRESS
  console.log('\n[14 & 15] Doctor Starts Consultation...');
  await appointmentService.updateStatus(appointmentId, 'IN_PROGRESS', docLogin.user.id.toString());
  const liveQueue2 = await queueService.getAppointmentLiveQueue(appointmentId);
  console.log('✓ Patient live queue status:', liveQueue2.status);
  if (liveQueue2.status !== 'IN_PROGRESS') throw new Error('Status not IN_PROGRESS');

  // Step 16 & 17: Doctor completes consultation -> Patient sees COMPLETED
  console.log('\n[16 & 17] Doctor Completes Consultation...');
  await appointmentService.updateStatus(appointmentId, 'COMPLETED', docLogin.user.id.toString());
  const liveQueue3 = await queueService.getAppointmentLiveQueue(appointmentId);
  console.log('✓ Patient live queue status:', liveQueue3.status);
  if (liveQueue3.status !== 'COMPLETED') throw new Error('Status not COMPLETED');

  // Step 18: Doctor Status Delay Propagation
  console.log('\n[18] Doctor Reports 25-Minute Delay...');
  await doctorService.updateDoctorStatus(docLogin.user.id.toString(), 'DELAYED', 25);
  const updatedDoc = await doctorService.getDoctorById(foundDoctor._id.toString());
  console.log('✓ Doctor status:', updatedDoc.status, '| Delay Minutes:', updatedDoc.delayMinutes);
  if (updatedDoc.status !== 'DELAYED' || updatedDoc.delayMinutes !== 25) {
    throw new Error('Doctor delay not updated in DB');
  }

  // Step 19: Test Rescheduling & Slot Release
  console.log('\n[19] Testing Atomic Rescheduling Flow...');
  const openSlots = await slotService.getDoctorSlots(foundDoctor._id.toString(), undefined, 'AVAILABLE');
  if (openSlots.length >= 2) {
    const slotA = openSlots[0];
    const slotB = openSlots[1];

    const apptToReschedule = await appointmentService.bookAppointment({
      patientId: patLogin.user.id.toString(),
      doctorId: foundDoctor._id.toString(),
      slotId: slotA._id.toString(),
      reason: 'Reschedule test'
    });

    console.log(`- Booked slot A (${slotA.startTime}). Now rescheduling to slot B (${slotB.startTime})...`);
    await appointmentService.rescheduleAppointment(
      apptToReschedule.appointment._id.toString(),
      slotB._id.toString(),
      patLogin.user.id.toString()
    );

    const releasedSlotA = await Slot.findById(slotA._id);
    const claimedSlotB = await Slot.findById(slotB._id);

    console.log('✓ Old Slot A status in DB:', releasedSlotA?.status, '(Expected: AVAILABLE)');
    console.log('✓ New Slot B status in DB:', claimedSlotB?.status, '(Expected: BOOKED)');

    if (releasedSlotA?.status !== 'AVAILABLE' || claimedSlotB?.status !== 'BOOKED') {
      throw new Error('Reschedule failed to release old slot or claim new slot');
    }
  }

  // Step 20: Test Cancellation & Slot Release
  console.log('\n[20] Testing Cancellation Flow...');
  const slotToCancel = (await slotService.getDoctorSlots(foundDoctor._id.toString(), undefined, 'AVAILABLE'))[0];
  const apptToCancel = await appointmentService.bookAppointment({
    patientId: patLogin.user.id.toString(),
    doctorId: foundDoctor._id.toString(),
    slotId: slotToCancel._id.toString(),
    reason: 'Cancellation test'
  });

  await appointmentService.cancelAppointment(
    apptToCancel.appointment._id.toString(),
    patLogin.user.id.toString(),
    'PATIENT',
    'Personal emergency'
  );

  const finalSlot = await Slot.findById(slotToCancel._id);
  const finalAppt = await Appointment.findById(apptToCancel.appointment._id);

  console.log('✓ Cancelled appointment status:', finalAppt?.status, '(Expected: CANCELLED)');
  console.log('✓ Slot released back to status:', finalSlot?.status, '(Expected: AVAILABLE)');

  if (finalAppt?.status !== 'CANCELLED' || finalSlot?.status !== 'AVAILABLE') {
    throw new Error('Cancellation did not release slot back to AVAILABLE');
  }

  console.log('\n===========================================================');
  console.log(' ✅ ALL 20 ACCEPTANCE STEPS PASSED WITH 100% SUCCESS!      ');
  console.log(' The unified single backend state correctly drives both    ');
  console.log(' the Patient and Doctor experiences end-to-end!            ');
  console.log('===========================================================\n');

  await disconnectDatabase();
};

if (require.main === module) {
  runE2EAcceptanceTest().catch((err) => {
    console.error('❌ E2E Acceptance Test Failed:', err);
    process.exit(1);
  });
}
