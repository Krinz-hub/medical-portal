import { Router } from 'express';
import { authController, registerPatientSchema, registerDoctorSchema, loginSchema } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/register/patient', validate({ body: registerPatientSchema }), (req, res, next) =>
  authController.registerPatient(req, res, next)
);

router.post('/register/doctor', validate({ body: registerDoctorSchema }), (req, res, next) =>
  authController.registerDoctor(req, res, next)
);

// Backward-compatible generic register route
router.post('/register', (req, res, next) => {
  if (req.body.role === 'DOCTOR') {
    return authController.registerDoctor(req, res, next);
  }
  return authController.registerPatient(req, res, next);
});

router.post('/login', validate({ body: loginSchema }), (req, res, next) =>
  authController.login(req, res, next)
);

router.get('/me', authenticateUser, (req, res, next) =>
  authController.getCurrentUser(req as any, res, next)
);

router.post('/logout', (req, res) => authController.logout(req, res));

export default router;
