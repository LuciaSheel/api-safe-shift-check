/**
 * CheckIn Repository
 * Handles all data access operations for CheckIn entities
 */

import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/dataStore';
import {
  CheckIn,
  CreateCheckInDto,
  UpdateCheckInDto,
  CheckInFilter,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';

export class CheckInRepository implements IBaseRepository<CheckIn, CreateCheckInDto, UpdateCheckInDto, CheckInFilter> {
  
  async findAll(filter?: CheckInFilter): Promise<PaginatedResponse<CheckIn>> {
    let filteredCheckIns = [...dataStore.checkIns];

    // Apply filters
    if (filter) {
      if (filter.ShiftId) {
        filteredCheckIns = filteredCheckIns.filter(c => c.ShiftId === filter.ShiftId);
      }
      if (filter.WorkerId) {
        filteredCheckIns = filteredCheckIns.filter(c => c.WorkerId === filter.WorkerId);
      }
      if (filter.Status) {
        filteredCheckIns = filteredCheckIns.filter(c => c.Status === filter.Status);
      }
      if (filter.StartDate) {
        const startDate = new Date(filter.StartDate);
        filteredCheckIns = filteredCheckIns.filter(c => new Date(c.ScheduledTime) >= startDate);
      }
      if (filter.EndDate) {
        const endDate = new Date(filter.EndDate);
        filteredCheckIns = filteredCheckIns.filter(c => new Date(c.ScheduledTime) <= endDate);
      }

      // Apply sorting
      if (filter.SortBy) {
        const sortOrder = filter.SortOrder === 'desc' ? -1 : 1;
        filteredCheckIns.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[filter.SortBy!];
          const bVal = (b as Record<string, unknown>)[filter.SortBy!];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal) * sortOrder;
          }
          return 0;
        });
      } else {
        // Default sort by ScheduledTime descending
        filteredCheckIns.sort((a, b) => 
          new Date(b.ScheduledTime).getTime() - new Date(a.ScheduledTime).getTime()
        );
      }
    }

    // Apply pagination
    const page = filter?.Page || 1;
    const pageSize = filter?.PageSize || 10;
    const total = filteredCheckIns.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedCheckIns = filteredCheckIns.slice(startIndex, startIndex + pageSize);

    return {
      Data: paginatedCheckIns,
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: totalPages,
    };
  }

  async findById(id: string): Promise<CheckIn | null> {
    return dataStore.checkIns.find(c => c.Id === id) || null;
  }

  async create(data: CreateCheckInDto): Promise<CheckIn> {
    const newCheckIn: CheckIn = {
      Id: `checkin-${uuidv4()}`,
      ShiftId: data.ShiftId,
      WorkerId: data.WorkerId,
      ScheduledTime: data.ScheduledTime,
      Status: 'Pending',
      CreatedAt: new Date().toISOString(),
    };
    dataStore.checkIns.push(newCheckIn);
    return newCheckIn;
  }

  async update(id: string, data: UpdateCheckInDto): Promise<CheckIn | null> {
    const index = dataStore.checkIns.findIndex(c => c.Id === id);
    if (index === -1) return null;

    dataStore.checkIns[index] = {
      ...dataStore.checkIns[index],
      ...data,
    };

    return dataStore.checkIns[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = dataStore.checkIns.findIndex(c => c.Id === id);
    if (index === -1) return false;

    dataStore.checkIns.splice(index, 1);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    return dataStore.checkIns.some(c => c.Id === id);
  }

  async count(filter?: CheckInFilter): Promise<number> {
    let filteredCheckIns = [...dataStore.checkIns];

    if (filter) {
      if (filter.ShiftId) {
        filteredCheckIns = filteredCheckIns.filter(c => c.ShiftId === filter.ShiftId);
      }
      if (filter.WorkerId) {
        filteredCheckIns = filteredCheckIns.filter(c => c.WorkerId === filter.WorkerId);
      }
      if (filter.Status) {
        filteredCheckIns = filteredCheckIns.filter(c => c.Status === filter.Status);
      }
    }

    return filteredCheckIns.length;
  }

  async findByShiftId(shiftId: string): Promise<CheckIn[]> {
    return dataStore.checkIns
      .filter(c => c.ShiftId === shiftId)
      .sort((a, b) => new Date(a.ScheduledTime).getTime() - new Date(b.ScheduledTime).getTime());
  }

  async findByWorkerId(workerId: string): Promise<CheckIn[]> {
    return dataStore.checkIns
      .filter(c => c.WorkerId === workerId)
      .sort((a, b) => new Date(b.ScheduledTime).getTime() - new Date(a.ScheduledTime).getTime());
  }

  async findPendingCheckIns(): Promise<CheckIn[]> {
    return dataStore.checkIns.filter(c => c.Status === 'Pending');
  }

  async confirmCheckIn(id: string, responseSeconds: number): Promise<CheckIn | null> {
    const index = dataStore.checkIns.findIndex(c => c.Id === id);
    if (index === -1) return null;

    dataStore.checkIns[index] = {
      ...dataStore.checkIns[index],
      Status: 'Confirmed',
      ResponseTime: new Date().toISOString(),
      ResponseSeconds: responseSeconds,
    };

    return dataStore.checkIns[index];
  }

  async markAsMissed(id: string): Promise<CheckIn | null> {
    const index = dataStore.checkIns.findIndex(c => c.Id === id);
    if (index === -1) return null;

    dataStore.checkIns[index] = {
      ...dataStore.checkIns[index],
      Status: 'Missed',
    };

    return dataStore.checkIns[index];
  }

  async getAverageResponseTime(workerId?: string): Promise<number> {
    let checkIns = dataStore.checkIns.filter(
      c => c.Status === 'Confirmed' && c.ResponseSeconds !== undefined
    );

    if (workerId) {
      checkIns = checkIns.filter(c => c.WorkerId === workerId);
    }

    if (checkIns.length === 0) return 0;

    const totalResponseTime = checkIns.reduce(
      (sum, c) => sum + (c.ResponseSeconds || 0),
      0
    );

    return Math.round(totalResponseTime / checkIns.length);
  }
}

// Export singleton instance
export const checkInRepository = new CheckInRepository();
