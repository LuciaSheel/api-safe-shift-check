/**
 * Alert Controller
 * Handles alert HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services';
import { CreateAlertDto, UpdateAlertDto, AlertFilter, AlertStatus, AlertSeverity, AlertType } from '../types';

export class AlertController {
  
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: AlertFilter = {
        WorkerId: req.query.WorkerId as string | undefined,
        BackupContactId: req.query.BackupContactId as string | undefined,
        Status: req.query.Status as AlertStatus | undefined,
        Severity: req.query.Severity as AlertSeverity | undefined,
        Type: req.query.Type as AlertType | undefined,
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
        SortBy: req.query.SortBy as string | undefined,
        SortOrder: req.query.SortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await alertService.findAll(filter);

      res.json({
        Success: true,
        Data: result.Data,
        Total: result.Total,
        Page: result.Page,
        PageSize: result.PageSize,
        TotalPages: result.TotalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const alert = await alertService.findById(id);

      if (!alert) {
        res.status(404).json({
          Success: false,
          Message: 'Alert not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alertData: CreateAlertDto = {
        ShiftId: req.body.ShiftId,
        WorkerId: req.body.WorkerId,
        BackupContactId: req.body.BackupContactId,
        Type: req.body.Type,
        Severity: req.body.Severity,
        Message: req.body.Message,
      };

      const alert = await alertService.create(alertData);

      res.status(201).json({
        Success: true,
        Data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateAlertDto = {
        Status: req.body.Status,
        AcknowledgedAt: req.body.AcknowledgedAt,
        AcknowledgedBy: req.body.AcknowledgedBy,
        ResolvedAt: req.body.ResolvedAt,
        ResolvedBy: req.body.ResolvedBy,
      };

      const alert = await alertService.update(id, updateData);

      if (!alert) {
        res.status(404).json({
          Success: false,
          Message: 'Alert not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await alertService.delete(id);

      if (!deleted) {
        res.status(404).json({
          Success: false,
          Message: 'Alert not found',
        });
        return;
      }

      res.json({
        Success: true,
        Message: 'Alert deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async acknowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const acknowledgedBy = (req as Request & { user?: { UserId: string } }).user?.UserId || 'unknown';
      
      const alert = await alertService.acknowledge(id, acknowledgedBy);

      if (!alert) {
        res.status(404).json({
          Success: false,
          Message: 'Alert not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const resolvedBy = (req as Request & { user?: { UserId: string } }).user?.UserId || 'unknown';
      
      const alert = await alertService.resolve(id, resolvedBy);

      if (!alert) {
        res.status(404).json({
          Success: false,
          Message: 'Alert not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await alertService.getActiveAlerts();

      res.json({
        Success: true,
        Data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByWorkerId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workerId } = req.params;
      const alerts = await alertService.getAlertsByWorkerId(workerId);

      res.json({
        Success: true,
        Data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByBackupContactId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { backupContactId } = req.params;
      const alerts = await alertService.getAlertsByBackupContactId(backupContactId);

      res.json({
        Success: true,
        Data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWithDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const details = await alertService.getAlertWithDetails(id);

      if (!details) {
        res.status(404).json({
          Success: false,
          Message: 'Alert not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  async createEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { WorkerId, ShiftId, Message } = req.body;
      const alert = await alertService.createEmergencyAlert(WorkerId, ShiftId, Message);

      res.status(201).json({
        Success: true,
        Data: alert,
      });
    } catch (error) {
      next(error);
    }
  }

  async countPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await alertService.countPendingAlerts();

      res.json({
        Success: true,
        Data: { PendingCount: count },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const alertController = new AlertController();
