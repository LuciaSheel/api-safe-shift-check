/**
 * Core types for the Safe Shift Check API
 * All types use PascalCase for field names to match frontend conventions
 */

// ============================================
// ENUMS
// ============================================

export type UserRole = 'Cleaner' | 'Booker' | 'Director' | 'Administrator';

export type ShiftStatus = 'Active' | 'Completed' | 'Cancelled';

export type CheckInStatus = 'Pending' | 'Confirmed' | 'Missed';

export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertType = 'MissedCheckIn' | 'Emergency' | 'SystemAlert';

export type NotificationType = 'Alert' | 'CheckIn' | 'System' | 'Shift';

// ============================================
// ENTITY INTERFACES
// ============================================

export interface User {
  Id: string;
  Email: string;
  Password?: string; // Only used internally, never returned to client
  FirstName: string;
  LastName: string;
  Role: UserRole;
  Phone: string;
  Avatar?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt?: string;
  AssignedBackupContactIds?: string[];
  AssignedWorkerIds?: string[];
  TeamId?: string;
  TokenVersion?: number; // Incremented on logout/password change to invalidate tokens
}

export interface Location {
  Id: string;
  Name: string;
  Address: string;
  Latitude: number;
  Longitude: number;
  IsActive: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface Shift {
  Id: string;
  WorkerId: string;
  LocationId: string;
  Status: ShiftStatus;
  StartTime: string;
  EndTime?: string;
  EstimatedEndTime: string;
  Notes?: string;
  CheckInIntervalMinutes: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface CheckIn {
  Id: string;
  ShiftId: string;
  WorkerId: string;
  ScheduledTime: string;
  ResponseTime?: string;
  Status: CheckInStatus;
  ResponseSeconds?: number;
  CreatedAt?: string;
}

export interface Alert {
  Id: string;
  ShiftId: string;
  WorkerId: string;
  BackupContactId?: string;
  Type: AlertType;
  Status: AlertStatus;
  Severity: AlertSeverity;
  Message: string;
  CreatedAt: string;
  AcknowledgedAt?: string;
  AcknowledgedBy?: string;
  ResolvedAt?: string;
  ResolvedBy?: string;
  // Escalation tracking
  EscalatedToIndex: number; // Index of backup contact notified (0 = first, 1 = second, etc.)
  LastEscalatedAt?: string; // When the last escalation notification was sent
}

export interface Notification {
  Id: string;
  UserId: string;
  Type: NotificationType;
  Title: string;
  Message: string;
  IsRead: boolean;
  CreatedAt: string;
  ActionUrl?: string;
}

export interface Team {
  Id: string;
  Name: string;
  ManagerId: string;
  MemberIds: string[];
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface SystemSettings {
  Id: string;
  CheckInIntervalMinutes: number;
  ResponseTimeoutSeconds: number;
  EscalationDelayMinutes: number;
  EnableSmsNotifications: boolean;
  EnableEmailNotifications: boolean;
  EnablePushNotifications: boolean;
  UpdatedAt?: string;
  UpdatedBy?: string;
}

// ============================================
// ANALYTICS & REPORTING INTERFACES
// ============================================

export interface DashboardMetrics {
  TotalWorkers: number;
  ActiveWorkers: number;
  TotalShiftsToday: number;
  PendingAlerts: number;
  ComplianceRate: number;
  AverageResponseTime: number;
}

export interface TimeTrackingRecord {
  Id?: string;
  WorkerId: string;
  WorkerName: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  TotalHours: number;
  Location: string;
  CheckInsCompleted: number;
  CheckInsMissed: number;
}

export interface ComplianceRecord {
  Id?: string;
  WorkerId: string;
  WorkerName: string;
  Period: string;
  TotalCheckIns: number;
  CompletedCheckIns: number;
  MissedCheckIns: number;
  ComplianceRate: number;
  AverageResponseTime: number;
}

export interface ChartDataPoint {
  Name: string;
  Value: number;
  [key: string]: string | number;
}

// ============================================
// AUTH INTERFACES
// ============================================

export interface PasswordResetToken {
  Id: string;
  UserId: string;
  Token: string;
  Email: string;
  ExpiresAt: string;
  UsedAt?: string;
  CreatedAt: string;
}

export interface AuthState {
  User: User | null;
  IsAuthenticated: boolean;
  IsLoading: boolean;
}

export interface LoginCredentials {
  Email: string;
  Password: string;
}

export interface AuthResponse {
  User: Omit<User, 'Password'>;
  Token: string;
  ExpiresAt: string;
}

export interface TokenPayload {
  UserId: string;
  Email: string;
  Role: UserRole;
  TokenVersion: number;
  iat: number;
  exp: number;
}

// ============================================
// REQUEST/RESPONSE INTERFACES
// ============================================

export interface PaginatedRequest {
  Page?: number;
  PageSize?: number;
  SortBy?: string;
  SortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  Data: T[];
  Total: number;
  Page: number;
  PageSize: number;
  TotalPages: number;
}

export interface ApiResponse<T> {
  Success: boolean;
  Data?: T;
  Message?: string;
  Errors?: string[];
}

// ============================================
// CREATE/UPDATE DTOs
// ============================================

export interface CreateUserDto {
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string;
  Role: UserRole;
  Phone: string;
  Avatar?: string;
  TeamId?: string;
  AssignedBackupContactIds?: string[];
  AssignedWorkerIds?: string[];
}

export interface UpdateUserDto {
  Email?: string;
  FirstName?: string;
  LastName?: string;
  Phone?: string;
  Avatar?: string;
  IsActive?: boolean;
  TeamId?: string;
  AssignedBackupContactIds?: string[];
  AssignedWorkerIds?: string[];
}

export interface CreateLocationDto {
  Name: string;
  Address: string;
  Latitude: number;
  Longitude: number;
}

export interface UpdateLocationDto {
  Name?: string;
  Address?: string;
  Latitude?: number;
  Longitude?: number;
  IsActive?: boolean;
}

export interface CreateShiftDto {
  WorkerId: string;
  LocationId: string;
  EstimatedEndTime: string;
  Notes?: string;
  CheckInIntervalMinutes?: number;
}

export interface UpdateShiftDto {
  Status?: ShiftStatus;
  EndTime?: string;
  EstimatedEndTime?: string;
  Notes?: string;
  CheckInIntervalMinutes?: number;
}

export interface CreateCheckInDto {
  ShiftId: string;
  WorkerId: string;
  ScheduledTime: string;
}

export interface UpdateCheckInDto {
  ResponseTime?: string;
  Status?: CheckInStatus;
  ResponseSeconds?: number;
}

export interface CreateAlertDto {
  ShiftId: string;
  WorkerId: string;
  BackupContactId?: string;
  Type: AlertType;
  Severity: AlertSeverity;
  Message: string;
}

export interface UpdateAlertDto {
  Status?: AlertStatus;
  AcknowledgedAt?: string;
  AcknowledgedBy?: string;
  ResolvedAt?: string;
  ResolvedBy?: string;
  EscalatedToIndex?: number;
  LastEscalatedAt?: string;
}

export interface CreateNotificationDto {
  UserId: string;
  Type: NotificationType;
  Title: string;
  Message: string;
  ActionUrl?: string;
}

export interface UpdateNotificationDto {
  IsRead?: boolean;
}

export interface CreateTeamDto {
  Name: string;
  ManagerId: string;
  MemberIds?: string[];
}

export interface UpdateTeamDto {
  Name?: string;
  ManagerId?: string;
  MemberIds?: string[];
}

export interface UpdateSystemSettingsDto {
  CheckInIntervalMinutes?: number;
  ResponseTimeoutSeconds?: number;
  EscalationDelayMinutes?: number;
  EnableSmsNotifications?: boolean;
  EnableEmailNotifications?: boolean;
  EnablePushNotifications?: boolean;
}

// ============================================
// FILTER INTERFACES
// ============================================

export interface UserFilter extends PaginatedRequest {
  Role?: UserRole;
  IsActive?: boolean;
  TeamId?: string;
  Search?: string;
}

export interface ShiftFilter extends PaginatedRequest {
  WorkerId?: string;
  LocationId?: string;
  Status?: ShiftStatus;
  StartDate?: string;
  EndDate?: string;
}

export interface CheckInFilter extends PaginatedRequest {
  ShiftId?: string;
  WorkerId?: string;
  Status?: CheckInStatus;
  StartDate?: string;
  EndDate?: string;
}

export interface AlertFilter extends PaginatedRequest {
  WorkerId?: string;
  BackupContactId?: string;
  Status?: AlertStatus;
  Severity?: AlertSeverity;
  Type?: AlertType;
  StartDate?: string;
  EndDate?: string;
}

export interface NotificationFilter extends PaginatedRequest {
  UserId?: string;
  Type?: NotificationType;
  IsRead?: boolean;
}

export interface ReportFilter {
  StartDate?: string;
  EndDate?: string;
  WorkerId?: string;
  LocationId?: string;
  TeamId?: string;
}
