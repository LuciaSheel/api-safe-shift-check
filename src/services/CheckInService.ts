/**
 * CheckIn Service
 * Handles check-in business logic
 */

import { 
  checkInRepository, 
  shiftRepository, 
  alertRepository,
  notificationRepository,
  userRepository,
  systemSettingsRepository
} from '../repositories';
import { smsService } from './SmsService';
import {
  CheckIn,
  CreateCheckInDto,
  UpdateCheckInDto,
  CheckInFilter,
  PaginatedResponse,
} from '../types';

export class CheckInService {
  
  async findAll(filter?: CheckInFilter): Promise<PaginatedResponse<CheckIn>> {
    return checkInRepository.findAll(filter);
  }

  async findById(id: string): Promise<CheckIn | null> {
    return checkInRepository.findById(id);
  }

  async create(data: CreateCheckInDto): Promise<CheckIn> {
    // Validate shift exists and is active
    const shift = await shiftRepository.findById(data.ShiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }
    if (shift.Status !== 'Active') {
      throw new Error('Shift is not active');
    }

    // Validate worker matches shift
    if (shift.WorkerId !== data.WorkerId) {
      throw new Error('Worker does not match shift');
    }

    return checkInRepository.create(data);
  }

  async update(id: string, data: UpdateCheckInDto): Promise<CheckIn | null> {
    const exists = await checkInRepository.exists(id);
    if (!exists) {
      return null;
    }

    return checkInRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return checkInRepository.delete(id);
  }

  async confirmCheckIn(id: string): Promise<CheckIn | null> {
    const checkIn = await checkInRepository.findById(id);
    if (!checkIn) {
      return null;
    }

    if (checkIn.Status !== 'Pending') {
      throw new Error('Check-in is not pending');
    }

    // Calculate response time
    const scheduledTime = new Date(checkIn.ScheduledTime).getTime();
    const responseTime = Date.now();
    const responseSeconds = Math.round((responseTime - scheduledTime) / 1000);

    return checkInRepository.confirmCheckIn(id, Math.max(0, responseSeconds));
  }

  async markAsMissed(id: string): Promise<CheckIn | null> {
    const checkIn = await checkInRepository.findById(id);
    if (!checkIn) {
      return null;
    }

    if (checkIn.Status !== 'Pending') {
      throw new Error('Check-in is not pending');
    }

    // Mark check-in as missed
    const missedCheckIn = await checkInRepository.markAsMissed(id);

    if (missedCheckIn) {
      // Create alert for missed check-in
      await this.createMissedCheckInAlert(missedCheckIn);
    }

    return missedCheckIn;
  }

  async scheduleCheckIn(shiftId: string): Promise<CheckIn> {
    const shift = await shiftRepository.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    const settings = await systemSettingsRepository.get();
    const intervalMinutes = shift.CheckInIntervalMinutes || settings.CheckInIntervalMinutes;
    
    const scheduledTime = new Date(Date.now() + intervalMinutes * 60 * 1000);

    return checkInRepository.create({
      ShiftId: shiftId,
      WorkerId: shift.WorkerId,
      ScheduledTime: scheduledTime.toISOString(),
    });
  }

  /**
   * Create and immediately confirm a check-in for a shift
   * Used when worker clicks "I'm OK" button
   */
  async confirmCheckInForShift(shiftId: string): Promise<CheckIn> {
    const shift = await shiftRepository.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.Status !== 'Active') {
      throw new Error('Shift is not active');
    }

    const now = new Date();

    // Create check-in with current time as scheduled time
    const checkIn = await checkInRepository.create({
      ShiftId: shiftId,
      WorkerId: shift.WorkerId,
      ScheduledTime: now.toISOString(),
    });

    // Immediately confirm it with 0 response seconds (instant confirmation)
    return checkInRepository.confirmCheckIn(checkIn.Id, 0);
  }

  /**
   * Create and mark a check-in as missed for a shift
   * Used when timer runs out without worker response
   */
  async markCheckInAsMissedForShift(shiftId: string): Promise<CheckIn> {
    const shift = await shiftRepository.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.Status !== 'Active') {
      throw new Error('Shift is not active');
    }

    const now = new Date();

    // Create check-in with current time as scheduled time
    const checkIn = await checkInRepository.create({
      ShiftId: shiftId,
      WorkerId: shift.WorkerId,
      ScheduledTime: now.toISOString(),
    });

    // Mark it as missed
    const missedCheckIn = await checkInRepository.markAsMissed(checkIn.Id);

    if (missedCheckIn) {
      // Create alert for missed check-in
      await this.createMissedCheckInAlert(missedCheckIn);
    }

    return missedCheckIn!;
  }

  async getCheckInsByShiftId(shiftId: string): Promise<CheckIn[]> {
    return checkInRepository.findByShiftId(shiftId);
  }

  async getCheckInsByWorkerId(workerId: string): Promise<CheckIn[]> {
    return checkInRepository.findByWorkerId(workerId);
  }

  async getPendingCheckIns(): Promise<CheckIn[]> {
    return checkInRepository.findPendingCheckIns();
  }

  async getAverageResponseTime(workerId?: string): Promise<number> {
    return checkInRepository.getAverageResponseTime(workerId);
  }

  async count(filter?: CheckInFilter): Promise<number> {
    return checkInRepository.count(filter);
  }

  async processOverdueCheckIns(): Promise<number> {
    const settings = await systemSettingsRepository.get();
    const timeoutMs = settings.ResponseTimeoutSeconds * 1000;
    const now = Date.now();

    const pendingCheckIns = await checkInRepository.findPendingCheckIns();
    let processedCount = 0;

    for (const checkIn of pendingCheckIns) {
      const scheduledTime = new Date(checkIn.ScheduledTime).getTime();
      if (now - scheduledTime > timeoutMs) {
        await this.markAsMissed(checkIn.Id);
        processedCount++;
      }
    }

    return processedCount;
  }

  private async createMissedCheckInAlert(checkIn: CheckIn): Promise<void> {
    const shift = await shiftRepository.findById(checkIn.ShiftId);
    if (!shift) return;

    const worker = await userRepository.findById(checkIn.WorkerId);
    if (!worker) return;

    const workerName = `${worker.FirstName} ${worker.LastName}`;

    // Get primary backup contact for alert record
    const backupContactId = worker.AssignedBackupContactIds?.[0];

    // Create alert
    await alertRepository.create({
      ShiftId: checkIn.ShiftId,
      WorkerId: checkIn.WorkerId,
      BackupContactId: backupContactId,
      Type: 'MissedCheckIn',
      Severity: 'High',
      Message: `${workerName} missed a check-in`,
    });

    // Create notification for worker
    await notificationRepository.create({
      UserId: checkIn.WorkerId,
      Type: 'CheckIn',
      Title: 'Missed Check-In',
      Message: 'You missed a scheduled check-in. Please respond immediately.',
    });

    // Create notification and SMS for ALL assigned backup contacts
    if (worker.AssignedBackupContactIds?.length) {
      // Fetch all backup contact details
      const backupContacts = await Promise.all(
        worker.AssignedBackupContactIds.map(id => userRepository.findById(id))
      );

      // In-app notifications
      const notificationPromises = worker.AssignedBackupContactIds.map(bcId =>
        notificationRepository.create({
          UserId: bcId,
          Type: 'Alert',
          Title: 'Worker Alert',
          Message: `${workerName} has missed a check-in`,
          ActionUrl: '/backup',
        })
      );
      await Promise.all(notificationPromises);

      // SMS notifications
      const smsPromises = backupContacts
        .filter((bc): bc is NonNullable<typeof bc> => bc !== null && !!bc.Phone)
        .map(bc => smsService.sendMissedCheckInAlert(bc.Phone, workerName));
      await Promise.all(smsPromises);
    }
  }
}

// Export singleton instance
export const checkInService = new CheckInService();
