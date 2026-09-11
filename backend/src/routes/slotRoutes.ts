import { Router } from 'express';
import { slotController, generateSlotsSchema, blockSlotSchema } from '../controllers/slotController';
import { authenticateUser } from '../middleware/auth';
import { requireDoctor } from '../middleware/role';
import { validate } from '../middleware/validate';

const router = Router();

// Public doctor slots retrieval
router.get('/doctors/:doctorId/slots', (req, res, next) =>
  slotController.getDoctorSlots(req, res, next)
);

// Doctor slot management
router.post(
  '/doctor/slots/generate',
  authenticateUser,
  requireDoctor,
  validate({ body: generateSlotsSchema }),
  (req, res, next) => slotController.generateSlots(req as any, res, next)
);

router.patch(
  '/doctor/slots/:id/block',
  authenticateUser,
  requireDoctor,
  validate({ body: blockSlotSchema }),
  (req, res, next) => slotController.blockSlot(req as any, res, next)
);

router.patch(
  '/doctor/slots/:id/unblock',
  authenticateUser,
  requireDoctor,
  (req, res, next) => slotController.unblockSlot(req as any, res, next)
);

export default router;
