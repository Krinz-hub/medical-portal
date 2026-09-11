import { Router } from 'express';
import {
  doctorController,
  updateDoctorProfileSchema,
  updateDoctorStatusSchema
} from '../controllers/doctorController';
import { appointmentController } from '../controllers/appointmentController';
import { authenticateUser } from '../middleware/auth';
import { requireDoctor } from '../middleware/role';
import { validate } from '../middleware/validate';

const router = Router();

// ==========================================
// Doctor Protected Operational Routes
// Mounted at /api/doctor
// ==========================================

// Queue & Appointments for logged-in Doctor
router.get('/queue', authenticateUser, requireDoctor, (req, res, next) =>
  appointmentController.getDoctorQueue(req as any, res, next)
);

router.get('/appointments', authenticateUser, requireDoctor, (req, res, next) =>
  appointmentController.getDoctorQueue(req as any, res, next)
);

router.get('/appointments/today', authenticateUser, requireDoctor, (req, res, next) =>
  appointmentController.getDoctorQueue(req as any, res, next)
);

router.patch(
  '/profile',
  authenticateUser,
  requireDoctor,
  validate({ body: updateDoctorProfileSchema }),
  (req, res, next) => doctorController.updateProfile(req as any, res, next)
);

router.patch(
  '/status',
  authenticateUser,
  requireDoctor,
  validate({ body: updateDoctorStatusSchema }),
  (req, res, next) => doctorController.updateStatus(req as any, res, next)
);

router.get('/analytics/overview', authenticateUser, requireDoctor, (req, res, next) =>
  doctorController.getAnalytics(req as any, res, next)
);

router.get('/analytics', authenticateUser, requireDoctor, (req, res, next) =>
  doctorController.getAnalytics(req as any, res, next)
);

// ==========================================
// Public Doctor Discovery Routes
// Mounted at /api/doctors
// ==========================================
router.get('/', (req, res, next) => doctorController.listDoctors(req, res, next));

// Match 24-character hexadecimal ObjectId only to avoid colliding with named endpoints
router.get('/:id([0-9a-fA-F]{24})', (req, res, next) => doctorController.getDoctorById(req, res, next));

export default router;
