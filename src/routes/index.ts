/**
 * Routes Index
 * Export all route modules and main router setup
 */

import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import locationRoutes from './locationRoutes';
import shiftRoutes from './shiftRoutes';
import checkInRoutes from './checkInRoutes';
import alertRoutes from './alertRoutes';
import notificationRoutes from './notificationRoutes';
import teamRoutes from './teamRoutes';
import systemSettingsRoutes from './systemSettingsRoutes';
import reportsRoutes from './reportsRoutes';

/**
 * Setup all API routes
 */
export function setupRoutes(app: Router): void {
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      Status: 'healthy',
      Timestamp: new Date().toISOString(),
      Version: '1.0.0',
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/shifts', shiftRoutes);
  app.use('/api/check-ins', checkInRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/settings', systemSettingsRoutes);
  app.use('/api/reports', reportsRoutes);
}

export {
  authRoutes,
  userRoutes,
  locationRoutes,
  shiftRoutes,
  checkInRoutes,
  alertRoutes,
  notificationRoutes,
  teamRoutes,
  systemSettingsRoutes,
  reportsRoutes,
};
