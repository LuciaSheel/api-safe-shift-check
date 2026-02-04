/**
 * Notification Controller
 * Handles notification HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services';
import { CreateNotificationDto, NotificationFilter, NotificationType } from '../types';

export class NotificationController {
  
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: NotificationFilter = {
        UserId: req.query.UserId as string | undefined,
        Type: req.query.Type as NotificationType | undefined,
        IsRead: req.query.IsRead === 'true' ? true : req.query.IsRead === 'false' ? false : undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
        SortBy: req.query.SortBy as string | undefined,
        SortOrder: req.query.SortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await notificationService.findAll(filter);

      res.json({
        Success: true,
        Data: result.Data,
        Total: result.Total,
        Page: result.Page,
        PageSize: result.PageSize,
        TotalPages: result.TotalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await notificationService.findById(id);

      if (!notification) {
        res.status(404).json({
          Success: false,
          Message: 'Notification not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notificationData: CreateNotificationDto = {
        UserId: req.body.UserId,
        Type: req.body.Type,
        Title: req.body.Title,
        Message: req.body.Message,
        ActionUrl: req.body.ActionUrl,
      };

      const notification = await notificationService.create(notificationData);

      res.status(201).json({
        Success: true,
        Data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await notificationService.delete(id);

      if (!deleted) {
        res.status(404).json({
          Success: false,
          Message: 'Notification not found',
        });
        return;
      }

      res.json({
        Success: true,
        Message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id);

      if (!notification) {
        res.status(404).json({
          Success: false,
          Message: 'Notification not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || (req as Request & { user?: { UserId: string } }).user?.UserId;

      if (!userId) {
        res.status(400).json({
          Success: false,
          Message: 'User ID is required',
        });
        return;
      }

      const count = await notificationService.markAllAsReadForUser(userId);

      res.json({
        Success: true,
        Data: { MarkedCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  async getByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const notifications = await notificationService.getNotificationsByUserId(userId);

      res.json({
        Success: true,
        Data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const notifications = await notificationService.getUnreadNotificationsByUserId(userId);

      res.json({
        Success: true,
        Data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAllForUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const count = await notificationService.deleteAllForUser(userId);

      res.json({
        Success: true,
        Data: { DeletedCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  async countUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || (req as Request & { user?: { UserId: string } }).user?.UserId;

      if (!userId) {
        res.status(400).json({
          Success: false,
          Message: 'User ID is required',
        });
        return;
      }

      const count = await notificationService.countUnreadForUser(userId);

      res.json({
        Success: true,
        Data: { UnreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  async sendBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { UserIds, Type, Title, Message, ActionUrl } = req.body;
      const notifications = await notificationService.sendBulkNotification(
        UserIds,
        { Type, Title, Message, ActionUrl }
      );

      res.status(201).json({
        Success: true,
        Data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendToRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { Role, Type, Title, Message, ActionUrl } = req.body;
      const notifications = await notificationService.sendNotificationToRole(
        Role,
        { Type, Title, Message, ActionUrl }
      );

      res.status(201).json({
        Success: true,
        Data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const notificationController = new NotificationController();
