/**
 * In-Memory Data Store
 * This serves as a mock database for development and testing
 * Can be replaced with actual database connections (PostgreSQL, MongoDB, etc.)
 */

import {
  User,
  Location,
  Shift,
  CheckIn,
  Alert,
  Notification,
  Team,
  SystemSettings,
  TimeTrackingRecord,
  ComplianceRecord,
  ChartDataPoint,
  PasswordResetToken,
} from '../types';

// ============================================
// USERS
// ============================================

const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);

export const users: User[] = [
  {
    Id: 'user-001',
    Email: 'sarah.johnson@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'Sarah',
    LastName: 'Johnson',
    Role: 'Cleaner',
    Phone: '+1 (555) 123-4567',
    IsActive: true,
    CreatedAt: '2024-01-15T08:00:00Z',
    AssignedBackupContactIds: ['user-006', 'user-007'],
    TokenVersion: 1,
  },
  {
    Id: 'user-002',
    Email: 'mike.chen@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'Mike',
    LastName: 'Chen',
    Role: 'Cleaner',
    Phone: '+1 (555) 234-5678',
    IsActive: true,
    CreatedAt: '2024-02-01T09:00:00Z',
    AssignedBackupContactIds: ['user-006', 'user-008'],
    TokenVersion: 1,
  },
  {
    Id: 'user-003',
    Email: 'emma.wilson@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'Emma',
    LastName: 'Wilson',
    Role: 'Booker',
    Phone: '+1 (555) 345-6789',
    IsActive: true,
    CreatedAt: '2024-02-10T10:00:00Z',
    AssignedBackupContactIds: ['user-007', 'user-006'],
    TokenVersion: 1,
  },
  {
    Id: 'user-004',
    Email: 'james.brown@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'James',
    LastName: 'Brown',
    Role: 'Booker',
    Phone: '+1 (555) 456-7890',
    IsActive: true,
    CreatedAt: '2024-03-01T08:30:00Z',
    AssignedBackupContactIds: ['user-007', 'user-008'],
    TokenVersion: 1,
  },
  {
    Id: 'user-005',
    Email: 'lisa.martinez@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'Lisa',
    LastName: 'Martinez',
    Role: 'Director',
    Phone: '+1 (555) 567-8901',
    IsActive: false,
    CreatedAt: '2024-01-20T11:00:00Z',
    AssignedBackupContactIds: ['user-006', 'user-007'],
    TokenVersion: 1,
  },
  {
    Id: 'user-006',
    Email: 'david.taylor@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'David',
    LastName: 'Taylor',
    Role: 'BackupContact',
    Phone: '+1 (555) 678-9012',
    IsActive: true,
    CreatedAt: '2024-01-10T08:00:00Z',
    AssignedWorkerIds: ['user-001', 'user-002', 'user-005'],
    TokenVersion: 1,
  },
  {
    Id: 'user-007',
    Email: 'jennifer.garcia@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'Jennifer',
    LastName: 'Garcia',
    Role: 'BackupContact',
    Phone: '+1 (555) 789-0123',
    IsActive: true,
    CreatedAt: '2024-01-12T09:00:00Z',
    AssignedWorkerIds: ['user-003', 'user-004'],
    TokenVersion: 1,
  },
  {
    Id: 'user-008',
    Email: 'robert.anderson@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'Robert',
    LastName: 'Anderson',
    Role: 'Director',
    Phone: '+1 (555) 890-1234',
    IsActive: true,
    CreatedAt: '2024-01-05T08:00:00Z',
    TeamId: 'team-001',
    TokenVersion: 1,
  },
  {
    Id: 'user-009',
    Email: 'maria.rodriguez@example.com',
    Password: '$2a$10$HLQQdXE5POxTARPOa5BkZ.4NiZ./YheecV.1J9pc98SbSsvZETnnm', // demo123
    FirstName: 'Maria',
    LastName: 'Rodriguez',
    Role: 'Director',
    Phone: '+1 (555) 901-2345',
    IsActive: true,
    CreatedAt: '2024-01-08T10:00:00Z',
    TeamId: 'team-002',
    TokenVersion: 1,
  },
  {
    Id: 'user-010',
    Email: 'admin@safealone.com',
    Password: '$2a$10$oiZB.MnuLKL19oKPR5226On3HvPSrevepS1cgS3Tqowg2u94xcOgS', // admin123
    FirstName: 'System',
    LastName: 'Administrator',
    Role: 'Administrator',
    Phone: '+1 (555) 000-0000',
    IsActive: true,
    CreatedAt: '2024-01-01T00:00:00Z',
    TokenVersion: 1,
  },
];

// ============================================
// LOCATIONS
// ============================================

export const locations: Location[] = [
  {
    Id: 'loc-001',
    Name: 'Downtown Community Hall',
    Address: '123 Main Street, Downtown',
    Latitude: 40.7128,
    Longitude: -74.006,
    IsActive: true,
    CreatedAt: '2024-01-01T00:00:00Z',
  },
  {
    Id: 'loc-002',
    Name: 'Riverside Recreation Center',
    Address: '456 River Road, Riverside',
    Latitude: 40.7282,
    Longitude: -73.9942,
    IsActive: true,
    CreatedAt: '2024-01-01T00:00:00Z',
  },
  {
    Id: 'loc-003',
    Name: 'Northside Community Center',
    Address: '789 North Avenue, Northside',
    Latitude: 40.7589,
    Longitude: -73.9851,
    IsActive: true,
    CreatedAt: '2024-01-01T00:00:00Z',
  },
  {
    Id: 'loc-004',
    Name: 'Eastside Youth Center',
    Address: '321 East Boulevard, Eastside',
    Latitude: 40.7484,
    Longitude: -73.9857,
    IsActive: true,
    CreatedAt: '2024-01-01T00:00:00Z',
  },
  {
    Id: 'loc-005',
    Name: 'Westbrook Senior Center',
    Address: '654 West Street, Westbrook',
    Latitude: 40.7614,
    Longitude: -73.9776,
    IsActive: false,
    CreatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// SHIFTS
// ============================================

export const shifts: Shift[] = [
  {
    Id: 'shift-001',
    WorkerId: 'user-001',
    LocationId: 'loc-001',
    Status: 'Active',
    StartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    EstimatedEndTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    CheckInIntervalMinutes: 15,
    Notes: 'Evening event setup and monitoring',
    CreatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 'shift-002',
    WorkerId: 'user-002',
    LocationId: 'loc-002',
    Status: 'Completed',
    StartTime: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    EndTime: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    EstimatedEndTime: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    CheckInIntervalMinutes: 15,
    CreatedAt: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 'shift-003',
    WorkerId: 'user-003',
    LocationId: 'loc-003',
    Status: 'Completed',
    StartTime: new Date(todayStart.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    EndTime: new Date(todayStart.getTime() - 48 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    EstimatedEndTime: new Date(todayStart.getTime() - 48 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    CheckInIntervalMinutes: 15,
    CreatedAt: new Date(todayStart.getTime() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 'shift-004',
    WorkerId: 'user-004',
    LocationId: 'loc-004',
    Status: 'Active',
    StartTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    EstimatedEndTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
    CheckInIntervalMinutes: 15,
    CreatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 'shift-005',
    WorkerId: 'user-001',
    LocationId: 'loc-002',
    Status: 'Completed',
    StartTime: new Date(todayStart.getTime() - 72 * 60 * 60 * 1000).toISOString(),
    EndTime: new Date(todayStart.getTime() - 72 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    EstimatedEndTime: new Date(todayStart.getTime() - 72 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    CheckInIntervalMinutes: 15,
    CreatedAt: new Date(todayStart.getTime() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// CHECK-INS
// ============================================

export const checkIns: CheckIn[] = [
  {
    Id: 'checkin-001',
    ShiftId: 'shift-001',
    WorkerId: 'user-001',
    ScheduledTime: new Date(now.getTime() - 105 * 60 * 1000).toISOString(),
    ResponseTime: new Date(now.getTime() - 104 * 60 * 1000).toISOString(),
    Status: 'Confirmed',
    ResponseSeconds: 45,
  },
  {
    Id: 'checkin-002',
    ShiftId: 'shift-001',
    WorkerId: 'user-001',
    ScheduledTime: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
    ResponseTime: new Date(now.getTime() - 89 * 60 * 1000).toISOString(),
    Status: 'Confirmed',
    ResponseSeconds: 32,
  },
  {
    Id: 'checkin-003',
    ShiftId: 'shift-001',
    WorkerId: 'user-001',
    ScheduledTime: new Date(now.getTime() - 75 * 60 * 1000).toISOString(),
    ResponseTime: new Date(now.getTime() - 74 * 60 * 1000).toISOString(),
    Status: 'Confirmed',
    ResponseSeconds: 28,
  },
  {
    Id: 'checkin-004',
    ShiftId: 'shift-001',
    WorkerId: 'user-001',
    ScheduledTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    Status: 'Missed',
  },
  {
    Id: 'checkin-005',
    ShiftId: 'shift-001',
    WorkerId: 'user-001',
    ScheduledTime: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    ResponseTime: new Date(now.getTime() - 44 * 60 * 1000).toISOString(),
    Status: 'Confirmed',
    ResponseSeconds: 55,
  },
  {
    Id: 'checkin-006',
    ShiftId: 'shift-001',
    WorkerId: 'user-001',
    ScheduledTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    ResponseTime: new Date(now.getTime() - 29 * 60 * 1000).toISOString(),
    Status: 'Confirmed',
    ResponseSeconds: 22,
  },
  {
    Id: 'checkin-007',
    ShiftId: 'shift-001',
    WorkerId: 'user-001',
    ScheduledTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    ResponseTime: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
    Status: 'Confirmed',
    ResponseSeconds: 18,
  },
  {
    Id: 'checkin-008',
    ShiftId: 'shift-002',
    WorkerId: 'user-002',
    ScheduledTime: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    ResponseTime: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000 + 15 * 60 * 1000 + 30000).toISOString(),
    Status: 'Confirmed',
    ResponseSeconds: 30,
  },
];

// ============================================
// ALERTS
// ============================================

export const alerts: Alert[] = [
  {
    Id: 'alert-001',
    ShiftId: 'shift-001',
    WorkerId: 'user-001',
    BackupContactId: 'user-006',
    Type: 'MissedCheckIn',
    Status: 'Resolved',
    Severity: 'High',
    Message: 'Sarah Johnson missed check-in at Downtown Community Hall',
    CreatedAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    AcknowledgedAt: new Date(now.getTime() - 58 * 60 * 1000).toISOString(),
    ResolvedAt: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
    ResolvedBy: 'user-006',
  },
  {
    Id: 'alert-002',
    ShiftId: 'shift-004',
    WorkerId: 'user-004',
    BackupContactId: 'user-007',
    Type: 'MissedCheckIn',
    Status: 'Active',
    Severity: 'Critical',
    Message: 'James Brown missed check-in at Eastside Youth Center',
    CreatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
  },
  {
    Id: 'alert-003',
    ShiftId: 'shift-003',
    WorkerId: 'user-003',
    Type: 'SystemAlert',
    Status: 'Resolved',
    Severity: 'Low',
    Message: 'GPS signal temporarily lost during shift',
    CreatedAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
    ResolvedAt: new Date(now.getTime() - 71 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications: Notification[] = [
  {
    Id: 'notif-001',
    UserId: 'user-001',
    Type: 'CheckIn',
    Title: 'Check-in Reminder',
    Message: 'Your next check-in is due in 5 minutes',
    IsRead: false,
    CreatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
  },
  {
    Id: 'notif-002',
    UserId: 'user-007',
    Type: 'Alert',
    Title: 'Worker Alert',
    Message: 'James Brown has missed a check-in at Eastside Youth Center',
    IsRead: false,
    CreatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    ActionUrl: '/backup',
  },
  {
    Id: 'notif-003',
    UserId: 'user-001',
    Type: 'Shift',
    Title: 'Shift Started',
    Message: 'Your shift at Downtown Community Hall has started',
    IsRead: true,
    CreatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    Id: 'notif-004',
    UserId: 'user-008',
    Type: 'System',
    Title: 'Weekly Report Ready',
    Message: 'The weekly compliance report is now available',
    IsRead: false,
    CreatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    ActionUrl: '/reports',
  },
];

// ============================================
// TEAMS
// ============================================

export const teams: Team[] = [
  {
    Id: 'team-001',
    Name: 'Downtown Team',
    ManagerId: 'user-008',
    MemberIds: ['user-001', 'user-002', 'user-006'],
    CreatedAt: '2024-01-01T00:00:00Z',
  },
  {
    Id: 'team-002',
    Name: 'Community Outreach',
    ManagerId: 'user-009',
    MemberIds: ['user-003', 'user-004', 'user-007'],
    CreatedAt: '2024-01-01T00:00:00Z',
  },
];

// ============================================
// SYSTEM SETTINGS
// ============================================

export const systemSettings: SystemSettings = {
  Id: 'settings-001',
  CheckInIntervalMinutes: 15,
  ResponseTimeoutSeconds: 60,
  EscalationDelayMinutes: 5,
  EnableSmsNotifications: true,
  EnableEmailNotifications: true,
  EnablePushNotifications: true,
  UpdatedAt: '2024-01-01T00:00:00Z',
};

// ============================================
// REPORTS DATA
// ============================================

export const timeTrackingRecords: TimeTrackingRecord[] = [
  {
    Id: 'tt-001',
    WorkerId: 'user-001',
    WorkerName: 'Sarah Johnson',
    Date: '2024-02-01',
    StartTime: '08:00',
    EndTime: '14:00',
    TotalHours: 6,
    Location: 'Downtown Community Hall',
    CheckInsCompleted: 24,
    CheckInsMissed: 0,
  },
  {
    Id: 'tt-002',
    WorkerId: 'user-002',
    WorkerName: 'Mike Chen',
    Date: '2024-02-01',
    StartTime: '09:00',
    EndTime: '15:00',
    TotalHours: 6,
    Location: 'Riverside Recreation Center',
    CheckInsCompleted: 23,
    CheckInsMissed: 1,
  },
  {
    Id: 'tt-003',
    WorkerId: 'user-003',
    WorkerName: 'Emma Wilson',
    Date: '2024-02-01',
    StartTime: '10:00',
    EndTime: '15:00',
    TotalHours: 5,
    Location: 'Northside Community Center',
    CheckInsCompleted: 20,
    CheckInsMissed: 0,
  },
  {
    Id: 'tt-004',
    WorkerId: 'user-001',
    WorkerName: 'Sarah Johnson',
    Date: '2024-02-02',
    StartTime: '08:30',
    EndTime: '12:30',
    TotalHours: 4,
    Location: 'Riverside Recreation Center',
    CheckInsCompleted: 16,
    CheckInsMissed: 0,
  },
  {
    Id: 'tt-005',
    WorkerId: 'user-004',
    WorkerName: 'James Brown',
    Date: '2024-02-02',
    StartTime: '14:00',
    EndTime: '20:00',
    TotalHours: 6,
    Location: 'Eastside Youth Center',
    CheckInsCompleted: 22,
    CheckInsMissed: 2,
  },
];

export const complianceRecords: ComplianceRecord[] = [
  {
    Id: 'cr-001',
    WorkerId: 'user-001',
    WorkerName: 'Sarah Johnson',
    Period: 'This Week',
    TotalCheckIns: 48,
    CompletedCheckIns: 47,
    MissedCheckIns: 1,
    ComplianceRate: 97.9,
    AverageResponseTime: 28,
  },
  {
    Id: 'cr-002',
    WorkerId: 'user-002',
    WorkerName: 'Mike Chen',
    Period: 'This Week',
    TotalCheckIns: 36,
    CompletedCheckIns: 35,
    MissedCheckIns: 1,
    ComplianceRate: 97.2,
    AverageResponseTime: 32,
  },
  {
    Id: 'cr-003',
    WorkerId: 'user-003',
    WorkerName: 'Emma Wilson',
    Period: 'This Week',
    TotalCheckIns: 40,
    CompletedCheckIns: 40,
    MissedCheckIns: 0,
    ComplianceRate: 100,
    AverageResponseTime: 25,
  },
  {
    Id: 'cr-004',
    WorkerId: 'user-004',
    WorkerName: 'James Brown',
    Period: 'This Week',
    TotalCheckIns: 44,
    CompletedCheckIns: 41,
    MissedCheckIns: 3,
    ComplianceRate: 93.2,
    AverageResponseTime: 42,
  },
];

// ============================================
// CHART DATA
// ============================================

export const weeklyHoursData: ChartDataPoint[] = [
  { Name: 'Mon', Value: 24, Hours: 24 },
  { Name: 'Tue', Value: 28, Hours: 28 },
  { Name: 'Wed', Value: 22, Hours: 22 },
  { Name: 'Thu', Value: 32, Hours: 32 },
  { Name: 'Fri', Value: 26, Hours: 26 },
  { Name: 'Sat', Value: 18, Hours: 18 },
  { Name: 'Sun', Value: 12, Hours: 12 },
];

export const complianceTrendData: ChartDataPoint[] = [
  { Name: 'Week 1', Value: 92, Compliance: 92 },
  { Name: 'Week 2', Value: 94, Compliance: 94 },
  { Name: 'Week 3', Value: 91, Compliance: 91 },
  { Name: 'Week 4', Value: 96, Compliance: 96 },
  { Name: 'Week 5', Value: 95, Compliance: 95 },
  { Name: 'Week 6', Value: 97, Compliance: 97 },
];

export const alertsByTypeData: ChartDataPoint[] = [
  { Name: 'Missed Check-in', Value: 12 },
  { Name: 'Emergency', Value: 2 },
  { Name: 'System Alert', Value: 5 },
];

export const activeWorkersData: ChartDataPoint[] = [
  { Name: '6 AM', Value: 0, Workers: 0 },
  { Name: '8 AM', Value: 3, Workers: 3 },
  { Name: '10 AM', Value: 5, Workers: 5 },
  { Name: '12 PM', Value: 4, Workers: 4 },
  { Name: '2 PM', Value: 6, Workers: 6 },
  { Name: '4 PM', Value: 5, Workers: 5 },
  { Name: '6 PM', Value: 3, Workers: 3 },
  { Name: '8 PM', Value: 2, Workers: 2 },
];

// ============================================
// DATA STORE CLASS
// ============================================

/**
 * DataStore class provides a centralized access point to all mock data
 * This class can be extended or replaced with actual database connections
 */
class DataStore {
  public users: User[] = users;
  public locations: Location[] = locations;
  public shifts: Shift[] = shifts;
  public checkIns: CheckIn[] = checkIns;
  public alerts: Alert[] = alerts;
  public notifications: Notification[] = notifications;
  public teams: Team[] = teams;
  public systemSettings: SystemSettings = systemSettings;
  public timeTrackingRecords: TimeTrackingRecord[] = timeTrackingRecords;
  public complianceRecords: ComplianceRecord[] = complianceRecords;
  public weeklyHoursData: ChartDataPoint[] = weeklyHoursData;
  public complianceTrendData: ChartDataPoint[] = complianceTrendData;
  public alertsByTypeData: ChartDataPoint[] = alertsByTypeData;
  public activeWorkersData: ChartDataPoint[] = activeWorkersData;
  public passwordResetTokens: PasswordResetToken[] = [];

  /**
   * Reset all data to initial state (useful for testing)
   */
  public reset(): void {
    this.users = [...users];
    this.locations = [...locations];
    this.shifts = [...shifts];
    this.checkIns = [...checkIns];
    this.alerts = [...alerts];
    this.notifications = [...notifications];
    this.teams = [...teams];
    this.systemSettings = { ...systemSettings };
    this.timeTrackingRecords = [...timeTrackingRecords];
    this.complianceRecords = [...complianceRecords];
    this.passwordResetTokens = [];
  }
}

// Export singleton instance
export const dataStore = new DataStore();
