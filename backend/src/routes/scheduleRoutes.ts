import { Router } from 'express';
import { scheduleController, saveScheduleSchema } from '../controllers/scheduleController';
import { authenticateUser } from '../middleware/auth';
import { requireDoctor } from '../middleware/role';
import { validate } from '../middleware/validate';

const router = Router();

// Doctor schedule operations
router.get('/', authenticateUser, requireDoctor, (req, res, next) =>
  scheduleController.getDoctorSchedule(req as any, res, next)
);

router.post('/', authenticateUser, requireDoctor, validate({ body: saveScheduleSchema }), (req, res, next) =>
  scheduleController.saveSchedule(req as any, res, next)
);

router.delete('/:id', authenticateUser, requireDoctor, (req, res, next) =>
  scheduleController.deleteScheduleDay(req as any, res, next)
);

// Public doctor schedule
router.get('/public/:doctorId', (req, res, next) =>
  scheduleController.getPublicSchedule(req, res, next)
);

export default router;
