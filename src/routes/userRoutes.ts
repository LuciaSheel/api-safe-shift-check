/**
 * User Routes
 * CRUD operations for users
 */

import { Router } from 'express';
import { userController } from '../controllers';
import { authenticate, requireManagerOrAdmin, requireAdmin } from '../middleware/auth';
import {
  validate,
  createUserValidation,
  updateUserValidation,
  idParamValidation,
  paginationValidation,
} from '../middleware/validation';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users with optional filtering
 * @access  Private (Manager, Admin)
 */
router.get(
  '/',
  requireManagerOrAdmin,
  validate(paginationValidation),
  userController.findAll.bind(userController)
);

/**
 * @route   GET /api/users/workers
 * @desc    Get all workers
 * @access  Private (Manager, Admin)
 */
router.get('/workers', requireManagerOrAdmin, userController.getWorkers.bind(userController));

/**
 * @route   GET /api/users/backup-contacts
 * @desc    Get all backup contacts
 * @access  Private (Manager, Admin)
 */
router.get(
  '/backup-contacts',
  requireManagerOrAdmin,
  userController.getBackupContacts.bind(userController)
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(idParamValidation),
  userController.findById.bind(userController)
);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (Admin)
 */
router.post(
  '/',
  requireAdmin,
  validate(createUserValidation),
  userController.create.bind(userController)
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin or self)
 */
router.put(
  '/:id',
  validate([...idParamValidation, ...updateUserValidation]),
  userController.update.bind(userController)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  requireAdmin,
  validate(idParamValidation),
  userController.delete.bind(userController)
);

/**
 * @route   POST /api/users/:id/activate
 * @desc    Activate user
 * @access  Private (Admin)
 */
router.post(
  '/:id/activate',
  requireAdmin,
  validate(idParamValidation),
  userController.activate.bind(userController)
);

/**
 * @route   POST /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (Admin)
 */
router.post(
  '/:id/deactivate',
  requireAdmin,
  validate(idParamValidation),
  userController.deactivate.bind(userController)
);

/**
 * @route   POST /api/users/:id/backup-contact
 * @desc    Assign backup contact to worker
 * @access  Private (Manager, Admin)
 */
router.post(
  '/:id/backup-contact',
  requireManagerOrAdmin,
  validate(idParamValidation),
  userController.assignBackupContact.bind(userController)
);

/**
 * @route   DELETE /api/users/:id/backup-contact/:backupContactId
 * @desc    Remove backup contact from worker
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id/backup-contact/:backupContactId',
  requireManagerOrAdmin,
  validate(idParamValidation),
  userController.removeBackupContact.bind(userController)
);

export default router;
