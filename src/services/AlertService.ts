/**
 * Alert Service
 * Handles alert business logic
 */

import { 
  alertRepository, 
  userRepository, 
  notificationRepository 
} from '../repositories';
import { smsService } from './SmsService';
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
      const worker = await userRepository.findById(alert.WorkerId);
      const acknowledger = await userRepository.findById(acknowledgedBy);
      const acknowledgerName = acknowledger 
        ? `${acknowledger.FirstName} ${acknowledger.LastName}` 
        : 'a backup contact';
      
      // Create notification for worker
      await notificationRepository.create({
        UserId: alert.WorkerId,
        Type: 'Alert',
        Title: 'Alert Acknowledged',
        Message: `Your alert has been acknowledged by ${acknowledgerName}`,
      });

      // Notify all other backup contacts that someone responded
      if (worker?.AssignedBackupContactIds?.length) {
        const otherBackupContacts = worker.AssignedBackupContactIds.filter(
          id => id !== acknowledgedBy
        );
        const notificationPromises = otherBackupContacts.map(backupContactId =>
          notificationRepository.create({
            UserId: backupContactId,
            Type: 'Alert',
            Title: 'Alert Acknowledged',
            Message: `Alert for ${worker.FirstName} ${worker.LastName} was acknowledged by ${acknowledgerName}`,
          })
        );
        await Promise.all(notificationPromises);
      }
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
      const worker = await userRepository.findById(alert.WorkerId);
      
      // Create notification for resolution to worker
      await notificationRepository.create({
        UserId: alert.WorkerId,
        Type: 'Alert',
        Title: 'Alert Resolved',
        Message: 'Your alert has been resolved',
      });

      // Notify all assigned backup contacts
      if (worker?.AssignedBackupContactIds?.length) {
        const notificationPromises = worker.AssignedBackupContactIds.map(backupContactId =>
          notificationRepository.create({
            UserId: backupContactId,
            Type: 'Alert',
            Title: 'Alert Resolved',
            Message: `Alert for ${worker.FirstName} ${worker.LastName} has been resolved`,
          })
        );
        await Promise.all(notificationPromises);
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

  async getAlertsForBackupContact(backupContactId: string): Promise<Alert[]> {
    // Get workers assigned to this backup contact
    const workers = await userRepository.findWorkersByBackupContactId(backupContactId);
    const workerIds = workers.map(w => w.Id);
    
    if (workerIds.length === 0) {
      return [];
    }

    // Get all alerts and filter by worker IDs
    const allAlerts = await alertRepository.findAll({} as any);
    return allAlerts.Data.filter(alert => workerIds.includes(alert.WorkerId));
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
    const worker = await userRepository.findById(alert.WorkerId);
    const workerName = worker ? `${worker.FirstName} ${worker.LastName}` : 'Unknown Worker';
    
    // Notify worker (in-app)
    await notificationRepository.create({
      UserId: alert.WorkerId,
      Type: 'Alert',
      Title: this.getAlertTitle(alert.Type),
      Message: alert.Message,
    });

    // Notify ONLY the first backup contact - escalation will notify others if needed
    await this.notifyBackupContactAtIndex(alert, worker, workerName, alert.EscalatedToIndex);
  }

  /**
   * Notify a specific backup contact by index
   * Used for initial notification and escalations
   */
  async notifyBackupContactAtIndex(
    alert: Alert, 
    worker: Awaited<ReturnType<typeof userRepository.findById>>,
    workerName: string,
    index: number
  ): Promise<boolean> {
    if (!worker?.AssignedBackupContactIds?.length || index >= worker.AssignedBackupContactIds.length) {
      return false; // No more backup contacts to notify
    }

    const backupContactId = worker.AssignedBackupContactIds[index];
    const backupContact = await userRepository.findById(backupContactId);

    if (!backupContact) {
      return false;
    }

    const backupContactName = `${backupContact.FirstName} ${backupContact.LastName}`;

    // In-app notification for backup contact with clear worker name
    await notificationRepository.create({
      UserId: backupContactId,
      Type: 'Alert',
      Title: alert.Type === 'MissedCheckIn' ? 'Missed Check-In' : 'Emergency Alert',
      Message: alert.Type === 'MissedCheckIn' 
        ? `${workerName} has missed a check-in. Please try to contact them immediately.`
        : `${workerName} triggered an emergency alert: ${alert.Message}`,
      ActionUrl: '/backup',
    });

    // Notify the worker that their backup contact has been alerted
    await notificationRepository.create({
      UserId: alert.WorkerId,
      Type: 'Alert',
      Title: 'Backup Contact Notified',
      Message: `${backupContactName} has been alerted and will try to reach you.`,
    });

    // SMS notification based on alert type
    if (backupContact.Phone) {
      if (alert.Type === 'Emergency') {
        await smsService.sendEmergencyAlert(backupContact.Phone, workerName, alert.Message);
      } else if (alert.Type === 'MissedCheckIn') {
        await smsService.sendMissedCheckInAlert(backupContact.Phone, workerName);
      }
    }

    console.log(`[Escalation] Notified backup contact ${index + 1}/${worker.AssignedBackupContactIds.length}: ${backupContactName}`);
    return true;
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
