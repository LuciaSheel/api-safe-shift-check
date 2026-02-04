/**
 * Check-In Routes
 * CRUD operations for check-ins
 */

import { Router } from 'express';
import { checkInController } from '../controllers';
import { authenticate, requireManagerOrAdmin } from '../middleware/auth';
import {
  validate,
  createCheckInValidation,
  idParamValidation,
  paginationValidation,
} from '../middleware/validation';

const router = Router();

// All check-in routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/check-ins
 * @desc    Get all check-ins with optional filtering
 * @access  Private
 */
router.get(
  '/',
  validate(paginationValidation),
  checkInController.findAll.bind(checkInController)
);

/**
 * @route   GET /api/check-ins/pending
 * @desc    Get pending check-ins
 * @access  Private
 */
router.get('/pending', checkInController.getPending.bind(checkInController));

/**
 * @route   GET /api/check-ins/:id
 * @desc    Get check-in by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(idParamValidation),
  checkInController.findById.bind(checkInController)
);

/**
 * @route   POST /api/check-ins
 * @desc    Create a new check-in
 * @access  Private (Manager, Admin)
 */
router.post(
  '/',
  requireManagerOrAdmin,
  validate(createCheckInValidation),
  checkInController.create.bind(checkInController)
);

/**
 * @route   POST /api/check-ins/schedule
 * @desc    Schedule check-in for a shift
 * @access  Private
 */
router.post('/schedule', checkInController.scheduleCheckIn.bind(checkInController));

/**
 * @route   DELETE /api/check-ins/:id
 * @desc    Delete check-in
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id',
  requireManagerOrAdmin,
  validate(idParamValidation),
  checkInController.delete.bind(checkInController)
);

/**
 * @route   POST /api/check-ins/:id/confirm
 * @desc    Confirm a check-in
 * @access  Private
 */
router.post(
  '/:id/confirm',
  validate(idParamValidation),
  checkInController.confirm.bind(checkInController)
);

/**
 * @route   POST /api/check-ins/:id/missed
 * @desc    Mark check-in as missed
 * @access  Private
 */
router.post(
  '/:id/missed',
  validate(idParamValidation),
  checkInController.markAsMissed.bind(checkInController)
);

/**
 * @route   POST /api/check-ins/process-overdue
 * @desc    Process all overdue check-ins
 * @access  Private (Manager, Admin)
 */
router.post(
  '/process-overdue',
  requireManagerOrAdmin,
  checkInController.processOverdue.bind(checkInController)
);

export default router;
