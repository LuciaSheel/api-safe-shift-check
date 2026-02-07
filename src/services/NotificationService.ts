/**
 * Notification Service
 * Handles notification business logic
 */

import { notificationRepository, userRepository } from '../repositories';
import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationFilter,
  PaginatedResponse,
} from '../types';

export class NotificationService {
  
  async findAll(filter?: NotificationFilter): Promise<PaginatedResponse<Notification>> {
    return notificationRepository.findAll(filter);
  }

  async findById(id: string): Promise<Notification | null> {
    return notificationRepository.findById(id);
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    // Validate user exists
    const user = await userRepository.findById(data.UserId);
    if (!user) {
      throw new Error('User not found');
    }

    return notificationRepository.create(data);
  }

  async update(id: string, data: UpdateNotificationDto): Promise<Notification | null> {
    const exists = await notificationRepository.exists(id);
    if (!exists) {
      return null;
    }

    return notificationRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return notificationRepository.delete(id);
  }

  async markAsRead(id: string): Promise<Notification | null> {
    return notificationRepository.markAsRead(id);
  }

  async markAllAsReadForUser(userId: string): Promise<number> {
    return notificationRepository.markAllAsReadForUser(userId);
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return notificationRepository.findByUserId(userId);
  }

  async getUnreadNotificationsByUserId(userId: string): Promise<Notification[]> {
    return notificationRepository.findUnreadByUserId(userId);
  }

  async deleteAllForUser(userId: string): Promise<number> {
    return notificationRepository.deleteAllForUser(userId);
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return notificationRepository.countUnreadForUser(userId);
  }

  async count(filter?: NotificationFilter): Promise<number> {
    return notificationRepository.count(filter);
  }

  async sendBulkNotification(
    userIds: string[],
    notification: Omit<CreateNotificationDto, 'UserId'>
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      const created = await notificationRepository.create({
        ...notification,
        UserId: userId,
      });
      notifications.push(created);
    }

    return notifications;
  }

  async sendNotificationToRole(
    role: string,
    notification: Omit<CreateNotificationDto, 'UserId'>
  ): Promise<Notification[]> {
    const usersResponse = await userRepository.findAll({ 
      Role: role as 'Cleaner' | 'Booker' | 'Director' | 'Administrator',
      IsActive: true,
      PageSize: 1000 
    });
    
    const userIds = usersResponse.Data.map(u => u.Id);
    return this.sendBulkNotification(userIds, notification);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
