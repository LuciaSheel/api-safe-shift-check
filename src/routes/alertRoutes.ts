/**
 * Alert Routes
 * CRUD operations for alerts
 */

import { Router } from 'express';
import { alertController } from '../controllers';
import { authenticate, requireManagerOrAdmin } from '../middleware/auth';
import {
  validate,
  createAlertValidation,
  emergencyAlertValidation,
  idParamValidation,
  paginationValidation,
} from '../middleware/validation';

const router = Router();

// All alert routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts with optional filtering
 * @access  Private
 */
router.get(
  '/',
  validate(paginationValidation),
  alertController.findAll.bind(alertController)
);

/**
 * @route   GET /api/alerts/active
 * @desc    Get all active/pending alerts
 * @access  Private
 */
router.get('/active', alertController.getActive.bind(alertController));

/**
 * @route   GET /api/alerts/my-workers
 * @desc    Get alerts for workers assigned to the current backup contact
 * @access  Private
 */
router.get('/my-workers', alertController.getAlertsForMyWorkers.bind(alertController));

/**
 * @route   GET /api/alerts/count
 * @desc    Get count of pending alerts
 * @access  Private
 */
router.get('/count', alertController.countPending.bind(alertController));

/**
 * @route   GET /api/alerts/:id
 * @desc    Get alert by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(idParamValidation),
  alertController.findById.bind(alertController)
);

/**
 * @route   POST /api/alerts
 * @desc    Create a new alert
 * @access  Private (Manager, Admin)
 */
router.post(
  '/',
  requireManagerOrAdmin,
  validate(createAlertValidation),
  alertController.create.bind(alertController)
);

/**
 * @route   POST /api/alerts/emergency
 * @desc    Create an emergency alert
 * @access  Private
 */
router.post(
  '/emergency',
  validate(emergencyAlertValidation),
  alertController.createEmergency.bind(alertController)
);

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete alert
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id',
  requireManagerOrAdmin,
  validate(idParamValidation),
  alertController.delete.bind(alertController)
);

/**
 * @route   POST /api/alerts/:id/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private
 */
router.post(
  '/:id/acknowledge',
  validate(idParamValidation),
  alertController.acknowledge.bind(alertController)
);

/**
 * @route   POST /api/alerts/:id/resolve
 * @desc    Resolve an alert
 * @access  Private
 */
router.post(
  '/:id/resolve',
  validate(idParamValidation),
  alertController.resolve.bind(alertController)
);

export default router;
