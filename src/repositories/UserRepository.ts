/**
 * User Repository
 * Handles all data access operations for User entities
 */

import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/dataStore';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  UserFilter,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';

export class UserRepository implements IBaseRepository<User, CreateUserDto, UpdateUserDto, UserFilter> {
  
  async findAll(filter?: UserFilter): Promise<PaginatedResponse<User>> {
    let filteredUsers = [...dataStore.users];

    // Apply filters
    if (filter) {
      if (filter.Role) {
        filteredUsers = filteredUsers.filter(u => u.Role === filter.Role);
      }
      if (filter.IsActive !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.IsActive === filter.IsActive);
      }
      if (filter.TeamId) {
        filteredUsers = filteredUsers.filter(u => u.TeamId === filter.TeamId);
      }
      if (filter.Search) {
        const search = filter.Search.toLowerCase();
        filteredUsers = filteredUsers.filter(
          u =>
            u.FirstName.toLowerCase().includes(search) ||
            u.LastName.toLowerCase().includes(search) ||
            u.Email.toLowerCase().includes(search)
        );
      }

      // Apply sorting
      if (filter.SortBy) {
        const sortOrder = filter.SortOrder === 'desc' ? -1 : 1;
        filteredUsers.sort((a, b) => {
          const aVal = (a as unknown as Record<string, unknown>)[filter.SortBy!];
          const bVal = (b as unknown as Record<string, unknown>)[filter.SortBy!];
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
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

    // Remove passwords from response
    const sanitizedUsers = paginatedUsers.map(u => this.sanitizeUser(u));

    return {
      Data: sanitizedUsers,
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: totalPages,
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = dataStore.users.find(u => u.Id === id);
    return user ? this.sanitizeUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = dataStore.users.find(u => u.Email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return dataStore.users.find(u => u.Email.toLowerCase() === email.toLowerCase()) || null;
  }

  async create(data: CreateUserDto): Promise<User> {
    const newUser: User = {
      Id: `user-${uuidv4()}`,
      ...data,
      IsActive: true,
      CreatedAt: new Date().toISOString(),
    };
    dataStore.users.push(newUser);
    return this.sanitizeUser(newUser);
  }

  async update(id: string, data: UpdateUserDto): Promise<User | null> {
    const index = dataStore.users.findIndex(u => u.Id === id);
    if (index === -1) return null;

    dataStore.users[index] = {
      ...dataStore.users[index],
      ...data,
      UpdatedAt: new Date().toISOString(),
    };

    return this.sanitizeUser(dataStore.users[index]);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<boolean> {
    const index = dataStore.users.findIndex(u => u.Id === id);
    if (index === -1) return false;

    dataStore.users[index].Password = hashedPassword;
    dataStore.users[index].UpdatedAt = new Date().toISOString();
    // Increment token version to invalidate existing sessions
    dataStore.users[index].TokenVersion = (dataStore.users[index].TokenVersion || 1) + 1;
    return true;
  }

  async incrementTokenVersion(id: string): Promise<boolean> {
    const index = dataStore.users.findIndex(u => u.Id === id);
    if (index === -1) return false;

    dataStore.users[index].TokenVersion = (dataStore.users[index].TokenVersion || 1) + 1;
    dataStore.users[index].UpdatedAt = new Date().toISOString();
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const index = dataStore.users.findIndex(u => u.Id === id);
    if (index === -1) return false;

    dataStore.users.splice(index, 1);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    return dataStore.users.some(u => u.Id === id);
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    return dataStore.users.some(
      u => u.Email.toLowerCase() === email.toLowerCase() && u.Id !== excludeId
    );
  }

  async count(filter?: UserFilter): Promise<number> {
    let count = dataStore.users.length;

    if (filter) {
      let filteredUsers = [...dataStore.users];
      if (filter.Role) {
        filteredUsers = filteredUsers.filter(u => u.Role === filter.Role);
      }
      if (filter.IsActive !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.IsActive === filter.IsActive);
      }
      count = filteredUsers.length;
    }

    return count;
  }

  async findWorkersByBackupContactId(backupContactId: string): Promise<User[]> {
    const backupContact = dataStore.users.find(u => u.Id === backupContactId);
    if (!backupContact || !backupContact.AssignedWorkerIds) return [];

    return dataStore.users
      .filter(u => backupContact.AssignedWorkerIds?.includes(u.Id))
      .map(u => this.sanitizeUser(u));
  }

  async findBackupContactsByWorkerId(workerId: string): Promise<User[]> {
    const worker = dataStore.users.find(u => u.Id === workerId);
    if (!worker || !worker.AssignedBackupContactIds) return [];

    return dataStore.users
      .filter(u => worker.AssignedBackupContactIds?.includes(u.Id))
      .map(u => this.sanitizeUser(u));
  }

  private sanitizeUser(user: User): User {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Password, ...sanitized } = user;
    return sanitized as User;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
