/**
 * User Service
 * Handles user business logic
 */

import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  UserFilter,
  PaginatedResponse,
} from '../types';

export class UserService {
  
  async findAll(filter?: UserFilter): Promise<PaginatedResponse<User>> {
    return userRepository.findAll(filter);
  }

  async findById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return userRepository.findByEmail(email);
  }

  async create(data: CreateUserDto): Promise<User> {
    // Validate email uniqueness
    const emailExists = await userRepository.emailExists(data.Email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.Password, 10);

    return userRepository.create({
      ...data,
      Password: hashedPassword,
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User | null> {
    // Check if user exists
    const exists = await userRepository.exists(id);
    if (!exists) {
      return null;
    }

    // If email is being updated, check uniqueness
    if (data.Email) {
      const emailExists = await userRepository.emailExists(data.Email, id);
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    return userRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return userRepository.delete(id);
  }

  async activate(id: string): Promise<User | null> {
    return userRepository.update(id, { IsActive: true });
  }

  async deactivate(id: string): Promise<User | null> {
    return userRepository.update(id, { IsActive: false });
  }

  async getWorkers(filter?: UserFilter): Promise<PaginatedResponse<User>> {
    // Get all users who can do shifts (everyone except pure admins can be filtered here)
    // For backwards compatibility, return Cleaners by default
    return userRepository.findAll({ ...filter, Role: 'Cleaner' });
  }

  async getBackupContacts(filter?: UserFilter): Promise<PaginatedResponse<User>> {
    // Any active user with AssignedWorkerIds can be a backup contact
    const allUsers = await userRepository.findAll({ ...filter, IsActive: true });
    const backupContacts = allUsers.Data.filter(u => u.AssignedWorkerIds && u.AssignedWorkerIds.length > 0);
    return {
      ...allUsers,
      Data: backupContacts,
      Total: backupContacts.length,
    };
  }

  async getManagers(filter?: UserFilter): Promise<PaginatedResponse<User>> {
    return userRepository.findAll({ ...filter, Role: 'Director' });
  }

  async getAdministrators(filter?: UserFilter): Promise<PaginatedResponse<User>> {
    return userRepository.findAll({ ...filter, Role: 'Administrator' });
  }

  async assignBackupContact(workerId: string, backupContactId: string): Promise<User | null> {
    const worker = await userRepository.findById(workerId);
    const backupContact = await userRepository.findById(backupContactId);

    if (!worker) {
      throw new Error('User not found');
    }

    if (!backupContact) {
      throw new Error('Backup contact not found');
    }

    // Add backup contact to worker
    const assignedBackupContactIds = worker.AssignedBackupContactIds || [];
    if (!assignedBackupContactIds.includes(backupContactId)) {
      assignedBackupContactIds.push(backupContactId);
    }

    await userRepository.update(workerId, { AssignedBackupContactIds: assignedBackupContactIds });

    // Add worker to backup contact
    const assignedWorkerIds = backupContact.AssignedWorkerIds || [];
    if (!assignedWorkerIds.includes(workerId)) {
      assignedWorkerIds.push(workerId);
    }

    await userRepository.update(backupContactId, { AssignedWorkerIds: assignedWorkerIds });

    return userRepository.findById(workerId);
  }

  async removeBackupContact(workerId: string, backupContactId: string): Promise<User | null> {
    const worker = await userRepository.findById(workerId);
    const backupContact = await userRepository.findById(backupContactId);

    if (!worker) {
      throw new Error('Worker not found');
    }

    if (!backupContact) {
      throw new Error('Backup contact not found');
    }

    // Remove backup contact from worker
    const assignedBackupContactIds = (worker.AssignedBackupContactIds || []).filter(
      id => id !== backupContactId
    );
    await userRepository.update(workerId, { AssignedBackupContactIds: assignedBackupContactIds });

    // Remove worker from backup contact
    const assignedWorkerIds = (backupContact.AssignedWorkerIds || []).filter(
      id => id !== workerId
    );
    await userRepository.update(backupContactId, { AssignedWorkerIds: assignedWorkerIds });

    return userRepository.findById(workerId);
  }

  async getWorkersByBackupContactId(backupContactId: string): Promise<User[]> {
    return userRepository.findWorkersByBackupContactId(backupContactId);
  }

  async getBackupContactsByWorkerId(workerId: string): Promise<User[]> {
    return userRepository.findBackupContactsByWorkerId(workerId);
  }

  async count(filter?: UserFilter): Promise<number> {
    return userRepository.count(filter);
  }
}

// Export singleton instance
export const userService = new UserService();
