/**
 * CheckIn Controller
 * Handles check-in HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { checkInService } from '../services';
import { CreateCheckInDto, UpdateCheckInDto, CheckInFilter, CheckInStatus } from '../types';

export class CheckInController {
  
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: CheckInFilter = {
        ShiftId: req.query.ShiftId as string | undefined,
        WorkerId: req.query.WorkerId as string | undefined,
        Status: req.query.Status as CheckInStatus | undefined,
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
        SortBy: req.query.SortBy as string | undefined,
        SortOrder: req.query.SortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await checkInService.findAll(filter);

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
      const checkIn = await checkInService.findById(id);

      if (!checkIn) {
        res.status(404).json({
          Success: false,
          Message: 'Check-in not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: checkIn,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const checkInData: CreateCheckInDto = {
        ShiftId: req.body.ShiftId,
        WorkerId: req.body.WorkerId,
        ScheduledTime: req.body.ScheduledTime,
      };

      const checkIn = await checkInService.create(checkInData);

      res.status(201).json({
        Success: true,
        Data: checkIn,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateCheckInDto = {
        ResponseTime: req.body.ResponseTime,
        Status: req.body.Status,
        ResponseSeconds: req.body.ResponseSeconds,
      };

      const checkIn = await checkInService.update(id, updateData);

      if (!checkIn) {
        res.status(404).json({
          Success: false,
          Message: 'Check-in not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: checkIn,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await checkInService.delete(id);

      if (!deleted) {
        res.status(404).json({
          Success: false,
          Message: 'Check-in not found',
        });
        return;
      }

      res.json({
        Success: true,
        Message: 'Check-in deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const checkIn = await checkInService.confirmCheckIn(id);

      if (!checkIn) {
        res.status(404).json({
          Success: false,
          Message: 'Check-in not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: checkIn,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsMissed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const checkIn = await checkInService.markAsMissed(id);

      if (!checkIn) {
        res.status(404).json({
          Success: false,
          Message: 'Check-in not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: checkIn,
      });
    } catch (error) {
      next(error);
    }
  }

  async scheduleCheckIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shiftId } = req.body;
      const checkIn = await checkInService.scheduleCheckIn(shiftId);

      res.status(201).json({
        Success: true,
        Data: checkIn,
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmForShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shiftId } = req.body;
      const checkIn = await checkInService.confirmCheckInForShift(shiftId);

      res.status(201).json({
        Success: true,
        Data: checkIn,
      });
    } catch (error) {
      next(error);
    }
  }

  async markMissedForShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shiftId } = req.body;
      const checkIn = await checkInService.markCheckInAsMissedForShift(shiftId);

      res.status(201).json({
        Success: true,
        Data: checkIn,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByShiftId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shiftId } = req.params;
      const checkIns = await checkInService.getCheckInsByShiftId(shiftId);

      res.json({
        Success: true,
        Data: checkIns,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByWorkerId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workerId } = req.params;
      const checkIns = await checkInService.getCheckInsByWorkerId(workerId);

      res.json({
        Success: true,
        Data: checkIns,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const checkIns = await checkInService.getPendingCheckIns();

      res.json({
        Success: true,
        Data: checkIns,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAverageResponseTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = req.query.WorkerId as string | undefined;
      const averageTime = await checkInService.getAverageResponseTime(workerId);

      res.json({
        Success: true,
        Data: { AverageResponseTime: averageTime },
      });
    } catch (error) {
      next(error);
    }
  }

  async processOverdue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const processedCount = await checkInService.processOverdueCheckIns();

      res.json({
        Success: true,
        Data: { ProcessedCount: processedCount },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const checkInController = new CheckInController();
