/**
 * Alert Repository (Prisma)
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  Alert,
  CreateAlertDto,
  UpdateAlertDto,
  AlertFilter,
  PaginatedResponse,
  AlertStatus,
  AlertSeverity,
  AlertType,
} from '../types';
import { IBaseRepository } from './interfaces';
import type { Alert as PrismaAlert } from '@prisma/client';

function mapAlert(row: PrismaAlert): Alert {
  return {
    Id: row.Id,
    ShiftId: row.ShiftId,
    WorkerId: row.WorkerId,
    BackupContactId: row.BackupContactId ?? undefined,
    Type: row.Type as AlertType,
    Status: row.Status as AlertStatus,
    Severity: row.Severity as AlertSeverity,
    Message: row.Message,
    CreatedAt: row.CreatedAt.toISOString(),
    AcknowledgedAt: row.AcknowledgedAt?.toISOString(),
    AcknowledgedBy: row.AcknowledgedBy ?? undefined,
    ResolvedAt: row.ResolvedAt?.toISOString(),
    ResolvedBy: row.ResolvedBy ?? undefined,
    EscalatedToIndex: row.EscalatedToIndex,
    LastEscalatedAt: row.LastEscalatedAt?.toISOString(),
    Latitude: row.Latitude ?? undefined,
    Longitude: row.Longitude ?? undefined,
  };
}

export class AlertRepository implements IBaseRepository<Alert, CreateAlertDto, UpdateAlertDto, AlertFilter> {

  async findAll(filter?: AlertFilter): Promise<PaginatedResponse<Alert>> {
    const where: Record<string, unknown> = {};
    if (filter?.WorkerId) where.WorkerId = filter.WorkerId;
    if (filter?.BackupContactId) where.BackupContactId = filter.BackupContactId;
    if (filter?.Status) where.Status = filter.Status;
    if (filter?.Severity) where.Severity = filter.Severity;
    if (filter?.Type) where.Type = filter.Type;
    if (filter?.StartDate || filter?.EndDate) {
      where.CreatedAt = {
        ...(filter.StartDate ? { gte: new Date(filter.StartDate) } : {}),
        ...(filter.EndDate ? { lte: new Date(filter.EndDate) } : {}),
      };
    }

    const page = filter?.Page ?? 1;
    const pageSize = filter?.PageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const orderBy = filter?.SortBy
      ? { [filter.SortBy]: (filter.SortOrder ?? 'asc') as 'asc' | 'desc' }
      : { CreatedAt: 'desc' as const };

    const [total, rows] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.findMany({ where, skip, take: pageSize, orderBy }),
    ]);

    return {
      Data: rows.map(mapAlert),
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Alert | null> {
    const row = await prisma.alert.findUnique({ where: { Id: id } });
    return row ? mapAlert(row) : null;
  }

  async create(data: CreateAlertDto): Promise<Alert> {
    const now = new Date();
    const row = await prisma.alert.create({
      data: {
        Id: `alert-${uuidv4()}`,
        ShiftId: data.ShiftId,
        WorkerId: data.WorkerId,
        BackupContactId: data.BackupContactId,
        Type: data.Type,
        Severity: data.Severity,
        Message: data.Message,
        Status: 'Active',
        EscalatedToIndex: 0,
        LastEscalatedAt: now,
        Latitude: data.Latitude,
        Longitude: data.Longitude,
      },
    });
    return mapAlert(row);
  }

  async update(id: string, data: UpdateAlertDto): Promise<Alert | null> {
    try {
      const row = await prisma.alert.update({
        where: { Id: id },
        data: {
          ...(data.Status && { Status: data.Status }),
          ...(data.AcknowledgedAt && { AcknowledgedAt: new Date(data.AcknowledgedAt) }),
          ...(data.AcknowledgedBy !== undefined && { AcknowledgedBy: data.AcknowledgedBy }),
          ...(data.ResolvedAt && { ResolvedAt: new Date(data.ResolvedAt) }),
          ...(data.ResolvedBy !== undefined && { ResolvedBy: data.ResolvedBy }),
          ...(data.EscalatedToIndex !== undefined && { EscalatedToIndex: data.EscalatedToIndex }),
          ...(data.LastEscalatedAt && { LastEscalatedAt: new Date(data.LastEscalatedAt) }),
        },
      });
      return mapAlert(row);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.alert.delete({ where: { Id: id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.alert.count({ where: { Id: id } });
    return count > 0;
  }

  async count(filter?: AlertFilter): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filter?.Status) where.Status = filter.Status;
    if (filter?.WorkerId) where.WorkerId = filter.WorkerId;
    return prisma.alert.count({ where });
  }

  async findActiveAlerts(): Promise<Alert[]> {
    const rows = await prisma.alert.findMany({
      where: { Status: 'Active' },
      orderBy: { CreatedAt: 'asc' },
    });
    return rows.map(mapAlert);
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert | null> {
    try {
      const row = await prisma.alert.update({
        where: { Id: id },
        data: {
          Status: 'Acknowledged',
          AcknowledgedAt: new Date(),
          AcknowledgedBy: acknowledgedBy,
        },
      });
      return mapAlert(row);
    } catch {
      return null;
    }
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<Alert | null> {
    try {
      const row = await prisma.alert.update({
        where: { Id: id },
        data: {
          Status: 'Resolved',
          ResolvedAt: new Date(),
          ResolvedBy: resolvedBy,
        },
      });
      return mapAlert(row);
    } catch {
      return null;
    }
  }

  async findByWorkerId(workerId: string): Promise<Alert[]> {
    const rows = await prisma.alert.findMany({
      where: { WorkerId: workerId },
      orderBy: { CreatedAt: 'desc' },
    });
    return rows.map(mapAlert);
  }

  async findByBackupContactId(backupContactId: string): Promise<Alert[]> {
    const rows = await prisma.alert.findMany({
      where: { BackupContactId: backupContactId },
      orderBy: { CreatedAt: 'desc' },
    });
    return rows.map(mapAlert);
  }

  async countPendingAlerts(): Promise<number> {
    return prisma.alert.count({ where: { Status: { in: ['Active', 'Acknowledged'] } } });
  }
}

export const alertRepository = new AlertRepository();
