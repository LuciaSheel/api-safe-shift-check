/**
 * Controllers Index
 * Export all controllers for easy importing
 */

import { AuthController } from './AuthController';
import { UserController } from './UserController';
import { LocationController } from './LocationController';
import { ShiftController } from './ShiftController';
import { CheckInController } from './CheckInController';
import { AlertController } from './AlertController';
import { NotificationController } from './NotificationController';
import { TeamController } from './TeamController';
import { SystemSettingsController } from './SystemSettingsController';
import { ReportsController } from './ReportsController';

// Export class definitions
export {
  AuthController,
  UserController,
  LocationController,
  ShiftController,
  CheckInController,
  AlertController,
  NotificationController,
  TeamController,
  SystemSettingsController,
  ReportsController,
};

// Export singleton instances
export const authController = new AuthController();
export const userController = new UserController();
export const locationController = new LocationController();
export const shiftController = new ShiftController();
export const checkInController = new CheckInController();
export const alertController = new AlertController();
export const notificationController = new NotificationController();
export const teamController = new TeamController();
export const systemSettingsController = new SystemSettingsController();
export const reportsController = new ReportsController();
