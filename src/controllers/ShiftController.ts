/**
 * Shift Controller
 * Handles shift HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { shiftService } from '../services';
import { CreateShiftDto, UpdateShiftDto, ShiftFilter, ShiftStatus } from '../types';

export class ShiftController {
  
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: ShiftFilter = {
        WorkerId: req.query.WorkerId as string | undefined,
        LocationId: req.query.LocationId as string | undefined,
        Status: req.query.Status as ShiftStatus | undefined,
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
        SortBy: req.query.SortBy as string | undefined,
        SortOrder: req.query.SortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await shiftService.findAll(filter);

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
      const shift = await shiftService.findById(id);

      if (!shift) {
        res.status(404).json({
          Success: false,
          Message: 'Shift not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shiftData: CreateShiftDto = {
        WorkerId: req.body.WorkerId,
        LocationId: req.body.LocationId,
        EstimatedEndTime: req.body.EstimatedEndTime,
        Notes: req.body.Notes,
        CheckInIntervalMinutes: req.body.CheckInIntervalMinutes,
      };

      const shift = await shiftService.create(shiftData);

      res.status(201).json({
        Success: true,
        Data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateShiftDto = {
        Status: req.body.Status,
        EndTime: req.body.EndTime,
        EstimatedEndTime: req.body.EstimatedEndTime,
        Notes: req.body.Notes,
        CheckInIntervalMinutes: req.body.CheckInIntervalMinutes,
      };

      const shift = await shiftService.update(id, updateData);

      if (!shift) {
        res.status(404).json({
          Success: false,
          Message: 'Shift not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await shiftService.delete(id);

      if (!deleted) {
        res.status(404).json({
          Success: false,
          Message: 'Shift not found',
        });
        return;
      }

      res.json({
        Success: true,
        Message: 'Shift deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async startShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { WorkerId, LocationId, EstimatedHours, Notes } = req.body;
      const shift = await shiftService.startShift(WorkerId, LocationId, EstimatedHours, Notes);

      res.status(201).json({
        Success: true,
        Data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async endShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const shift = await shiftService.endShift(id);

      if (!shift) {
        res.status(404).json({
          Success: false,
          Message: 'Shift not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const shift = await shiftService.cancelShift(id);

      if (!shift) {
        res.status(404).json({
          Success: false,
          Message: 'Shift not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shifts = await shiftService.getActiveShifts();

      res.json({
        Success: true,
        Data: shifts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveShiftByWorkerId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workerId } = req.params;
      const shift = await shiftService.getActiveShiftByWorkerId(workerId);

      if (!shift) {
        res.status(404).json({
          Success: false,
          Message: 'No active shift found for this worker',
        });
        return;
      }

      res.json({
        Success: true,
        Data: shift,
      });
    } catch (error) {
      next(error);
    }
  }

  async getShiftsByWorkerId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workerId } = req.params;
      const shifts = await shiftService.getShiftsByWorkerId(workerId);

      res.json({
        Success: true,
        Data: shifts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTodaysShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shifts = await shiftService.getTodaysShifts();

      res.json({
        Success: true,
        Data: shifts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getShiftWithDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const details = await shiftService.getShiftWithDetails(id);

      if (!details) {
        res.status(404).json({
          Success: false,
          Message: 'Shift not found',
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

  async extendShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { AdditionalHours } = req.body;
      const shift = await shiftService.extendShift(id, AdditionalHours);

      if (!shift) {
        res.status(404).json({
          Success: false,
          Message: 'Shift not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: shift,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const shiftController = new ShiftController();
