/**
 * Shift Repository (Prisma)
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  Shift,
  CreateShiftDto,
  UpdateShiftDto,
  ShiftFilter,
  PaginatedResponse,
  ShiftStatus,
} from '../types';
import { IBaseRepository } from './interfaces';
import type { Shift as PrismaShift } from '@prisma/client';

function mapShift(row: PrismaShift): Shift {
  return {
    Id: row.Id,
    WorkerId: row.WorkerId,
    LocationId: row.LocationId,
    Status: row.Status as ShiftStatus,
    StartTime: row.StartTime.toISOString(),
    EndTime: row.EndTime?.toISOString(),
    EstimatedEndTime: row.EstimatedEndTime.toISOString(),
    Notes: row.Notes ?? undefined,
    CheckInIntervalMinutes: row.CheckInIntervalMinutes,
    CreatedAt: row.CreatedAt.toISOString(),
    UpdatedAt: row.UpdatedAt?.toISOString(),
  };
}

export class ShiftRepository implements IBaseRepository<Shift, CreateShiftDto, UpdateShiftDto, ShiftFilter> {

  async findAll(filter?: ShiftFilter): Promise<PaginatedResponse<Shift>> {
    const where: Record<string, unknown> = {};
    if (filter?.WorkerId) where.WorkerId = filter.WorkerId;
    if (filter?.LocationId) where.LocationId = filter.LocationId;
    if (filter?.Status) where.Status = filter.Status;
    if (filter?.StartDate || filter?.EndDate) {
      where.StartTime = {
        ...(filter.StartDate ? { gte: new Date(filter.StartDate) } : {}),
        ...(filter.EndDate ? { lte: new Date(filter.EndDate) } : {}),
      };
    }

    const page = filter?.Page ?? 1;
    const pageSize = filter?.PageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const orderBy = filter?.SortBy
      ? { [filter.SortBy]: (filter.SortOrder ?? 'asc') as 'asc' | 'desc' }
      : { StartTime: 'desc' as const };

    const [total, rows] = await Promise.all([
      prisma.shift.count({ where }),
      prisma.shift.findMany({ where, skip, take: pageSize, orderBy }),
    ]);

    return {
      Data: rows.map(mapShift),
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Shift | null> {
    const row = await prisma.shift.findUnique({ where: { Id: id } });
    return row ? mapShift(row) : null;
  }

  async create(data: CreateShiftDto): Promise<Shift> {
    const now = new Date();
    const row = await prisma.shift.create({
      data: {
        Id: `shift-${uuidv4()}`,
        WorkerId: data.WorkerId,
        LocationId: data.LocationId,
        Status: 'Active',
        StartTime: now,
        EstimatedEndTime: new Date(data.EstimatedEndTime),
        Notes: data.Notes,
        CheckInIntervalMinutes: data.CheckInIntervalMinutes ?? 15,
      },
    });
    return mapShift(row);
  }

  async update(id: string, data: UpdateShiftDto): Promise<Shift | null> {
    try {
      const row = await prisma.shift.update({
        where: { Id: id },
        data: {
          ...(data.Status && { Status: data.Status }),
          ...(data.EndTime && { EndTime: new Date(data.EndTime) }),
          ...(data.EstimatedEndTime && { EstimatedEndTime: new Date(data.EstimatedEndTime) }),
          ...(data.Notes !== undefined && { Notes: data.Notes }),
          ...(data.CheckInIntervalMinutes && { CheckInIntervalMinutes: data.CheckInIntervalMinutes }),
          UpdatedAt: new Date(),
        },
      });
      return mapShift(row);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.shift.delete({ where: { Id: id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.shift.count({ where: { Id: id } });
    return count > 0;
  }

  async count(filter?: ShiftFilter): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filter?.WorkerId) where.WorkerId = filter.WorkerId;
    if (filter?.Status) where.Status = filter.Status;
    return prisma.shift.count({ where });
  }

  async findActiveShiftByWorkerId(workerId: string): Promise<Shift | null> {
    const row = await prisma.shift.findFirst({
      where: { WorkerId: workerId, Status: 'Active' },
    });
    return row ? mapShift(row) : null;
  }

  async findActiveShifts(): Promise<Shift[]> {
    const rows = await prisma.shift.findMany({
      where: { Status: 'Active' },
      orderBy: { StartTime: 'asc' },
    });
    return rows.map(mapShift);
  }

  async findShiftsByWorkerId(workerId: string): Promise<Shift[]> {
    const rows = await prisma.shift.findMany({
      where: { WorkerId: workerId },
      orderBy: { StartTime: 'desc' },
    });
    return rows.map(mapShift);
  }

  async endShift(id: string): Promise<Shift | null> {
    try {
      const row = await prisma.shift.update({
        where: { Id: id },
        data: {
          Status: 'Completed',
          EndTime: new Date(),
          UpdatedAt: new Date(),
        },
      });
      return mapShift(row);
    } catch {
      return null;
    }
  }

  async findTodaysShifts(): Promise<Shift[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const rows = await prisma.shift.findMany({
      where: { StartTime: { gte: today, lt: tomorrow } },
      orderBy: { StartTime: 'asc' },
    });
    return rows.map(mapShift);
  }
}

export const shiftRepository = new ShiftRepository();
