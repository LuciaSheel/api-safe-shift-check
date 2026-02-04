/**
 * Shift Routes
 * CRUD operations for shifts
 */

import { Router } from 'express';
import { shiftController } from '../controllers';
import { authenticate, requireManagerOrAdmin, requireWorker } from '../middleware/auth';
import {
  validate,
  createShiftValidation,
  startShiftValidation,
  updateShiftValidation,
  idParamValidation,
  paginationValidation,
} from '../middleware/validation';

const router = Router();

// All shift routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/shifts
 * @desc    Get all shifts with optional filtering
 * @access  Private
 */
router.get(
  '/',
  validate(paginationValidation),
  shiftController.findAll.bind(shiftController)
);

/**
 * @route   GET /api/shifts/active
 * @desc    Get all active shifts
 * @access  Private
 */
router.get('/active', shiftController.getActiveShifts.bind(shiftController));

/**
 * @route   GET /api/shifts/today
 * @desc    Get today's shifts
 * @access  Private
 */
router.get('/today', shiftController.getTodaysShifts.bind(shiftController));

/**
 * @route   GET /api/shifts/:id
 * @desc    Get shift by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(idParamValidation),
  shiftController.findById.bind(shiftController)
);

/**
 * @route   POST /api/shifts
 * @desc    Create a new shift
 * @access  Private (Manager, Admin)
 */
router.post(
  '/',
  requireManagerOrAdmin,
  validate(createShiftValidation),
  shiftController.create.bind(shiftController)
);

/**
 * @route   POST /api/shifts/start
 * @desc    Start a new shift
 * @access  Private (Worker)
 */
router.post(
  '/start',
  requireWorker,
  validate(startShiftValidation),
  shiftController.startShift.bind(shiftController)
);

/**
 * @route   PUT /api/shifts/:id
 * @desc    Update shift
 * @access  Private (Manager, Admin)
 */
router.put(
  '/:id',
  requireManagerOrAdmin,
  validate([...idParamValidation, ...updateShiftValidation]),
  shiftController.update.bind(shiftController)
);

/**
 * @route   DELETE /api/shifts/:id
 * @desc    Delete shift
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id',
  requireManagerOrAdmin,
  validate(idParamValidation),
  shiftController.delete.bind(shiftController)
);

/**
 * @route   POST /api/shifts/:id/end
 * @desc    End a shift
 * @access  Private
 */
router.post(
  '/:id/end',
  validate(idParamValidation),
  shiftController.endShift.bind(shiftController)
);

/**
 * @route   POST /api/shifts/:id/cancel
 * @desc    Cancel a shift
 * @access  Private (Manager, Admin)
 */
router.post(
  '/:id/cancel',
  requireManagerOrAdmin,
  validate(idParamValidation),
  shiftController.cancelShift.bind(shiftController)
);

/**
 * @route   POST /api/shifts/:id/extend
 * @desc    Extend a shift
 * @access  Private
 */
router.post(
  '/:id/extend',
  validate(idParamValidation),
  shiftController.extendShift.bind(shiftController)
);

export default router;
