/**
 * Team Service
 * Handles team business logic
 */

import { teamRepository, userRepository, TeamFilter } from '../repositories';
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  PaginatedResponse,
  User,
} from '../types';

export class TeamService {
  
  async findAll(filter?: TeamFilter): Promise<PaginatedResponse<Team>> {
    return teamRepository.findAll(filter);
  }

  async findById(id: string): Promise<Team | null> {
    return teamRepository.findById(id);
  }

  async create(data: CreateTeamDto): Promise<Team> {
    // Validate manager exists and has appropriate role
    const manager = await userRepository.findById(data.ManagerId);
    if (!manager) {
      throw new Error('Director not found');
    }
    if (manager.Role !== 'Director' && manager.Role !== 'Administrator') {
      throw new Error('User is not a director');
    }

    // Validate all member IDs exist
    if (data.MemberIds) {
      for (const memberId of data.MemberIds) {
        const member = await userRepository.findById(memberId);
        if (!member) {
          throw new Error(`Member with ID ${memberId} not found`);
        }
      }
    }

    const team = await teamRepository.create(data);

    // Update manager's TeamId
    await userRepository.update(data.ManagerId, { TeamId: team.Id });

    // Update members' TeamId
    if (data.MemberIds) {
      for (const memberId of data.MemberIds) {
        await userRepository.update(memberId, { TeamId: team.Id });
      }
    }

    return team;
  }

  async update(id: string, data: UpdateTeamDto): Promise<Team | null> {
    const team = await teamRepository.findById(id);
    if (!team) {
      return null;
    }

    // If manager is being changed
    if (data.ManagerId && data.ManagerId !== team.ManagerId) {
      const newManager = await userRepository.findById(data.ManagerId);
      if (!newManager) {
        throw new Error('New director not found');
      }
      if (newManager.Role !== 'Director' && newManager.Role !== 'Administrator') {
        throw new Error('User is not a director');
      }

      // Remove TeamId from old manager
      await userRepository.update(team.ManagerId, { TeamId: undefined });
      // Set TeamId for new manager
      await userRepository.update(data.ManagerId, { TeamId: id });
    }

    return teamRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    const team = await teamRepository.findById(id);
    if (!team) {
      return false;
    }

    // Remove TeamId from manager
    await userRepository.update(team.ManagerId, { TeamId: undefined });

    // Remove TeamId from all members
    for (const memberId of team.MemberIds) {
      await userRepository.update(memberId, { TeamId: undefined });
    }

    return teamRepository.delete(id);
  }

  async addMember(teamId: string, memberId: string): Promise<Team | null> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = await userRepository.findById(memberId);
    if (!member) {
      throw new Error('User not found');
    }

    // Update user's TeamId
    await userRepository.update(memberId, { TeamId: teamId });

    return teamRepository.addMember(teamId, memberId);
  }

  async removeMember(teamId: string, memberId: string): Promise<Team | null> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Remove TeamId from user
    await userRepository.update(memberId, { TeamId: undefined });

    return teamRepository.removeMember(teamId, memberId);
  }

  async getTeamByManagerId(managerId: string): Promise<Team | null> {
    return teamRepository.findByManagerId(managerId);
  }

  async getTeamsByMemberId(memberId: string): Promise<Team[]> {
    return teamRepository.findTeamsByMemberId(memberId);
  }

  async getTeamMembers(teamId: string): Promise<User[]> {
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const members: User[] = [];
    for (const memberId of team.MemberIds) {
      const member = await userRepository.findById(memberId);
      if (member) {
        members.push(member);
      }
    }

    return members;
  }

  async getTeamWithDetails(id: string): Promise<{
    team: Team;
    manager: { Id: string; FirstName: string; LastName: string; Email: string } | null;
    members: { Id: string; FirstName: string; LastName: string; Email: string; Role: string }[];
  } | null> {
    const team = await teamRepository.findById(id);
    if (!team) {
      return null;
    }

    const manager = await userRepository.findById(team.ManagerId);
    const members = await this.getTeamMembers(id);

    return {
      team,
      manager: manager ? {
        Id: manager.Id,
        FirstName: manager.FirstName,
        LastName: manager.LastName,
        Email: manager.Email,
      } : null,
      members: members.map(m => ({
        Id: m.Id,
        FirstName: m.FirstName,
        LastName: m.LastName,
        Email: m.Email,
        Role: m.Role,
      })),
    };
  }

  async count(filter?: TeamFilter): Promise<number> {
    return teamRepository.count(filter);
  }
}

// Export singleton instance
export const teamService = new TeamService();
