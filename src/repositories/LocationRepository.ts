/**
 * Location Repository (Prisma)
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  Location,
  CreateLocationDto,
  UpdateLocationDto,
  PaginatedRequest,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';
import type { Location as PrismaLocation } from '@prisma/client';

export interface LocationFilter extends PaginatedRequest {
  IsActive?: boolean;
  Search?: string;
}

function mapLocation(row: PrismaLocation): Location {
  return {
    Id: row.Id,
    Name: row.Name,
    Address: row.Address,
    Latitude: row.Latitude,
    Longitude: row.Longitude,
    IsActive: row.IsActive,
    CreatedAt: row.CreatedAt.toISOString(),
    UpdatedAt: row.UpdatedAt?.toISOString(),
  };
}

export class LocationRepository implements IBaseRepository<Location, CreateLocationDto, UpdateLocationDto, LocationFilter> {

  async findAll(filter?: LocationFilter): Promise<PaginatedResponse<Location>> {
    const where: Record<string, unknown> = {};
    if (filter?.IsActive !== undefined) where.IsActive = filter.IsActive;
    if (filter?.Search) {
      where.OR = [
        { Name: { contains: filter.Search, mode: 'insensitive' } },
        { Address: { contains: filter.Search, mode: 'insensitive' } },
      ];
    }

    const page = filter?.Page ?? 1;
    const pageSize = filter?.PageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const orderBy = filter?.SortBy
      ? { [filter.SortBy]: (filter.SortOrder ?? 'asc') as 'asc' | 'desc' }
      : { Name: 'asc' as const };

    const [total, rows] = await Promise.all([
      prisma.location.count({ where }),
      prisma.location.findMany({ where, skip, take: pageSize, orderBy }),
    ]);

    return {
      Data: rows.map(mapLocation),
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Location | null> {
    const row = await prisma.location.findUnique({ where: { Id: id } });
    return row ? mapLocation(row) : null;
  }

  async create(data: CreateLocationDto): Promise<Location> {
    const row = await prisma.location.create({
      data: {
        Id: `loc-${uuidv4()}`,
        Name: data.Name,
        Address: data.Address,
        Latitude: data.Latitude,
        Longitude: data.Longitude,
        IsActive: true,
      },
    });
    return mapLocation(row);
  }

  async update(id: string, data: UpdateLocationDto): Promise<Location | null> {
    try {
      const row = await prisma.location.update({
        where: { Id: id },
        data: { ...data, UpdatedAt: new Date() },
      });
      return mapLocation(row);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.location.delete({ where: { Id: id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.location.count({ where: { Id: id } });
    return count > 0;
  }

  async count(filter?: LocationFilter): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filter?.IsActive !== undefined) where.IsActive = filter.IsActive;
    return prisma.location.count({ where });
  }

  async findActiveLocations(): Promise<Location[]> {
    const rows = await prisma.location.findMany({
      where: { IsActive: true },
      orderBy: { Name: 'asc' },
    });
    return rows.map(mapLocation);
  }
}

export const locationRepository = new LocationRepository();
