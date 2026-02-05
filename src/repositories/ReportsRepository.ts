/**
 * Reports Repository
 * Handles all data access operations for reporting data
 */

import { dataStore } from '../data/dataStore';
import {
  DashboardMetrics,
  TimeTrackingRecord,
  ComplianceRecord,
  ChartDataPoint,
  ReportFilter,
} from '../types';

export class ReportsRepository {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const totalWorkers = dataStore.users.filter(u => u.Role === 'Worker').length;
    const activeWorkers = dataStore.shifts.filter(s => s.Status === 'Active').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const totalShiftsToday = dataStore.shifts.filter(s => {
      const shiftStart = new Date(s.StartTime);
      return shiftStart >= today && shiftStart < tomorrow;
    }).length;

    const pendingAlerts = dataStore.alerts.filter(a => a.Status === 'Active').length;

    const confirmedCheckIns = dataStore.checkIns.filter(c => c.Status === 'Confirmed');
    const totalCheckIns = dataStore.checkIns.length;
    const complianceRate = totalCheckIns > 0 
      ? Math.round((confirmedCheckIns.length / totalCheckIns) * 100 * 10) / 10 
      : 100;

    const avgResponseTime = confirmedCheckIns.length > 0
      ? Math.round(
          confirmedCheckIns.reduce((sum, c) => sum + (c.ResponseSeconds || 0), 0) / 
          confirmedCheckIns.length
        )
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
    let records = [...dataStore.timeTrackingRecords];

    if (filter) {
      if (filter.WorkerId) {
        records = records.filter(r => r.WorkerId === filter.WorkerId);
      }
      if (filter.StartDate) {
        records = records.filter(r => r.Date >= filter.StartDate!);
      }
      if (filter.EndDate) {
        records = records.filter(r => r.Date <= filter.EndDate!);
      }
    }

    return records;
  }

  async getComplianceRecords(filter?: ReportFilter): Promise<ComplianceRecord[]> {
    let records = [...dataStore.complianceRecords];

    if (filter) {
      if (filter.WorkerId) {
        records = records.filter(r => r.WorkerId === filter.WorkerId);
      }
    }

    return records;
  }

  async getWeeklyHoursData(): Promise<ChartDataPoint[]> {
    return [...dataStore.weeklyHoursData];
  }

  async getComplianceTrendData(): Promise<ChartDataPoint[]> {
    return [...dataStore.complianceTrendData];
  }

  async getAlertsByTypeData(): Promise<ChartDataPoint[]> {
    return [...dataStore.alertsByTypeData];
  }

  async getActiveWorkersData(): Promise<ChartDataPoint[]> {
    return [...dataStore.activeWorkersData];
  }

  // Generate time tracking records from actual shift data
  async generateTimeTrackingRecords(filter?: ReportFilter): Promise<TimeTrackingRecord[]> {
    let shifts = dataStore.shifts.filter(s => s.Status === 'Completed' && s.EndTime);

    if (filter) {
      if (filter.WorkerId) {
        shifts = shifts.filter(s => s.WorkerId === filter.WorkerId);
      }
      if (filter.LocationId) {
        shifts = shifts.filter(s => s.LocationId === filter.LocationId);
      }
      if (filter.StartDate) {
        shifts = shifts.filter(s => new Date(s.StartTime) >= new Date(filter.StartDate!));
      }
      if (filter.EndDate) {
        shifts = shifts.filter(s => new Date(s.StartTime) <= new Date(filter.EndDate!));
      }
    }

    return shifts.map(shift => {
      const worker = dataStore.users.find(u => u.Id === shift.WorkerId);
      const location = dataStore.locations.find(l => l.Id === shift.LocationId);
      const shiftCheckIns = dataStore.checkIns.filter(c => c.ShiftId === shift.Id);
      
      const startTime = new Date(shift.StartTime);
      const endTime = new Date(shift.EndTime!);
      const totalHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10;

      return {
        WorkerId: shift.WorkerId,
        WorkerName: worker ? `${worker.FirstName} ${worker.LastName}` : 'Unknown',
        Date: startTime.toISOString().split('T')[0],
        StartTime: startTime.toTimeString().slice(0, 5),
        EndTime: endTime.toTimeString().slice(0, 5),
        TotalHours: totalHours,
        Location: location?.Name || 'Unknown',
        CheckInsCompleted: shiftCheckIns.filter(c => c.Status === 'Confirmed').length,
        CheckInsMissed: shiftCheckIns.filter(c => c.Status === 'Missed').length,
      };
    });
  }

  // Generate compliance records from actual check-in data
  async generateComplianceRecords(filter?: ReportFilter): Promise<ComplianceRecord[]> {
    const workers = dataStore.users.filter(u => u.Role === 'Worker' && u.IsActive);
    
    return workers
      .filter(w => !filter?.WorkerId || w.Id === filter.WorkerId)
      .map(worker => {
        const workerCheckIns = dataStore.checkIns.filter(c => c.WorkerId === worker.Id);
        const completedCheckIns = workerCheckIns.filter(c => c.Status === 'Confirmed');
        const missedCheckIns = workerCheckIns.filter(c => c.Status === 'Missed');
        
        const complianceRate = workerCheckIns.length > 0
          ? Math.round((completedCheckIns.length / workerCheckIns.length) * 100 * 10) / 10
          : 100;

        const avgResponseTime = completedCheckIns.length > 0
          ? Math.round(
              completedCheckIns.reduce((sum, c) => sum + (c.ResponseSeconds || 0), 0) / 
              completedCheckIns.length
            )
          : 0;

        return {
          WorkerId: worker.Id,
          WorkerName: `${worker.FirstName} ${worker.LastName}`,
          Period: 'This Week',
          TotalCheckIns: workerCheckIns.length,
          CompletedCheckIns: completedCheckIns.length,
          MissedCheckIns: missedCheckIns.length,
          ComplianceRate: complianceRate,
          AverageResponseTime: avgResponseTime,
        };
      });
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
    }>;
    Total: number;
  }> {
    let shifts = [...dataStore.shifts];

    // Apply filters
    if (filter) {
      if (filter.WorkerId) {
        shifts = shifts.filter(s => s.WorkerId === filter.WorkerId);
      }
      if (filter.LocationId) {
        shifts = shifts.filter(s => s.LocationId === filter.LocationId);
      }
      if (filter.StartDate) {
        shifts = shifts.filter(s => s.StartTime >= filter.StartDate!);
      }
      if (filter.EndDate) {
        shifts = shifts.filter(s => s.StartTime <= filter.EndDate!);
      }
    }

    // Sort by start time descending (most recent first)
    shifts.sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime());

    const items = shifts.map(shift => {
      const worker = dataStore.users.find(u => u.Id === shift.WorkerId);
      const location = dataStore.locations.find(l => l.Id === shift.LocationId);
      const shiftCheckIns = dataStore.checkIns.filter(c => c.ShiftId === shift.Id);
      const shiftAlerts = dataStore.alerts.filter(a => a.ShiftId === shift.Id);

      const missedCheckIns = shiftCheckIns.filter(c => c.Status === 'Missed').length;
      const onTimeCheckIns = shiftCheckIns.filter(c => c.Status === 'Confirmed' && (c.ResponseSeconds || 0) <= 60).length;
      const lateCheckIns = shiftCheckIns.filter(c => c.Status === 'Confirmed' && (c.ResponseSeconds || 0) > 60).length;

      // Calculate duration in minutes
      const startTime = new Date(shift.StartTime);
      const endTime = shift.EndTime ? new Date(shift.EndTime) : new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      return {
        ShiftId: shift.Id,
        WorkerName: worker ? `${worker.FirstName} ${worker.LastName}` : 'Unknown',
        WorkerId: shift.WorkerId,
        LocationName: location?.Name || 'Unknown',
        LocationId: shift.LocationId,
        StartTime: shift.StartTime,
        EndTime: shift.EndTime || null,
        Duration: duration,
        Status: shift.Status as string,
        TotalCheckIns: shiftCheckIns.length,
        MissedCheckIns: missedCheckIns,
        OnTimeCheckIns: onTimeCheckIns,
        LateCheckIns: lateCheckIns,
        Alerts: shiftAlerts.length,
      };
    });

    return {
      Items: items,
      Total: items.length,
    };
  }
}

// Export singleton instance
export const reportsRepository = new ReportsRepository();
