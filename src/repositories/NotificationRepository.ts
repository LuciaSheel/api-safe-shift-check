/**
 * Notification Repository
 * Handles all data access operations for Notification entities
 */

import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/dataStore';
import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationFilter,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';

export class NotificationRepository implements IBaseRepository<Notification, CreateNotificationDto, UpdateNotificationDto, NotificationFilter> {
  
  async findAll(filter?: NotificationFilter): Promise<PaginatedResponse<Notification>> {
    let filteredNotifications = [...dataStore.notifications];

    // Apply filters
    if (filter) {
      if (filter.UserId) {
        filteredNotifications = filteredNotifications.filter(n => n.UserId === filter.UserId);
      }
      if (filter.Type) {
        filteredNotifications = filteredNotifications.filter(n => n.Type === filter.Type);
      }
      if (filter.IsRead !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.IsRead === filter.IsRead);
      }

      // Apply sorting
      if (filter.SortBy) {
        const sortOrder = filter.SortOrder === 'desc' ? -1 : 1;
        filteredNotifications.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[filter.SortBy!];
          const bVal = (b as Record<string, unknown>)[filter.SortBy!];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal) * sortOrder;
          }
          return 0;
        });
      } else {
        // Default sort by CreatedAt descending
        filteredNotifications.sort((a, b) => 
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
        );
      }
    }

    // Apply pagination
    const page = filter?.Page || 1;
    const pageSize = filter?.PageSize || 10;
    const total = filteredNotifications.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + pageSize);

    return {
      Data: paginatedNotifications,
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: totalPages,
    };
  }

  async findById(id: string): Promise<Notification | null> {
    return dataStore.notifications.find(n => n.Id === id) || null;
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    const newNotification: Notification = {
      Id: `notif-${uuidv4()}`,
      UserId: data.UserId,
      Type: data.Type,
      Title: data.Title,
      Message: data.Message,
      ActionUrl: data.ActionUrl,
      IsRead: false,
      CreatedAt: new Date().toISOString(),
    };
    dataStore.notifications.push(newNotification);
    return newNotification;
  }

  async update(id: string, data: UpdateNotificationDto): Promise<Notification | null> {
    const index = dataStore.notifications.findIndex(n => n.Id === id);
    if (index === -1) return null;

    dataStore.notifications[index] = {
      ...dataStore.notifications[index],
      ...data,
    };

    return dataStore.notifications[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = dataStore.notifications.findIndex(n => n.Id === id);
    if (index === -1) return false;

    dataStore.notifications.splice(index, 1);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    return dataStore.notifications.some(n => n.Id === id);
  }

  async count(filter?: NotificationFilter): Promise<number> {
    let filteredNotifications = [...dataStore.notifications];

    if (filter) {
      if (filter.UserId) {
        filteredNotifications = filteredNotifications.filter(n => n.UserId === filter.UserId);
      }
      if (filter.IsRead !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.IsRead === filter.IsRead);
      }
    }

    return filteredNotifications.length;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return dataStore.notifications
      .filter(n => n.UserId === userId)
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return dataStore.notifications
      .filter(n => n.UserId === userId && !n.IsRead)
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const index = dataStore.notifications.findIndex(n => n.Id === id);
    if (index === -1) return null;

    dataStore.notifications[index] = {
      ...dataStore.notifications[index],
      IsRead: true,
    };

    return dataStore.notifications[index];
  }

  async markAllAsReadForUser(userId: string): Promise<number> {
    let count = 0;
    dataStore.notifications.forEach((n, index) => {
      if (n.UserId === userId && !n.IsRead) {
        dataStore.notifications[index].IsRead = true;
        count++;
      }
    });
    return count;
  }

  async deleteAllForUser(userId: string): Promise<number> {
    const initialLength = dataStore.notifications.length;
    const filtered = dataStore.notifications.filter(n => n.UserId !== userId);
    const deletedCount = initialLength - filtered.length;
    
    // Update the array in place
    dataStore.notifications.length = 0;
    dataStore.notifications.push(...filtered);
    
    return deletedCount;
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return dataStore.notifications.filter(n => n.UserId === userId && !n.IsRead).length;
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository();
