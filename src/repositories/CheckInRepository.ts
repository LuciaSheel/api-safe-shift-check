/**
 * CheckIn Repository (Prisma)
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  CheckIn,
  CreateCheckInDto,
  UpdateCheckInDto,
  CheckInFilter,
  PaginatedResponse,
  CheckInStatus,
} from '../types';
import { IBaseRepository } from './interfaces';
import type { CheckIn as PrismaCheckIn } from '@prisma/client';

function mapCheckIn(row: PrismaCheckIn): CheckIn {
  return {
    Id: row.Id,
    ShiftId: row.ShiftId,
    WorkerId: row.WorkerId,
    ScheduledTime: row.ScheduledTime.toISOString(),
    ResponseTime: row.ResponseTime?.toISOString(),
    Status: row.Status as CheckInStatus,
    ResponseSeconds: row.ResponseSeconds ?? undefined,
    CreatedAt: row.CreatedAt.toISOString(),
  };
}

export class CheckInRepository implements IBaseRepository<CheckIn, CreateCheckInDto, UpdateCheckInDto, CheckInFilter> {

  async findAll(filter?: CheckInFilter): Promise<PaginatedResponse<CheckIn>> {
    const where: Record<string, unknown> = {};
    if (filter?.ShiftId) where.ShiftId = filter.ShiftId;
    if (filter?.WorkerId) where.WorkerId = filter.WorkerId;
    if (filter?.Status) where.Status = filter.Status;
    if (filter?.StartDate || filter?.EndDate) {
      where.ScheduledTime = {
        ...(filter.StartDate ? { gte: new Date(filter.StartDate) } : {}),
        ...(filter.EndDate ? { lte: new Date(filter.EndDate) } : {}),
      };
    }

    const page = filter?.Page ?? 1;
    const pageSize = filter?.PageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const orderBy = filter?.SortBy
      ? { [filter.SortBy]: (filter.SortOrder ?? 'asc') as 'asc' | 'desc' }
      : { ScheduledTime: 'desc' as const };

    const [total, rows] = await Promise.all([
      prisma.checkIn.count({ where }),
      prisma.checkIn.findMany({ where, skip, take: pageSize, orderBy }),
    ]);

    return {
      Data: rows.map(mapCheckIn),
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<CheckIn | null> {
    const row = await prisma.checkIn.findUnique({ where: { Id: id } });
    return row ? mapCheckIn(row) : null;
  }

  async create(data: CreateCheckInDto): Promise<CheckIn> {
    const row = await prisma.checkIn.create({
      data: {
        Id: `checkin-${uuidv4()}`,
        ShiftId: data.ShiftId,
        WorkerId: data.WorkerId,
        ScheduledTime: new Date(data.ScheduledTime),
        Status: 'Pending',
      },
    });
    return mapCheckIn(row);
  }

  async update(id: string, data: UpdateCheckInDto): Promise<CheckIn | null> {
    try {
      const row = await prisma.checkIn.update({
        where: { Id: id },
        data: {
          ...(data.Status && { Status: data.Status }),
          ...(data.ResponseTime && { ResponseTime: new Date(data.ResponseTime) }),
          ...(data.ResponseSeconds !== undefined && { ResponseSeconds: data.ResponseSeconds }),
        },
      });
      return mapCheckIn(row);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.checkIn.delete({ where: { Id: id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.checkIn.count({ where: { Id: id } });
    return count > 0;
  }

  async count(filter?: CheckInFilter): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filter?.ShiftId) where.ShiftId = filter.ShiftId;
    if (filter?.WorkerId) where.WorkerId = filter.WorkerId;
    if (filter?.Status) where.Status = filter.Status;
    return prisma.checkIn.count({ where });
  }

  async findByShiftId(shiftId: string): Promise<CheckIn[]> {
    const rows = await prisma.checkIn.findMany({
      where: { ShiftId: shiftId },
      orderBy: { ScheduledTime: 'asc' },
    });
    return rows.map(mapCheckIn);
  }

  async findByWorkerId(workerId: string): Promise<CheckIn[]> {
    const rows = await prisma.checkIn.findMany({
      where: { WorkerId: workerId },
      orderBy: { ScheduledTime: 'desc' },
    });
    return rows.map(mapCheckIn);
  }

  async findPendingCheckIns(): Promise<CheckIn[]> {
    const rows = await prisma.checkIn.findMany({
      where: { Status: 'Pending' },
      orderBy: { ScheduledTime: 'asc' },
    });
    return rows.map(mapCheckIn);
  }

  async confirmCheckIn(id: string, responseSeconds: number): Promise<CheckIn | null> {
    try {
      const row = await prisma.checkIn.update({
        where: { Id: id },
        data: {
          Status: 'Confirmed',
          ResponseTime: new Date(),
          ResponseSeconds: responseSeconds,
        },
      });
      return mapCheckIn(row);
    } catch {
      return null;
    }
  }

  async markAsMissed(id: string): Promise<CheckIn | null> {
    try {
      const row = await prisma.checkIn.update({
        where: { Id: id },
        data: { Status: 'Missed' },
      });
      return mapCheckIn(row);
    } catch {
      return null;
    }
  }

  async getAverageResponseTime(workerId?: string): Promise<number> {
    const result = await prisma.checkIn.aggregate({
      where: {
        ...(workerId ? { WorkerId: workerId } : {}),
        Status: 'Confirmed',
        ResponseSeconds: { not: null },
      },
      _avg: { ResponseSeconds: true },
    });
    return Math.round(result._avg.ResponseSeconds ?? 0);
  }
}

export const checkInRepository = new CheckInRepository();
