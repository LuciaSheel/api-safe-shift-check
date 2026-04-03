/**
 * Team Repository (Prisma)
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  PaginatedRequest,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';
import type { Team as PrismaTeam } from '@prisma/client';

export interface TeamFilter extends PaginatedRequest {
  ManagerId?: string;
  Search?: string;
}

function mapTeam(row: PrismaTeam): Team {
  return {
    Id: row.Id,
    Name: row.Name,
    ManagerId: row.ManagerId,
    MemberIds: row.MemberIds,
    CreatedAt: row.CreatedAt.toISOString(),
    UpdatedAt: row.UpdatedAt?.toISOString(),
  };
}

export class TeamRepository implements IBaseRepository<Team, CreateTeamDto, UpdateTeamDto, TeamFilter> {

  async findAll(filter?: TeamFilter): Promise<PaginatedResponse<Team>> {
    const where: Record<string, unknown> = {};
    if (filter?.ManagerId) where.ManagerId = filter.ManagerId;
    if (filter?.Search) {
      where.Name = { contains: filter.Search, mode: 'insensitive' };
    }

    const page = filter?.Page ?? 1;
    const pageSize = filter?.PageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const orderBy = filter?.SortBy
      ? { [filter.SortBy]: (filter.SortOrder ?? 'asc') as 'asc' | 'desc' }
      : { Name: 'asc' as const };

    const [total, rows] = await Promise.all([
      prisma.team.count({ where }),
      prisma.team.findMany({ where, skip, take: pageSize, orderBy }),
    ]);

    return {
      Data: rows.map(mapTeam),
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Team | null> {
    const row = await prisma.team.findUnique({ where: { Id: id } });
    return row ? mapTeam(row) : null;
  }

  async create(data: CreateTeamDto): Promise<Team> {
    const row = await prisma.team.create({
      data: {
        Id: `team-${uuidv4()}`,
        Name: data.Name,
        ManagerId: data.ManagerId,
        MemberIds: data.MemberIds ?? [],
      },
    });
    return mapTeam(row);
  }

  async update(id: string, data: UpdateTeamDto): Promise<Team | null> {
    try {
      const row = await prisma.team.update({
        where: { Id: id },
        data: { ...data, UpdatedAt: new Date() },
      });
      return mapTeam(row);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.team.delete({ where: { Id: id } });
      return true;
    } catch {
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.team.count({ where: { Id: id } });
    return count > 0;
  }

  async count(filter?: TeamFilter): Promise<number> {
    const where: Record<string, unknown> = {};
    if (filter?.ManagerId) where.ManagerId = filter.ManagerId;
    return prisma.team.count({ where });
  }

  async findByManagerId(managerId: string): Promise<Team | null> {
    const row = await prisma.team.findFirst({ where: { ManagerId: managerId } });
    return row ? mapTeam(row) : null;
  }

  async findTeamsByMemberId(memberId: string): Promise<Team[]> {
    const rows = await prisma.team.findMany({
      where: { MemberIds: { has: memberId } },
    });
    return rows.map(mapTeam);
  }

  async addMember(teamId: string, memberId: string): Promise<Team | null> {
    const existing = await prisma.team.findUnique({ where: { Id: teamId } });
    if (!existing) return null;
    if (existing.MemberIds.includes(memberId)) return mapTeam(existing);
    const row = await prisma.team.update({
      where: { Id: teamId },
      data: { MemberIds: { push: memberId }, UpdatedAt: new Date() },
    });
    return mapTeam(row);
  }

  async removeMember(teamId: string, memberId: string): Promise<Team | null> {
    const existing = await prisma.team.findUnique({ where: { Id: teamId } });
    if (!existing) return null;
    const row = await prisma.team.update({
      where: { Id: teamId },
      data: {
        MemberIds: existing.MemberIds.filter(id => id !== memberId),
        UpdatedAt: new Date(),
      },
    });
    return mapTeam(row);
  }
}

export const teamRepository = new TeamRepository();
