/**
 * Alert Service
 * Handles alert business logic
 */

import { 
  alertRepository, 
  userRepository, 
  notificationRepository 
} from '../repositories';
import {
  Alert,
  CreateAlertDto,
  UpdateAlertDto,
  AlertFilter,
  PaginatedResponse,
} from '../types';

export class AlertService {
  
  async findAll(filter?: AlertFilter): Promise<PaginatedResponse<Alert>> {
    return alertRepository.findAll(filter);
  }

  async findById(id: string): Promise<Alert | null> {
    return alertRepository.findById(id);
  }

  async create(data: CreateAlertDto): Promise<Alert> {
    // Validate worker exists
    const worker = await userRepository.findById(data.WorkerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    // Validate backup contact if provided
    if (data.BackupContactId) {
      const backupContact = await userRepository.findById(data.BackupContactId);
      if (!backupContact) {
        throw new Error('Backup contact not found');
      }
    }

    const alert = await alertRepository.create(data);

    // Create notifications
    await this.createAlertNotifications(alert);

    return alert;
  }

  async update(id: string, data: UpdateAlertDto): Promise<Alert | null> {
    const exists = await alertRepository.exists(id);
    if (!exists) {
      return null;
    }

    return alertRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return alertRepository.delete(id);
  }

  async acknowledge(id: string, acknowledgedBy: string): Promise<Alert | null> {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      return null;
    }

    if (alert.Status !== 'Active') {
      throw new Error('Alert is not active');
    }

    const updatedAlert = await alertRepository.acknowledgeAlert(id, acknowledgedBy);

    if (updatedAlert) {
      // Create notification for acknowledgment
      await notificationRepository.create({
        UserId: alert.WorkerId,
        Type: 'Alert',
        Title: 'Alert Acknowledged',
        Message: 'Your alert has been acknowledged by your backup contact',
      });
    }

    return updatedAlert;
  }

  async resolve(id: string, resolvedBy: string): Promise<Alert | null> {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      return null;
    }

    if (alert.Status === 'Resolved') {
      throw new Error('Alert is already resolved');
    }

    const updatedAlert = await alertRepository.resolveAlert(id, resolvedBy);

    if (updatedAlert) {
      // Create notification for resolution
      await notificationRepository.create({
        UserId: alert.WorkerId,
        Type: 'Alert',
        Title: 'Alert Resolved',
        Message: 'Your alert has been resolved',
      });

      // Notify backup contact if assigned
      if (alert.BackupContactId) {
        await notificationRepository.create({
          UserId: alert.BackupContactId,
          Type: 'Alert',
          Title: 'Alert Resolved',
          Message: 'The worker alert has been resolved',
        });
      }
    }

    return updatedAlert;
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return alertRepository.findActiveAlerts();
  }

  async getAlertsByWorkerId(workerId: string): Promise<Alert[]> {
    return alertRepository.findByWorkerId(workerId);
  }

  async getAlertsByBackupContactId(backupContactId: string): Promise<Alert[]> {
    return alertRepository.findByBackupContactId(backupContactId);
  }

  async countPendingAlerts(): Promise<number> {
    return alertRepository.countPendingAlerts();
  }

  async count(filter?: AlertFilter): Promise<number> {
    return alertRepository.count(filter);
  }

  async createEmergencyAlert(workerId: string, shiftId: string, message?: string): Promise<Alert> {
    const worker = await userRepository.findById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    const backupContactId = worker.AssignedBackupContactIds?.[0];

    return this.create({
      ShiftId: shiftId,
      WorkerId: workerId,
      BackupContactId: backupContactId,
      Type: 'Emergency',
      Severity: 'Critical',
      Message: message || `Emergency alert from ${worker.FirstName} ${worker.LastName}`,
    });
  }

  async getAlertWithDetails(id: string): Promise<{
    alert: Alert;
    worker: { Id: string; FirstName: string; LastName: string; Phone: string } | null;
    backupContact: { Id: string; FirstName: string; LastName: string; Phone: string } | null;
  } | null> {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      return null;
    }

    const worker = await userRepository.findById(alert.WorkerId);
    const backupContact = alert.BackupContactId 
      ? await userRepository.findById(alert.BackupContactId)
      : null;

    return {
      alert,
      worker: worker ? {
        Id: worker.Id,
        FirstName: worker.FirstName,
        LastName: worker.LastName,
        Phone: worker.Phone,
      } : null,
      backupContact: backupContact ? {
        Id: backupContact.Id,
        FirstName: backupContact.FirstName,
        LastName: backupContact.LastName,
        Phone: backupContact.Phone,
      } : null,
    };
  }

  private async createAlertNotifications(alert: Alert): Promise<void> {
    // Notify worker
    await notificationRepository.create({
      UserId: alert.WorkerId,
      Type: 'Alert',
      Title: this.getAlertTitle(alert.Type),
      Message: alert.Message,
    });

    // Notify backup contact if assigned
    if (alert.BackupContactId) {
      const worker = await userRepository.findById(alert.WorkerId);
      await notificationRepository.create({
        UserId: alert.BackupContactId,
        Type: 'Alert',
        Title: 'Worker Alert',
        Message: `${worker?.FirstName} ${worker?.LastName}: ${alert.Message}`,
        ActionUrl: '/backup',
      });
    }
  }

  private getAlertTitle(type: Alert['Type']): string {
    switch (type) {
      case 'MissedCheckIn':
        return 'Missed Check-In Alert';
      case 'Emergency':
        return 'Emergency Alert';
      case 'SystemAlert':
        return 'System Alert';
      default:
        return 'Alert';
    }
  }
}

// Export singleton instance
export const alertService = new AlertService();
