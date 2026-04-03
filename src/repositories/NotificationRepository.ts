/**
 * Notification Repository (Prisma)
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationFilter,
  PaginatedResponse,
  NotificationType,
} from '../types';
import { IBaseRepository } from './interfaces';
import type { Notification as PrismaNotification } from '@prisma/client';

function mapNotification(row: PrismaNotification): Notification {
  return {
    Id: row.Id,
    UserId: row.UserId,
    Type: row.Type as NotificationType,
    Title: row.Title,
    Message: row.Message,
    IsRead: row.IsRead,
    CreatedAt: row.CreatedAt.toISOString(),
    ActionUrl: row.ActionUrl ?? undefined,
  };
}

export class NotificationRepository implements IBaseRepository<Notification, CreateNotificationDto, UpdateNotificationDto, NotificationFilter> {

  async findAll(filter?: NotificationFilter): Promise<PaginatedResponse<Notification>> {
    const where: Record<string, unknown> = {};
    if (filter?.UserId) where.UserId = filter.UserId;
    if (filter?.Type) where.Type = filter.Type;
    if (filter?.IsRead !== undefined) where.IsRead = filter.IsRead;

    const page = filter?.Page ?? 1;
    const pageSize = filter?.PageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const orderBy = filter?.SortBy
      ? { [filter.SortBy]: (filter.SortOrder ?? 'asc') as 'asc' | 'desc' }
      : { CreatedAt: 'desc' as const };

    const [total, rows] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({ where, skip, take: pageSize, orderBy }),
    ]);

    return {
      Data: rows.map(mapNotification),
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Notification | null> {
    const row = await prisma.notification.findUnique({ where: { Id: id } });
    return row ? mapNotification(row) : null;
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    const row = await prisma.notification.create({
      data: {
        Id: `notif-${uuidv4()}`,
        UserId: data.UserId,
        Type: data.Type,
        Title: data.Title,
        Message: data.Message,
        ActionUrl: data.ActionUrl,
        IsRead: false,
      },
    });
    return mapNotification(row);
  }

  async update(id: string, data: UpdateNotificationDto): Promise<Notification | null> {
    try {
      const row = await prisma.notification.update({
        where: { Id: id },
        data,
      });
      return mapNotification(row);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.notification.delete({ where: { Id: id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.notification.count({ where: { Id: id } });
    return count > 0;
  }

  async count(filter?: NotificationFilter): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filter?.UserId) where.UserId = filter.UserId;
    if (filter?.IsRead !== undefined) where.IsRead = filter.IsRead;
    return prisma.notification.count({ where });
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { UserId: userId },
      orderBy: { CreatedAt: 'desc' },
    });
    return rows.map(mapNotification);
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { UserId: userId, IsRead: false },
      orderBy: { CreatedAt: 'desc' },
    });
    return rows.map(mapNotification);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    try {
      const row = await prisma.notification.update({
        where: { Id: id },
        data: { IsRead: true },
      });
      return mapNotification(row);
    } catch {
      return null;
    }
  }

  async markAllAsReadForUser(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { UserId: userId, IsRead: false },
      data: { IsRead: true },
    });
    return result.count;
  }

  async deleteAllForUser(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({ where: { UserId: userId } });
    return result.count;
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return prisma.notification.count({ where: { UserId: userId, IsRead: false } });
  }
}

export const notificationRepository = new NotificationRepository();
