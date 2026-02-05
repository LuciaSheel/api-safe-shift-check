/**
 * Validation Middleware
 * Request validation using express-validator
 */

import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Validate request and return errors if any
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    res.status(400).json({
      Success: false,
      Message: 'Validation failed',
      Errors: errors.array().map(err => {
        if ('path' in err) {
          return `${err.path}: ${err.msg}`;
        }
        return err.msg;
      }),
    });
  };
}

// ============================================
// AUTH VALIDATIONS
// ============================================

export const loginValidation = [
  body('Email').isEmail().withMessage('Valid email is required'),
  body('Password').notEmpty().withMessage('Password is required'),
];

export const registerValidation = [
  body('Email').isEmail().withMessage('Valid email is required'),
  body('Password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('FirstName').notEmpty().withMessage('First name is required'),
  body('LastName').notEmpty().withMessage('Last name is required'),
  body('Phone').notEmpty().withMessage('Phone number is required'),
  body('Role')
    .optional()
    .isIn(['Cleaner', 'Booker', 'Director', 'BackupContact', 'Administrator'])
    .withMessage('Invalid role'),
];

export const changePasswordValidation = [
  body('CurrentPassword').notEmpty().withMessage('Current password is required'),
  body('NewPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// ============================================
// USER VALIDATIONS
// ============================================

export const createUserValidation = [
  body('Email').isEmail().withMessage('Valid email is required'),
  body('Password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('FirstName').notEmpty().withMessage('First name is required'),
  body('LastName').notEmpty().withMessage('Last name is required'),
  body('Role')
    .isIn(['Cleaner', 'Booker', 'Director', 'BackupContact', 'Administrator'])
    .withMessage('Invalid role'),
  body('Phone').notEmpty().withMessage('Phone number is required'),
];

export const updateUserValidation = [
  body('Email').optional().isEmail().withMessage('Valid email is required'),
  body('FirstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('LastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('Phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('IsActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
];

// ============================================
// LOCATION VALIDATIONS
// ============================================

export const createLocationValidation = [
  body('Name').notEmpty().withMessage('Name is required'),
  body('Address').notEmpty().withMessage('Address is required'),
  body('Latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('Longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

export const updateLocationValidation = [
  body('Name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('Address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('Latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('Longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('IsActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
];

// ============================================
// SHIFT VALIDATIONS
// ============================================

export const createShiftValidation = [
  body('WorkerId').notEmpty().withMessage('Worker ID is required'),
  body('LocationId').notEmpty().withMessage('Location ID is required'),
  body('EstimatedEndTime').isISO8601().withMessage('Valid estimated end time is required'),
  body('CheckInIntervalMinutes')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Check-in interval must be between 1 and 120 minutes'),
];

export const startShiftValidation = [
  body('WorkerId').notEmpty().withMessage('Worker ID is required'),
  body('LocationId').notEmpty().withMessage('Location ID is required'),
  body('EstimatedHours')
    .isFloat({ min: 0.5, max: 24 })
    .withMessage('Estimated hours must be between 0.5 and 24'),
];

export const updateShiftValidation = [
  body('Status')
    .optional()
    .isIn(['Active', 'Completed', 'Cancelled'])
    .withMessage('Invalid status'),
  body('CheckInIntervalMinutes')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Check-in interval must be between 1 and 120 minutes'),
];

// ============================================
// CHECK-IN VALIDATIONS
// ============================================

export const createCheckInValidation = [
  body('ShiftId').notEmpty().withMessage('Shift ID is required'),
  body('WorkerId').notEmpty().withMessage('Worker ID is required'),
  body('ScheduledTime').isISO8601().withMessage('Valid scheduled time is required'),
];

// ============================================
// ALERT VALIDATIONS
// ============================================

export const createAlertValidation = [
  body('ShiftId').notEmpty().withMessage('Shift ID is required'),
  body('WorkerId').notEmpty().withMessage('Worker ID is required'),
  body('Type')
    .isIn(['MissedCheckIn', 'Emergency', 'SystemAlert'])
    .withMessage('Invalid alert type'),
  body('Severity')
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid severity'),
  body('Message').notEmpty().withMessage('Message is required'),
];

export const emergencyAlertValidation = [
  body('WorkerId').notEmpty().withMessage('Worker ID is required'),
  body('ShiftId').notEmpty().withMessage('Shift ID is required'),
];

// ============================================
// NOTIFICATION VALIDATIONS
// ============================================

export const createNotificationValidation = [
  body('UserId').notEmpty().withMessage('User ID is required'),
  body('Type')
    .isIn(['Alert', 'CheckIn', 'System', 'Shift'])
    .withMessage('Invalid notification type'),
  body('Title').notEmpty().withMessage('Title is required'),
  body('Message').notEmpty().withMessage('Message is required'),
];

export const bulkNotificationValidation = [
  body('UserIds').isArray({ min: 1 }).withMessage('At least one user ID is required'),
  body('Type')
    .isIn(['Alert', 'CheckIn', 'System', 'Shift'])
    .withMessage('Invalid notification type'),
  body('Title').notEmpty().withMessage('Title is required'),
  body('Message').notEmpty().withMessage('Message is required'),
];

// ============================================
// TEAM VALIDATIONS
// ============================================

export const createTeamValidation = [
  body('Name').notEmpty().withMessage('Team name is required'),
  body('ManagerId').notEmpty().withMessage('Manager ID is required'),
  body('MemberIds').optional().isArray().withMessage('Member IDs must be an array'),
];

export const updateTeamValidation = [
  body('Name').optional().notEmpty().withMessage('Team name cannot be empty'),
  body('ManagerId').optional().notEmpty().withMessage('Manager ID cannot be empty'),
  body('MemberIds').optional().isArray().withMessage('Member IDs must be an array'),
];

// ============================================
// SYSTEM SETTINGS VALIDATIONS
// ============================================

export const updateSystemSettingsValidation = [
  body('CheckInIntervalMinutes')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Check-in interval must be between 1 and 120 minutes'),
  body('ResponseTimeoutSeconds')
    .optional()
    .isInt({ min: 30, max: 600 })
    .withMessage('Response timeout must be between 30 and 600 seconds'),
  body('EscalationDelayMinutes')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Escalation delay must be between 1 and 60 minutes'),
  body('EnableSmsNotifications')
    .optional()
    .isBoolean()
    .withMessage('EnableSmsNotifications must be a boolean'),
  body('EnableEmailNotifications')
    .optional()
    .isBoolean()
    .withMessage('EnableEmailNotifications must be a boolean'),
  body('EnablePushNotifications')
    .optional()
    .isBoolean()
    .withMessage('EnablePushNotifications must be a boolean'),
];

// ============================================
// COMMON VALIDATIONS
// ============================================

export const idParamValidation = [
  param('id').notEmpty().withMessage('ID is required'),
];

export const paginationValidation = [
  query('Page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('PageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('PageSize must be between 1 and 100'),
];
