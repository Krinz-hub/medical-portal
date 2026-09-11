import { Router } from 'express';
import { patientController, updatePatientProfileSchema } from '../controllers/patientController';
import { authenticateUser } from '../middleware/auth';
import { requirePatient } from '../middleware/role';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateUser);
router.use(requirePatient);

router.get('/profile', (req, res, next) => patientController.getProfile(req as any, res, next));

router.patch('/profile', validate({ body: updatePatientProfileSchema }), (req, res, next) =>
  patientController.updateProfile(req as any, res, next)
);

router.get('/appointments', (req, res, next) =>
  patientController.getAppointments(req as any, res, next)
);

router.get('/notifications', (req, res, next) =>
  patientController.getNotifications(req as any, res, next)
);

router.patch('/notifications/:id/read', (req, res, next) =>
  patientController.markNotificationRead(req as any, res, next)
);

export default router;
