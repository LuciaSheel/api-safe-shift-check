/**
 * System Settings Controller
 * Handles system settings HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { systemSettingsService } from '../services';
import { UpdateSystemSettingsDto } from '../types';

export class SystemSettingsController {
  
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await systemSettingsService.get();

      res.json({
        Success: true,
        Data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updateData: UpdateSystemSettingsDto = {
        CheckInIntervalMinutes: req.body.CheckInIntervalMinutes,
        ResponseTimeoutSeconds: req.body.ResponseTimeoutSeconds,
        EscalationDelayMinutes: req.body.EscalationDelayMinutes,
        EnableSmsNotifications: req.body.EnableSmsNotifications,
        EnableEmailNotifications: req.body.EnableEmailNotifications,
        EnablePushNotifications: req.body.EnablePushNotifications,
      };

      const updatedBy = (req as Request & { user?: { UserId: string } }).user?.UserId;
      const settings = await systemSettingsService.update(updateData, updatedBy);

      res.json({
        Success: true,
        Data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async reset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resetBy = (req as Request & { user?: { UserId: string } }).user?.UserId;
      const settings = await systemSettingsService.reset(resetBy);

      res.json({
        Success: true,
        Data: settings,
        Message: 'Settings reset to default values',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const systemSettingsController = new SystemSettingsController();
