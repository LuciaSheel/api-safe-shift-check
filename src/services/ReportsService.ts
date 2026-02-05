/**
 * Reports Service
 * Handles reporting business logic
 */

import { reportsRepository } from '../repositories';
import {
  DashboardMetrics,
  TimeTrackingRecord,
  ComplianceRecord,
  ChartDataPoint,
  ReportFilter,
} from '../types';

export class ReportsService {
  
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return reportsRepository.getDashboardMetrics();
  }

  async getTimeTrackingRecords(filter?: ReportFilter): Promise<TimeTrackingRecord[]> {
    return reportsRepository.getTimeTrackingRecords(filter);
  }

  async getComplianceRecords(filter?: ReportFilter): Promise<ComplianceRecord[]> {
    return reportsRepository.getComplianceRecords(filter);
  }

  async getWeeklyHoursData(): Promise<ChartDataPoint[]> {
    return reportsRepository.getWeeklyHoursData();
  }

  async getComplianceTrendData(): Promise<ChartDataPoint[]> {
    return reportsRepository.getComplianceTrendData();
  }

  async getAlertsByTypeData(): Promise<ChartDataPoint[]> {
    return reportsRepository.getAlertsByTypeData();
  }

  async getActiveWorkersData(): Promise<ChartDataPoint[]> {
    return reportsRepository.getActiveWorkersData();
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
    return reportsRepository.getShiftReports(filter);
  }

  async generateTimeTrackingReport(filter?: ReportFilter): Promise<TimeTrackingRecord[]> {
    return reportsRepository.generateTimeTrackingRecords(filter);
  }

  async generateComplianceReport(filter?: ReportFilter): Promise<ComplianceRecord[]> {
    return reportsRepository.generateComplianceRecords(filter);
  }

  async getReportsSummary(filter?: ReportFilter): Promise<{
    TimeTracking: TimeTrackingRecord[];
    Compliance: ComplianceRecord[];
    Metrics: DashboardMetrics;
    Charts: {
      WeeklyHours: ChartDataPoint[];
      ComplianceTrend: ChartDataPoint[];
      AlertsByType: ChartDataPoint[];
      ActiveWorkers: ChartDataPoint[];
    };
  }> {
    const [
      timeTracking,
      compliance,
      metrics,
      weeklyHours,
      complianceTrend,
      alertsByType,
      activeWorkers,
    ] = await Promise.all([
      this.getTimeTrackingRecords(filter),
      this.getComplianceRecords(filter),
      this.getDashboardMetrics(),
      this.getWeeklyHoursData(),
      this.getComplianceTrendData(),
      this.getAlertsByTypeData(),
      this.getActiveWorkersData(),
    ]);

    return {
      TimeTracking: timeTracking,
      Compliance: compliance,
      Metrics: metrics,
      Charts: {
        WeeklyHours: weeklyHours,
        ComplianceTrend: complianceTrend,
        AlertsByType: alertsByType,
        ActiveWorkers: activeWorkers,
      },
    };
  }

  async exportTimeTrackingCsv(filter?: ReportFilter): Promise<string> {
    const records = await this.getTimeTrackingRecords(filter);
    
    const headers = [
      'Worker ID',
      'Worker Name',
      'Date',
      'Start Time',
      'End Time',
      'Total Hours',
      'Location',
      'Check-Ins Completed',
      'Check-Ins Missed',
    ];

    const rows = records.map(r => [
      r.WorkerId,
      r.WorkerName,
      r.Date,
      r.StartTime,
      r.EndTime,
      r.TotalHours.toString(),
      r.Location,
      r.CheckInsCompleted.toString(),
      r.CheckInsMissed.toString(),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async exportComplianceCsv(filter?: ReportFilter): Promise<string> {
    const records = await this.getComplianceRecords(filter);
    
    const headers = [
      'Worker ID',
      'Worker Name',
      'Period',
      'Total Check-Ins',
      'Completed Check-Ins',
      'Missed Check-Ins',
      'Compliance Rate (%)',
      'Avg Response Time (s)',
    ];

    const rows = records.map(r => [
      r.WorkerId,
      r.WorkerName,
      r.Period,
      r.TotalCheckIns.toString(),
      r.CompletedCheckIns.toString(),
      r.MissedCheckIns.toString(),
      r.ComplianceRate.toString(),
      r.AverageResponseTime.toString(),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

// Export singleton instance
export const reportsService = new ReportsService();
