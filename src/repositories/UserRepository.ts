/**
 * User Repository (Prisma)
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  UserFilter,
  PaginatedResponse,
  UserRole,
} from '../types';
import { IBaseRepository } from './interfaces';
import type { User as PrismaUser } from '@prisma/client';

function mapUser(row: PrismaUser, includePassword = false): User {
  const user: User = {
    Id: row.Id,
    Email: row.Email,
    FirstName: row.FirstName,
    LastName: row.LastName,
    Role: row.Role as UserRole,
    Phone: row.Phone,
    Avatar: row.Avatar ?? undefined,
    IsActive: row.IsActive,
    CreatedAt: row.CreatedAt.toISOString(),
    UpdatedAt: row.UpdatedAt?.toISOString(),
    AssignedBackupContactIds: row.AssignedBackupContactIds,
    AssignedWorkerIds: row.AssignedWorkerIds,
    TeamId: row.TeamId ?? undefined,
    TokenVersion: row.TokenVersion,
  };
  if (includePassword && row.Password) {
    user.Password = row.Password;
  }
  return user;
}

export class UserRepository implements IBaseRepository<User, CreateUserDto, UpdateUserDto, UserFilter> {

  async findAll(filter?: UserFilter): Promise<PaginatedResponse<User>> {
    const where: Record<string, unknown> = {};
    if (filter?.Role) where.Role = filter.Role;
    if (filter?.IsActive !== undefined) where.IsActive = filter.IsActive;
    if (filter?.TeamId) where.TeamId = filter.TeamId;
    if (filter?.Search) {
      where.OR = [
        { FirstName: { contains: filter.Search, mode: 'insensitive' } },
        { LastName: { contains: filter.Search, mode: 'insensitive' } },
        { Email: { contains: filter.Search, mode: 'insensitive' } },
      ];
    }

    const page = filter?.Page ?? 1;
    const pageSize = filter?.PageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const orderBy = filter?.SortBy
      ? { [filter.SortBy]: (filter.SortOrder ?? 'asc') as 'asc' | 'desc' }
      : { CreatedAt: 'desc' as const };

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, skip, take: pageSize, orderBy }),
    ]);

    return {
      Data: rows.map(r => mapUser(r)),
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { Id: id } });
    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findFirst({
      where: { Email: { equals: email, mode: 'insensitive' } },
    });
    return row ? mapUser(row) : null;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const row = await prisma.user.findFirst({
      where: { Email: { equals: email, mode: 'insensitive' } },
    });
    return row ? mapUser(row, true) : null;
  }

  async create(data: CreateUserDto): Promise<User> {
    const row = await prisma.user.create({
      data: {
        Id: `user-${uuidv4()}`,
        Email: data.Email,
        Password: data.Password,
        FirstName: data.FirstName,
        LastName: data.LastName,
        Role: data.Role,
        Phone: data.Phone,
        Avatar: data.Avatar,
        TeamId: data.TeamId,
        AssignedBackupContactIds: data.AssignedBackupContactIds ?? [],
        AssignedWorkerIds: data.AssignedWorkerIds ?? [],
        IsActive: true,
      },
    });
    return mapUser(row);
  }

  async update(id: string, data: UpdateUserDto): Promise<User | null> {
    try {
      const row = await prisma.user.update({
        where: { Id: id },
        data: { ...data, UpdatedAt: new Date() },
      });
      return mapUser(row);
    } catch {
      return null;
    }
  }

  async updatePassword(id: string, hashedPassword: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { Id: id },
        data: {
          Password: hashedPassword,
          UpdatedAt: new Date(),
          TokenVersion: { increment: 1 },
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async incrementTokenVersion(id: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { Id: id },
        data: { TokenVersion: { increment: 1 }, UpdatedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({ where: { Id: id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { Id: id } });
    return count > 0;
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        Email: { equals: email, mode: 'insensitive' },
        ...(excludeId ? { NOT: { Id: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async count(filter?: UserFilter): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filter?.Role) where.Role = filter.Role;
    if (filter?.IsActive !== undefined) where.IsActive = filter.IsActive;
    return prisma.user.count({ where });
  }

  async findWorkersByBackupContactId(backupContactId: string): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { AssignedBackupContactIds: { has: backupContactId } },
    });
    return rows.map(r => mapUser(r));
  }

  async findBackupContactsByWorkerId(workerId: string): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { AssignedWorkerIds: { has: workerId } },
    });
    return rows.map(r => mapUser(r));
  }
}

export const userRepository = new UserRepository();
