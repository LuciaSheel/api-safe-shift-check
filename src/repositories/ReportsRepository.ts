/**
 * Reports Repository (Prisma)
 * Computes reporting data directly from the database.
 * Chart data is computed from real records rather than stored static arrays.
 */

import { prisma } from '../lib/prisma';
import {
  DashboardMetrics,
  TimeTrackingRecord,
  ComplianceRecord,
  ChartDataPoint,
  ReportFilter,
} from '../types';

export class ReportsRepository {

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalWorkers, activeWorkers, totalShiftsToday, pendingAlerts, checkIns] =
      await Promise.all([
        prisma.user.count({ where: { Role: { in: ['Cleaner', 'Booker', 'Director'] }, IsActive: true } }),
        prisma.shift.count({ where: { Status: 'Active' } }),
        prisma.shift.count({ where: { StartTime: { gte: today, lt: tomorrow } } }),
        prisma.alert.count({ where: { Status: 'Active' } }),
        prisma.checkIn.findMany({ select: { Status: true, ResponseSeconds: true } }),
      ]);

    const confirmed = checkIns.filter(c => c.Status === 'Confirmed');
    const complianceRate =
      checkIns.length > 0
        ? Math.round((confirmed.length / checkIns.length) * 1000) / 10
        : 100;
    const avgResponseTime =
      confirmed.length > 0
        ? Math.round(confirmed.reduce((s, c) => s + (c.ResponseSeconds ?? 0), 0) / confirmed.length)
        : 0;

    return {
      TotalWorkers: totalWorkers,
      ActiveWorkers: activeWorkers,
      TotalShiftsToday: totalShiftsToday,
      PendingAlerts: pendingAlerts,
      ComplianceRate: complianceRate,
      AverageResponseTime: avgResponseTime,
    };
  }

  async getTimeTrackingRecords(filter?: ReportFilter): Promise<TimeTrackingRecord[]> {
    return this.generateTimeTrackingRecords(filter);
  }

  async getComplianceRecords(filter?: ReportFilter): Promise<ComplianceRecord[]> {
    return this.generateComplianceRecords(filter);
  }

  async getWeeklyHoursData(): Promise<ChartDataPoint[]> {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const shifts = await prisma.shift.findMany({
      where: { Status: 'Completed', StartTime: { gte: weekStart }, EndTime: { not: null } },
      select: { StartTime: true, EndTime: true },
    });

    const hoursPerDay: Record<string, number> = {};
    for (const s of shifts) {
      const label = days[s.StartTime.getDay()];
      const hrs = s.EndTime
        ? (s.EndTime.getTime() - s.StartTime.getTime()) / 3600000
        : 0;
      hoursPerDay[label] = (hoursPerDay[label] ?? 0) + hrs;
    }

    return days.map(d => ({ Name: d, Value: Math.round((hoursPerDay[d] ?? 0) * 10) / 10 }));
  }

  async getComplianceTrendData(): Promise<ChartDataPoint[]> {
    const result: ChartDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 7);

      const [total, confirmed] = await Promise.all([
        prisma.checkIn.count({ where: { ScheduledTime: { gte: weekStart, lt: weekEnd } } }),
        prisma.checkIn.count({ where: { ScheduledTime: { gte: weekStart, lt: weekEnd }, Status: 'Confirmed' } }),
      ]);

      const rate = total > 0 ? Math.round((confirmed / total) * 1000) / 10 : 100;
      result.push({ Name: `Week ${6 - i}`, Value: rate, Compliance: rate });
    }
    return result;
  }

  async getAlertsByTypeData(): Promise<ChartDataPoint[]> {
    const types = [
      { key: 'MissedCheckIn', label: 'Missed Check-in' },
      { key: 'Emergency', label: 'Emergency' },
      { key: 'SystemAlert', label: 'System Alert' },
    ];
    return Promise.all(
      types.map(async ({ key, label }) => {
        const count = await prisma.alert.count({ where: { Type: key } });
        return { Name: label, Value: count };
      })
    );
  }

  async getActiveWorkersData(): Promise<ChartDataPoint[]> {
    const hours = [6, 8, 10, 12, 14, 16, 18, 20];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Promise.all(
      hours.map(async h => {
        const slotStart = new Date(today);
        slotStart.setHours(h, 0, 0, 0);
        const slotEnd = new Date(today);
        slotEnd.setHours(h + 2, 0, 0, 0);

        const count = await prisma.shift.count({
          where: {
            Status: 'Active',
            StartTime: { lt: slotEnd },
            OR: [{ EndTime: null }, { EndTime: { gt: slotStart } }],
          },
        });

        const label = h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        return { Name: label, Value: count, Workers: count };
      })
    );
  }

  async generateTimeTrackingRecords(filter?: ReportFilter): Promise<TimeTrackingRecord[]> {
    const where: Record<string, unknown> = { Status: 'Completed', EndTime: { not: null } };
    if (filter?.WorkerId) where.WorkerId = filter.WorkerId;
    if (filter?.LocationId) where.LocationId = filter.LocationId;
    if (filter?.StartDate || filter?.EndDate) {
      where.StartTime = {
        ...(filter?.StartDate ? { gte: new Date(filter.StartDate) } : {}),
        ...(filter?.EndDate ? { lte: new Date(filter.EndDate) } : {}),
      };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        Worker: { select: { FirstName: true, LastName: true } },
        Location: { select: { Name: true } },
        CheckIns: { select: { Status: true } },
      },
      orderBy: { StartTime: 'desc' },
    });

    return shifts.map(s => {
      const end = s.EndTime!;
      const totalHours =
        Math.round(((end.getTime() - s.StartTime.getTime()) / 3600000) * 10) / 10;
      return {
        WorkerId: s.WorkerId,
        WorkerName: `${s.Worker.FirstName} ${s.Worker.LastName}`,
        Date: s.StartTime.toISOString().split('T')[0],
        StartTime: s.StartTime.toTimeString().slice(0, 5),
        EndTime: end.toTimeString().slice(0, 5),
        TotalHours: totalHours,
        Location: s.Location.Name,
        CheckInsCompleted: s.CheckIns.filter(c => c.Status === 'Confirmed').length,
        CheckInsMissed: s.CheckIns.filter(c => c.Status === 'Missed').length,
      };
    });
  }

  async generateComplianceRecords(filter?: ReportFilter): Promise<ComplianceRecord[]> {
    const workers = await prisma.user.findMany({
      where: {
        Role: { in: ['Cleaner', 'Booker', 'Director'] },
        IsActive: true,
        ...(filter?.WorkerId ? { Id: filter.WorkerId } : {}),
      },
    });

    return Promise.all(
      workers.map(async w => {
        const checkIns = await prisma.checkIn.findMany({
          where: { WorkerId: w.Id },
          select: { Status: true, ResponseSeconds: true },
        });
        const completed = checkIns.filter(c => c.Status === 'Confirmed');
        const missed = checkIns.filter(c => c.Status === 'Missed');
        const rate =
          checkIns.length > 0
            ? Math.round((completed.length / checkIns.length) * 1000) / 10
            : 100;
        const avgRt =
          completed.length > 0
            ? Math.round(completed.reduce((s, c) => s + (c.ResponseSeconds ?? 0), 0) / completed.length)
            : 0;

        return {
          WorkerId: w.Id,
          WorkerName: `${w.FirstName} ${w.LastName}`,
          Period: 'All Time',
          TotalCheckIns: checkIns.length,
          CompletedCheckIns: completed.length,
          MissedCheckIns: missed.length,
          ComplianceRate: rate,
          AverageResponseTime: avgRt,
        };
      })
    );
  }

  async getShiftReports(filter?: ReportFilter): Promise<{
    Items: Array<{
      ShiftId: string;
      WorkerName: string;
      WorkerId: string;
      LocationName: string;
      LocationId: string;
      StartTime: string;
      EndTime: string | null;
      Duration: number;
      Status: string;
      TotalCheckIns: number;
      MissedCheckIns: number;
      OnTimeCheckIns: number;
      LateCheckIns: number;
      Alerts: number;
      Notes?: string;
    }>;
    Total: number;
  }> {
    const where: Record<string, unknown> = {};
    if (filter?.WorkerId) where.WorkerId = filter.WorkerId;
    if (filter?.LocationId) where.LocationId = filter.LocationId;
    if (filter?.StartDate || filter?.EndDate) {
      where.StartTime = {
        ...(filter?.StartDate ? { gte: new Date(filter.StartDate) } : {}),
        ...(filter?.EndDate ? { lte: new Date(filter.EndDate) } : {}),
      };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        Worker: { select: { FirstName: true, LastName: true } },
        Location: { select: { Name: true } },
        CheckIns: { select: { Status: true, ResponseSeconds: true } },
        Alerts: { select: { Id: true } },
      },
      orderBy: { StartTime: 'desc' },
    });

    const items = shifts.map(s => {
      const now = new Date();
      const end = s.EndTime ?? now;
      const duration = Math.round((end.getTime() - s.StartTime.getTime()) / 60000);
      return {
        ShiftId: s.Id,
        WorkerName: `${s.Worker.FirstName} ${s.Worker.LastName}`,
        WorkerId: s.WorkerId,
        LocationName: s.Location.Name,
        LocationId: s.LocationId,
        StartTime: s.StartTime.toISOString(),
        EndTime: s.EndTime?.toISOString() ?? null,
        Duration: duration,
        Status: s.Status,
        TotalCheckIns: s.CheckIns.length,
        MissedCheckIns: s.CheckIns.filter(c => c.Status === 'Missed').length,
        OnTimeCheckIns: s.CheckIns.filter(c => c.Status === 'Confirmed' && (c.ResponseSeconds ?? 0) <= 60).length,
        LateCheckIns: s.CheckIns.filter(c => c.Status === 'Confirmed' && (c.ResponseSeconds ?? 0) > 60).length,
        Alerts: s.Alerts.length,
        Notes: s.Notes ?? undefined,
      };
    });

    return { Items: items, Total: items.length };
  }
}

export const reportsRepository = new ReportsRepository();
