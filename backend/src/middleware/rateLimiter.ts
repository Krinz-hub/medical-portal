import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isTest = env.NODE_ENV === 'test';

/**
 * Rate limiter for Authentication endpoints (login, registration)
 * Stricter threshold to prevent brute-force attacks and credential stuffing
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 25, // 25 attempts per 15 mins in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMITED'
  }
});

/**
 * Rate limiter for Appointment booking & rescheduling
 * Prevents automated bot spam and slot-hoarding attacks
 */
export const bookingRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isTest ? 10000 : 30, // 30 booking/reschedule requests per 10 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Appointment booking rate limit exceeded. Please wait a few moments before trying again.',
    code: 'BOOKING_RATE_LIMITED'
  }
});

/**
 * Rate limiter for Doctor Slot generation
 * Protects database from expensive date-range batch slot creation abuse
 */
export const slotGenerationRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isTest ? 10000 : 15, // 15 generation requests per 10 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Slot generation rate limit reached. Please wait before generating additional slots.',
    code: 'GENERATION_RATE_LIMITED'
  }
});

/**
 * General API Rate Limiter
 * Baseline protection for all public/private routes
 */
export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 20000 : 600, // 600 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests received, please slow down and try again later.',
    code: 'RATE_LIMITED'
  }
});
