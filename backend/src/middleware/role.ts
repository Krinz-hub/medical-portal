import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';

export const requirePatient = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== 'PATIENT') {
    return next(
      new AppError('Access denied. Patient privileges required.', 403, 'FORBIDDEN_ROLE')
    );
  }

  next();
};

export const requireDoctor = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== 'DOCTOR') {
    return next(
      new AppError('Access denied. Doctor privileges required.', 403, 'FORBIDDEN_ROLE')
    );
  }

  next();
};
