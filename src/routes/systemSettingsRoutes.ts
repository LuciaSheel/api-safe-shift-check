/**
 * System Settings Routes
 * Operations for system settings
 */

import { Router } from 'express';
import { systemSettingsController } from '../controllers';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, updateSystemSettingsValidation } from '../middleware/validation';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/settings
 * @desc    Get system settings
 * @access  Private
 */
router.get('/', systemSettingsController.get.bind(systemSettingsController));

/**
 * @route   PUT /api/settings
 * @desc    Update system settings
 * @access  Private (Admin)
 */
router.put(
  '/',
  requireAdmin,
  validate(updateSystemSettingsValidation),
  systemSettingsController.update.bind(systemSettingsController)
);

/**
 * @route   POST /api/settings/reset
 * @desc    Reset system settings to defaults
 * @access  Private (Admin)
 */
router.post('/reset', requireAdmin, systemSettingsController.reset.bind(systemSettingsController));

export default router;
