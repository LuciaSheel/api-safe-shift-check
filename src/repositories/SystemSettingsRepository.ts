/**
 * System Settings Repository (Prisma)
 */

import { prisma } from '../lib/prisma';
import { SystemSettings, UpdateSystemSettingsDto } from '../types';
import type { SystemSettings as PrismaSettings } from '@prisma/client';

const SETTINGS_ID = 'settings-001';

const DEFAULT_SETTINGS = {
  Id: SETTINGS_ID,
  CheckInIntervalMinutes: 15,
  ResponseTimeoutSeconds: 60,
  EscalationDelayMinutes: 5,
  EnableSmsNotifications: true,
  EnableEmailNotifications: true,
  EnablePushNotifications: true,
  EmergencyNumber: '911',
  NonEmergencyNumber: '',
};

function mapSettings(row: PrismaSettings): SystemSettings {
  return {
    Id: row.Id,
    CheckInIntervalMinutes: row.CheckInIntervalMinutes,
    ResponseTimeoutSeconds: row.ResponseTimeoutSeconds,
    EscalationDelayMinutes: row.EscalationDelayMinutes,
    EnableSmsNotifications: row.EnableSmsNotifications,
    EnableEmailNotifications: row.EnableEmailNotifications,
    EnablePushNotifications: row.EnablePushNotifications,
    EmergencyNumber: row.EmergencyNumber,
    NonEmergencyNumber: row.NonEmergencyNumber,
    UpdatedAt: row.UpdatedAt?.toISOString(),
    UpdatedBy: row.UpdatedBy ?? undefined,
  };
}

export class SystemSettingsRepository {

  async get(): Promise<SystemSettings> {
    const row = await prisma.systemSettings.findUnique({ where: { Id: SETTINGS_ID } });
    if (row) return mapSettings(row);

    // Bootstrap default settings on first call
    const created = await prisma.systemSettings.create({ data: DEFAULT_SETTINGS });
    return mapSettings(created);
  }

  async update(data: UpdateSystemSettingsDto, updatedBy?: string): Promise<SystemSettings> {
    const row = await prisma.systemSettings.upsert({
      where: { Id: SETTINGS_ID },
      create: { ...DEFAULT_SETTINGS, ...data, UpdatedAt: new Date(), UpdatedBy: updatedBy },
      update: { ...data, UpdatedAt: new Date(), UpdatedBy: updatedBy },
    });
    return mapSettings(row);
  }

  async reset(): Promise<SystemSettings> {
    const row = await prisma.systemSettings.upsert({
      where: { Id: SETTINGS_ID },
      create: { ...DEFAULT_SETTINGS, UpdatedAt: new Date() },
      update: { ...DEFAULT_SETTINGS, UpdatedAt: new Date(), UpdatedBy: undefined },
    });
    return mapSettings(row);
  }
}

export const systemSettingsRepository = new SystemSettingsRepository();
