/**
 * System Settings Service
 * Handles system settings business logic
 */

import { systemSettingsRepository } from '../repositories';
import { SystemSettings, UpdateSystemSettingsDto } from '../types';

export class SystemSettingsService {
  
  async get(): Promise<SystemSettings> {
    return systemSettingsRepository.get();
  }

  async update(data: UpdateSystemSettingsDto, updatedBy?: string): Promise<SystemSettings> {
    // Validate settings
    if (data.CheckInIntervalMinutes !== undefined) {
      if (data.CheckInIntervalMinutes < 1 || data.CheckInIntervalMinutes > 120) {
        throw new Error('Check-in interval must be between 1 and 120 minutes');
      }
    }

    if (data.ResponseTimeoutSeconds !== undefined) {
      if (data.ResponseTimeoutSeconds < 30 || data.ResponseTimeoutSeconds > 600) {
        throw new Error('Response timeout must be between 30 and 600 seconds');
      }
    }

    if (data.EscalationDelayMinutes !== undefined) {
      if (data.EscalationDelayMinutes < 1 || data.EscalationDelayMinutes > 60) {
        throw new Error('Escalation delay must be between 1 and 60 minutes');
      }
    }

    return systemSettingsRepository.update(data, updatedBy);
  }

  async reset(resetBy?: string): Promise<SystemSettings> {
    const settings = await systemSettingsRepository.reset();
    if (resetBy) {
      return systemSettingsRepository.update({}, resetBy);
    }
    return settings;
  }

  async getCheckInInterval(): Promise<number> {
    const settings = await this.get();
    return settings.CheckInIntervalMinutes;
  }

  async getResponseTimeout(): Promise<number> {
    const settings = await this.get();
    return settings.ResponseTimeoutSeconds;
  }

  async getEscalationDelay(): Promise<number> {
    const settings = await this.get();
    return settings.EscalationDelayMinutes;
  }

  async isNotificationEnabled(type: 'sms' | 'email' | 'push'): Promise<boolean> {
    const settings = await this.get();
    switch (type) {
      case 'sms':
        return settings.EnableSmsNotifications;
      case 'email':
        return settings.EnableEmailNotifications;
      case 'push':
        return settings.EnablePushNotifications;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const systemSettingsService = new SystemSettingsService();
