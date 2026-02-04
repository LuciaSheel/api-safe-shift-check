/**
 * Location Routes
 * CRUD operations for locations
 */

import { Router } from 'express';
import { locationController } from '../controllers';
import { authenticate, requireManagerOrAdmin, requireAdmin } from '../middleware/auth';
import {
  validate,
  createLocationValidation,
  updateLocationValidation,
  idParamValidation,
  paginationValidation,
} from '../middleware/validation';

const router = Router();

// All location routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/locations
 * @desc    Get all locations with optional filtering
 * @access  Private
 */
router.get(
  '/',
  validate(paginationValidation),
  locationController.findAll.bind(locationController)
);

/**
 * @route   GET /api/locations/active
 * @desc    Get all active locations
 * @access  Private
 */
router.get('/active', locationController.getActiveLocations.bind(locationController));

/**
 * @route   GET /api/locations/nearby
 * @desc    Find locations near coordinates
 * @access  Private
 */
router.get('/nearby', locationController.findNearby.bind(locationController));

/**
 * @route   GET /api/locations/:id
 * @desc    Get location by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(idParamValidation),
  locationController.findById.bind(locationController)
);

/**
 * @route   POST /api/locations
 * @desc    Create a new location
 * @access  Private (Admin)
 */
router.post(
  '/',
  requireAdmin,
  validate(createLocationValidation),
  locationController.create.bind(locationController)
);

/**
 * @route   PUT /api/locations/:id
 * @desc    Update location
 * @access  Private (Manager, Admin)
 */
router.put(
  '/:id',
  requireManagerOrAdmin,
  validate([...idParamValidation, ...updateLocationValidation]),
  locationController.update.bind(locationController)
);

/**
 * @route   DELETE /api/locations/:id
 * @desc    Delete location
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  requireAdmin,
  validate(idParamValidation),
  locationController.delete.bind(locationController)
);

/**
 * @route   POST /api/locations/:id/activate
 * @desc    Activate location
 * @access  Private (Admin)
 */
router.post(
  '/:id/activate',
  requireAdmin,
  validate(idParamValidation),
  locationController.activate.bind(locationController)
);

/**
 * @route   POST /api/locations/:id/deactivate
 * @desc    Deactivate location
 * @access  Private (Admin)
 */
router.post(
  '/:id/deactivate',
  requireAdmin,
  validate(idParamValidation),
  locationController.deactivate.bind(locationController)
);

export default router;
