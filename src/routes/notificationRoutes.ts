/**
 * Notification Routes
 * CRUD operations for notifications
 */

import { Router } from 'express';
import { notificationController } from '../controllers';
import { authenticate, requireManagerOrAdmin, requireAdmin } from '../middleware/auth';
import {
  validate,
  createNotificationValidation,
  bulkNotificationValidation,
  idParamValidation,
  paginationValidation,
} from '../middleware/validation';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications with optional filtering
 * @access  Private
 */
router.get(
  '/',
  validate(paginationValidation),
  notificationController.findAll.bind(notificationController)
);

/**
 * @route   GET /api/notifications/count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get('/count', notificationController.countUnread.bind(notificationController));

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(idParamValidation),
  notificationController.findById.bind(notificationController)
);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Private (Manager, Admin)
 */
router.post(
  '/',
  requireManagerOrAdmin,
  validate(createNotificationValidation),
  notificationController.create.bind(notificationController)
);

/**
 * @route   POST /api/notifications/bulk
 * @desc    Send notification to multiple users
 * @access  Private (Admin)
 */
router.post(
  '/bulk',
  requireAdmin,
  validate(bulkNotificationValidation),
  notificationController.sendBulk.bind(notificationController)
);

/**
 * @route   POST /api/notifications/role
 * @desc    Send notification to all users of a specific role
 * @access  Private (Admin)
 */
router.post(
  '/role',
  requireAdmin,
  notificationController.sendToRole.bind(notificationController)
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete(
  '/:id',
  validate(idParamValidation),
  notificationController.delete.bind(notificationController)
);

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post(
  '/:id/read',
  validate(idParamValidation),
  notificationController.markAsRead.bind(notificationController)
);

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/read-all', notificationController.markAllAsRead.bind(notificationController));

export default router;
