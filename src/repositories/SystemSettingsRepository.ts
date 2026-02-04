/**
 * System Settings Repository
 * Handles all data access operations for SystemSettings entity
 */

import { dataStore } from '../data/dataStore';
import { SystemSettings, UpdateSystemSettingsDto } from '../types';

export class SystemSettingsRepository {
  async get(): Promise<SystemSettings> {
    return { ...dataStore.systemSettings };
  }

  async update(data: UpdateSystemSettingsDto, updatedBy?: string): Promise<SystemSettings> {
    dataStore.systemSettings = {
      ...dataStore.systemSettings,
      ...data,
      UpdatedAt: new Date().toISOString(),
      UpdatedBy: updatedBy,
    };

    return { ...dataStore.systemSettings };
  }

  async reset(): Promise<SystemSettings> {
    dataStore.systemSettings = {
      Id: 'settings-001',
      CheckInIntervalMinutes: 15,
      ResponseTimeoutSeconds: 60,
      EscalationDelayMinutes: 5,
      EnableSmsNotifications: true,
      EnableEmailNotifications: true,
      EnablePushNotifications: true,
      UpdatedAt: new Date().toISOString(),
    };

    return { ...dataStore.systemSettings };
  }
}

// Export singleton instance
export const systemSettingsRepository = new SystemSettingsRepository();
