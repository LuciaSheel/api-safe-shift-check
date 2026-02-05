/**
 * Reports Controller
 * Handles reports HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { reportsService } from '../services';
import { ReportFilter } from '../types';

export class ReportsController {
  
  async getDashboardMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await reportsService.getDashboardMetrics();

      res.json({
        Success: true,
        Data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTimeTrackingRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: ReportFilter = {
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        WorkerId: req.query.WorkerId as string | undefined,
        LocationId: req.query.LocationId as string | undefined,
        TeamId: req.query.TeamId as string | undefined,
      };

      const records = await reportsService.getTimeTrackingRecords(filter);

      res.json({
        Success: true,
        Data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getComplianceRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: ReportFilter = {
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        WorkerId: req.query.WorkerId as string | undefined,
        TeamId: req.query.TeamId as string | undefined,
      };

      const records = await reportsService.getComplianceRecords(filter);

      res.json({
        Success: true,
        Data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWeeklyHoursData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getWeeklyHoursData();

      res.json({
        Success: true,
        Data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getComplianceTrendData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getComplianceTrendData();

      res.json({
        Success: true,
        Data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAlertsByTypeData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getAlertsByTypeData();

      res.json({
        Success: true,
        Data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveWorkersData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getActiveWorkersData();

      res.json({
        Success: true,
        Data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getShiftReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: ReportFilter = {
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        WorkerId: req.query.WorkerId as string | undefined,
        LocationId: req.query.LocationId as string | undefined,
      };

      const data = await reportsService.getShiftReports(filter);

      res.json({
        Success: true,
        Data: data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReportsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: ReportFilter = {
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        WorkerId: req.query.WorkerId as string | undefined,
        LocationId: req.query.LocationId as string | undefined,
        TeamId: req.query.TeamId as string | undefined,
      };

      const summary = await reportsService.getReportsSummary(filter);

      res.json({
        Success: true,
        Data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportTimeTrackingCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: ReportFilter = {
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        WorkerId: req.query.WorkerId as string | undefined,
      };

      const csv = await reportsService.exportTimeTrackingCsv(filter);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=time-tracking.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async exportComplianceCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: ReportFilter = {
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        WorkerId: req.query.WorkerId as string | undefined,
      };

      const csv = await reportsService.exportComplianceCsv(filter);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=compliance.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async exportShiftsCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: ReportFilter = {
        StartDate: req.query.StartDate as string | undefined,
        EndDate: req.query.EndDate as string | undefined,
        WorkerId: req.query.WorkerId as string | undefined,
        LocationId: req.query.LocationId as string | undefined,
      };

      const csv = await reportsService.exportShiftsCsv(filter);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=shifts.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const reportsController = new ReportsController();
