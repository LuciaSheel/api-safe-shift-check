/**
 * Reports Routes
 * Analytics and reporting endpoints
 */

import { Router } from 'express';
import { reportsController } from '../controllers';
import { authenticate, requireManagerOrAdmin } from '../middleware/auth';
import { validate, paginationValidation } from '../middleware/validation';

const router = Router();

// All reports routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get dashboard metrics
 * @access  Private
 */
router.get('/dashboard', reportsController.getDashboardMetrics.bind(reportsController));

/**
 * @route   GET /api/reports/time-tracking
 * @desc    Get time tracking records
 * @access  Private (Manager, Admin)
 */
router.get(
  '/time-tracking',
  requireManagerOrAdmin,
  validate(paginationValidation),
  reportsController.getTimeTrackingRecords.bind(reportsController)
);

/**
 * @route   GET /api/reports/compliance
 * @desc    Get compliance records
 * @access  Private (Manager, Admin)
 */
router.get(
  '/compliance',
  requireManagerOrAdmin,
  validate(paginationValidation),
  reportsController.getComplianceRecords.bind(reportsController)
);

/**
 * @route   GET /api/reports/check-ins-by-day
 * @desc    Get check-ins grouped by day (weekly hours data)
 * @access  Private (Manager, Admin)
 */
router.get(
  '/check-ins-by-day',
  requireManagerOrAdmin,
  reportsController.getWeeklyHoursData.bind(reportsController)
);

/**
 * @route   GET /api/reports/alerts-by-type
 * @desc    Get alerts grouped by type
 * @access  Private (Manager, Admin)
 */
router.get(
  '/alerts-by-type',
  requireManagerOrAdmin,
  reportsController.getAlertsByTypeData.bind(reportsController)
);

/**
 * @route   GET /api/reports/shifts-by-location
 * @desc    Get shifts grouped by location (active workers data)
 * @access  Private (Manager, Admin)
 */
router.get(
  '/shifts-by-location',
  requireManagerOrAdmin,
  reportsController.getActiveWorkersData.bind(reportsController)
);

/**
 * @route   GET /api/reports/export/time-tracking
 * @desc    Export time tracking report as CSV
 * @access  Private (Manager, Admin)
 */
router.get(
  '/export/time-tracking',
  requireManagerOrAdmin,
  reportsController.exportTimeTrackingCsv.bind(reportsController)
);

/**
 * @route   GET /api/reports/export/compliance
 * @desc    Export compliance report as CSV
 * @access  Private (Manager, Admin)
 */
router.get(
  '/export/compliance',
  requireManagerOrAdmin,
  reportsController.exportComplianceCsv.bind(reportsController)
);

export default router;
