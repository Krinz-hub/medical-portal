import { Router } from 'express';
import {
  appointmentController,
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema
} from '../controllers/appointmentController';
import { authenticateUser } from '../middleware/auth';
import { requireDoctor, requirePatient } from '../middleware/role';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateUser);

// Booking
router.post('/', requirePatient, validate({ body: bookAppointmentSchema }), (req, res, next) =>
  appointmentController.book(req as any, res, next)
);

// Single appointment detail
router.get('/:id', (req, res, next) => appointmentController.getById(req as any, res, next));

// Patient live queue position
router.get('/:id/live-queue', (req, res, next) =>
  appointmentController.getLiveQueue(req as any, res, next)
);

// Cancellation
router.patch(
  '/:id/cancel',
  validate({ body: cancelAppointmentSchema }),
  (req, res, next) => appointmentController.cancel(req as any, res, next)
);

// Rescheduling
router.patch(
  '/:id/reschedule',
  requirePatient,
  validate({ body: rescheduleAppointmentSchema }),
  (req, res, next) => appointmentController.reschedule(req as any, res, next)
);

// Doctor Queue & State Lifecycle Operations
router.patch('/:id/check-in', requireDoctor, (req, res, next) =>
  appointmentController.checkIn(req as any, res, next)
);

router.patch('/:id/start', requireDoctor, (req, res, next) =>
  appointmentController.startConsultation(req as any, res, next)
);

router.patch('/:id/complete', requireDoctor, (req, res, next) =>
  appointmentController.completeConsultation(req as any, res, next)
);

router.patch('/:id/no-show', requireDoctor, (req, res, next) =>
  appointmentController.markNoShow(req as any, res, next)
);

export default router;
