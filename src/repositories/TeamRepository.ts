/**
 * Team Repository
 * Handles all data access operations for Team entities
 */

import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/dataStore';
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  PaginatedRequest,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';

export interface TeamFilter extends PaginatedRequest {
  ManagerId?: string;
  Search?: string;
}

export class TeamRepository implements IBaseRepository<Team, CreateTeamDto, UpdateTeamDto, TeamFilter> {
  
  async findAll(filter?: TeamFilter): Promise<PaginatedResponse<Team>> {
    let filteredTeams = [...dataStore.teams];

    // Apply filters
    if (filter) {
      if (filter.ManagerId) {
        filteredTeams = filteredTeams.filter(t => t.ManagerId === filter.ManagerId);
      }
      if (filter.Search) {
        const search = filter.Search.toLowerCase();
        filteredTeams = filteredTeams.filter(t => t.Name.toLowerCase().includes(search));
      }

      // Apply sorting
      if (filter.SortBy) {
        const sortOrder = filter.SortOrder === 'desc' ? -1 : 1;
        filteredTeams.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[filter.SortBy!];
          const bVal = (b as Record<string, unknown>)[filter.SortBy!];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal) * sortOrder;
          }
          return 0;
        });
      }
    }

    // Apply pagination
    const page = filter?.Page || 1;
    const pageSize = filter?.PageSize || 10;
    const total = filteredTeams.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedTeams = filteredTeams.slice(startIndex, startIndex + pageSize);

    return {
      Data: paginatedTeams,
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: totalPages,
    };
  }

  async findById(id: string): Promise<Team | null> {
    return dataStore.teams.find(t => t.Id === id) || null;
  }

  async create(data: CreateTeamDto): Promise<Team> {
    const newTeam: Team = {
      Id: `team-${uuidv4()}`,
      Name: data.Name,
      ManagerId: data.ManagerId,
      MemberIds: data.MemberIds || [],
      CreatedAt: new Date().toISOString(),
    };
    dataStore.teams.push(newTeam);
    return newTeam;
  }

  async update(id: string, data: UpdateTeamDto): Promise<Team | null> {
    const index = dataStore.teams.findIndex(t => t.Id === id);
    if (index === -1) return null;

    dataStore.teams[index] = {
      ...dataStore.teams[index],
      ...data,
      UpdatedAt: new Date().toISOString(),
    };

    return dataStore.teams[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = dataStore.teams.findIndex(t => t.Id === id);
    if (index === -1) return false;

    dataStore.teams.splice(index, 1);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    return dataStore.teams.some(t => t.Id === id);
  }

  async count(filter?: TeamFilter): Promise<number> {
    let filteredTeams = [...dataStore.teams];

    if (filter) {
      if (filter.ManagerId) {
        filteredTeams = filteredTeams.filter(t => t.ManagerId === filter.ManagerId);
      }
    }

    return filteredTeams.length;
  }

  async findByManagerId(managerId: string): Promise<Team | null> {
    return dataStore.teams.find(t => t.ManagerId === managerId) || null;
  }

  async findTeamsByMemberId(memberId: string): Promise<Team[]> {
    return dataStore.teams.filter(t => t.MemberIds.includes(memberId));
  }

  async addMember(teamId: string, memberId: string): Promise<Team | null> {
    const index = dataStore.teams.findIndex(t => t.Id === teamId);
    if (index === -1) return null;

    if (!dataStore.teams[index].MemberIds.includes(memberId)) {
      dataStore.teams[index].MemberIds.push(memberId);
      dataStore.teams[index].UpdatedAt = new Date().toISOString();
    }

    return dataStore.teams[index];
  }

  async removeMember(teamId: string, memberId: string): Promise<Team | null> {
    const index = dataStore.teams.findIndex(t => t.Id === teamId);
    if (index === -1) return null;

    dataStore.teams[index].MemberIds = dataStore.teams[index].MemberIds.filter(
      id => id !== memberId
    );
    dataStore.teams[index].UpdatedAt = new Date().toISOString();

    return dataStore.teams[index];
  }
}

// Export singleton instance
export const teamRepository = new TeamRepository();
