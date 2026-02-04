/**
 * Team Controller
 * Handles team HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services';
import { TeamFilter } from '../repositories';
import { CreateTeamDto, UpdateTeamDto } from '../types';

export class TeamController {
  
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: TeamFilter = {
        ManagerId: req.query.ManagerId as string | undefined,
        Search: req.query.Search as string | undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
        SortBy: req.query.SortBy as string | undefined,
        SortOrder: req.query.SortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await teamService.findAll(filter);

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
      const team = await teamService.findById(id);

      if (!team) {
        res.status(404).json({
          Success: false,
          Message: 'Team not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teamData: CreateTeamDto = {
        Name: req.body.Name,
        ManagerId: req.body.ManagerId,
        MemberIds: req.body.MemberIds,
      };

      const team = await teamService.create(teamData);

      res.status(201).json({
        Success: true,
        Data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateTeamDto = {
        Name: req.body.Name,
        ManagerId: req.body.ManagerId,
        MemberIds: req.body.MemberIds,
      };

      const team = await teamService.update(id, updateData);

      if (!team) {
        res.status(404).json({
          Success: false,
          Message: 'Team not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await teamService.delete(id);

      if (!deleted) {
        res.status(404).json({
          Success: false,
          Message: 'Team not found',
        });
        return;
      }

      res.json({
        Success: true,
        Message: 'Team deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, memberId } = req.params;
      const team = await teamService.addMember(id, memberId);

      if (!team) {
        res.status(404).json({
          Success: false,
          Message: 'Team not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, memberId } = req.params;
      const team = await teamService.removeMember(id, memberId);

      if (!team) {
        res.status(404).json({
          Success: false,
          Message: 'Team not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByManagerId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { managerId } = req.params;
      const team = await teamService.getTeamByManagerId(managerId);

      if (!team) {
        res.status(404).json({
          Success: false,
          Message: 'Team not found for this manager',
        });
        return;
      }

      res.json({
        Success: true,
        Data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTeamMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const members = await teamService.getTeamMembers(id);

      res.json({
        Success: true,
        Data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWithDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const details = await teamService.getTeamWithDetails(id);

      if (!details) {
        res.status(404).json({
          Success: false,
          Message: 'Team not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: details,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const teamController = new TeamController();
