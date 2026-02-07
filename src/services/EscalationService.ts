/**
 * Escalation Service
 * Background service that escalates unacknowledged alerts to the next backup contact
 */

import { alertRepository, userRepository } from '../repositories';
import { systemSettingsService } from './SystemSettingsService';
import { alertService } from './AlertService';
import { Alert } from '../types';

const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

export class EscalationService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  /**
   * Start the escalation background timer
   */
  start(): void {
    if (this.intervalId) {
      console.log('[EscalationService] Already running');
      return;
    }

    console.log('[EscalationService] Starting background escalation timer...');
    this.intervalId = setInterval(() => this.checkAndEscalate(), CHECK_INTERVAL_MS);
    
    // Also run immediately on start
    this.checkAndEscalate();
  }

  /**
   * Stop the escalation background timer
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[EscalationService] Stopped background escalation timer');
    }
  }

  /**
   * Check for alerts that need escalation and process them
   */
  private async checkAndEscalate(): Promise<void> {
    if (this.isRunning) {
      console.log('[EscalationService] Previous check still in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const escalationDelayMinutes = await systemSettingsService.getEscalationDelay();
      const activeAlerts = await alertRepository.findActiveAlerts();

      if (activeAlerts.length === 0) {
        return;
      }

      console.log(`[EscalationService] Checking ${activeAlerts.length} active alerts for escalation (delay: ${escalationDelayMinutes} min)`);

      const now = new Date();

      for (const alert of activeAlerts) {
        await this.processAlert(alert, escalationDelayMinutes, now);
      }
    } catch (error) {
      console.error('[EscalationService] Error checking escalations:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single alert to determine if it needs escalation
   */
  private async processAlert(alert: Alert, escalationDelayMinutes: number, now: Date): Promise<void> {
    // Skip if no LastEscalatedAt (shouldn't happen with new alerts)
    if (!alert.LastEscalatedAt) {
      return;
    }

    const lastEscalatedAt = new Date(alert.LastEscalatedAt);
    const timeSinceLastEscalation = (now.getTime() - lastEscalatedAt.getTime()) / (1000 * 60); // in minutes

    // Check if enough time has passed since last escalation
    if (timeSinceLastEscalation < escalationDelayMinutes) {
      return;
    }

    // Get worker to check backup contacts
    const worker = await userRepository.findById(alert.WorkerId);
    if (!worker?.AssignedBackupContactIds?.length) {
      return;
    }

    const nextIndex = alert.EscalatedToIndex + 1;

    // Check if we have more backup contacts to escalate to
    if (nextIndex >= worker.AssignedBackupContactIds.length) {
      console.log(`[EscalationService] Alert ${alert.Id}: No more backup contacts to escalate to (${worker.AssignedBackupContactIds.length} contacts exhausted)`);
      return;
    }

    // Escalate to the next backup contact
    await this.escalateToNextContact(alert, worker, nextIndex);
  }

  /**
   * Escalate an alert to the next backup contact
   */
  private async escalateToNextContact(
    alert: Alert, 
    worker: NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>,
    nextIndex: number
  ): Promise<void> {
    const workerName = `${worker.FirstName} ${worker.LastName}`;

    console.log(`[EscalationService] Escalating alert ${alert.Id} to backup contact ${nextIndex + 1}/${worker.AssignedBackupContactIds!.length}`);

    // Notify the next backup contact
    const notified = await alertService.notifyBackupContactAtIndex(alert, worker, workerName, nextIndex);

    if (notified) {
      // Update the alert with new escalation info
      await alertRepository.update(alert.Id, {
        EscalatedToIndex: nextIndex,
        LastEscalatedAt: new Date().toISOString(),
      });
      
      console.log(`[EscalationService] Alert ${alert.Id} escalated successfully`);
    } else {
      console.log(`[EscalationService] Failed to notify backup contact at index ${nextIndex}`);
    }
  }

  /**
   * Get the current status of the escalation service
   */
  getStatus(): { running: boolean; checkIntervalMs: number } {
    return {
      running: this.intervalId !== null,
      checkIntervalMs: CHECK_INTERVAL_MS,
    };
  }
}

// Export singleton instance
export const escalationService = new EscalationService();
