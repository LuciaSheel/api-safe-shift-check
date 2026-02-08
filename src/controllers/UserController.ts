/**
 * User Controller
 * Handles user HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { CreateUserDto, UpdateUserDto, UserFilter, UserRole } from '../types';

export class UserController {

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: UserFilter = {
        Role: req.query.Role as UserRole | undefined,
        IsActive: req.query.IsActive === 'true' ? true : req.query.IsActive === 'false' ? false : undefined,
        TeamId: req.query.TeamId as string | undefined,
        Search: req.query.Search as string | undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
        SortBy: req.query.SortBy as string | undefined,
        SortOrder: req.query.SortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await userService.findAll(filter);

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
      const user = await userService.findById(id);

      if (!user) {
        res.status(404).json({
          Success: false,
          Message: 'User not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserDto = {
        Email: req.body.Email,
        Password: req.body.Password,
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Role: req.body.Role,
        Phone: req.body.Phone,
        Avatar: req.body.Avatar,
        TeamId: req.body.TeamId,
        AssignedBackupContactIds: req.body.AssignedBackupContactIds,
        AssignedWorkerIds: req.body.AssignedWorkerIds,
      };

      const user = await userService.create(userData);

      res.status(201).json({
        Success: true,
        Data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      // Only include fields that are explicitly provided (not undefined)
      const updateData: UpdateUserDto = {};
      if (req.body.Email !== undefined) updateData.Email = req.body.Email;
      if (req.body.FirstName !== undefined) updateData.FirstName = req.body.FirstName;
      if (req.body.LastName !== undefined) updateData.LastName = req.body.LastName;
      if (req.body.Phone !== undefined) updateData.Phone = req.body.Phone;
      if (req.body.Avatar !== undefined) updateData.Avatar = req.body.Avatar;
      if (req.body.IsActive !== undefined) updateData.IsActive = req.body.IsActive;
      if (req.body.TeamId !== undefined) updateData.TeamId = req.body.TeamId;
      if (req.body.AssignedBackupContactIds !== undefined) updateData.AssignedBackupContactIds = req.body.AssignedBackupContactIds;
      if (req.body.AssignedWorkerIds !== undefined) updateData.AssignedWorkerIds = req.body.AssignedWorkerIds;
      if (req.body.Role !== undefined) updateData.Role = req.body.Role;

      const user = await userService.update(id, updateData);

      if (!user) {
        res.status(404).json({
          Success: false,
          Message: 'User not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await userService.delete(id);

      if (!deleted) {
        res.status(404).json({
          Success: false,
          Message: 'User not found',
        });
        return;
      }

      res.json({
        Success: true,
        Message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.activate(id);

      if (!user) {
        res.status(404).json({
          Success: false,
          Message: 'User not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.deactivate(id);

      if (!user) {
        res.status(404).json({
          Success: false,
          Message: 'User not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: UserFilter = {
        IsActive: req.query.IsActive === 'true' ? true : req.query.IsActive === 'false' ? false : undefined,
        TeamId: req.query.TeamId as string | undefined,
        Search: req.query.Search as string | undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
      };

      const result = await userService.getWorkers(filter);

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

  async getBackupContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: UserFilter = {
        IsActive: req.query.IsActive === 'true' ? true : undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
      };

      const result = await userService.getBackupContacts(filter);

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

  async assignBackupContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = req.params.id;
      const { BackupContactId } = req.body;
      const user = await userService.assignBackupContact(workerId, BackupContactId);

      res.json({
        Success: true,
        Data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeBackupContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = req.params.id;
      const { backupContactId } = req.params;
      const user = await userService.removeBackupContact(workerId, backupContactId);

      res.json({
        Success: true,
        Data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBackupContactsByWorkerId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workerId } = req.params;
      const backupContacts = await userService.getBackupContactsByWorkerId(workerId);

      res.json({
        Success: true,
        Data: backupContacts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyAssignedWorkers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.UserId;
      if (!userId) {
        res.status(401).json({
          Success: false,
          Message: 'Not authenticated',
        });
        return;
      }

      const workers = await userService.getWorkersByBackupContactId(userId);

      res.json({
        Success: true,
        Data: workers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkersByBackupContactId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { backupContactId } = req.params;
      const workers = await userService.getWorkersByBackupContactId(backupContactId);

      res.json({
        Success: true,
        Data: workers,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const userController = new UserController();
