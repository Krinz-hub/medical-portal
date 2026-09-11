import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  authRateLimiter,
  bookingRateLimiter,
  slotGenerationRateLimiter,
  generalApiRateLimiter
} from './middleware/rateLimiter';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import doctorRoutes from './routes/doctorRoutes';
import patientRoutes from './routes/patientRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import slotRoutes from './routes/slotRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import { appointmentController } from './controllers/appointmentController';
import { authenticateUser } from './middleware/auth';
import { requireDoctor } from './middleware/role';

export const createApp = (): Express => {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Specialized rate limiters
  app.use('/api/', generalApiRateLimiter);
  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
  app.use('/api/appointments', bookingRateLimiter);
  app.use('/api/doctor/slots/generate', slotGenerationRateLimiter);

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Doctor Appointment Visibility Platform'
    });
  });

  // API Route Mounts
  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/doctor', doctorRoutes); // Shared router mounts for /profile, /status, /analytics
  app.use('/api/doctor/schedule', scheduleRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api/patient', patientRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/slots', slotRoutes);
  app.use('/api', slotRoutes); // Handles /api/doctors/:doctorId/slots and /api/doctor/slots/*
  app.use('/api/appointments', appointmentRoutes);

  // Direct Doctor Queue mount
  app.get('/api/doctor/queue', authenticateUser, requireDoctor, (req, res, next) =>
    appointmentController.getDoctorQueue(req as any, res, next)
  );

  // 404 handler for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND'
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
};
