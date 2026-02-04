/**
 * Shift Repository
 * Handles all data access operations for Shift entities
 */

import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/dataStore';
import {
  Shift,
  CreateShiftDto,
  UpdateShiftDto,
  ShiftFilter,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';

export class ShiftRepository implements IBaseRepository<Shift, CreateShiftDto, UpdateShiftDto, ShiftFilter> {
  
  async findAll(filter?: ShiftFilter): Promise<PaginatedResponse<Shift>> {
    let filteredShifts = [...dataStore.shifts];

    // Apply filters
    if (filter) {
      if (filter.WorkerId) {
        filteredShifts = filteredShifts.filter(s => s.WorkerId === filter.WorkerId);
      }
      if (filter.LocationId) {
        filteredShifts = filteredShifts.filter(s => s.LocationId === filter.LocationId);
      }
      if (filter.Status) {
        filteredShifts = filteredShifts.filter(s => s.Status === filter.Status);
      }
      if (filter.StartDate) {
        const startDate = new Date(filter.StartDate);
        filteredShifts = filteredShifts.filter(s => new Date(s.StartTime) >= startDate);
      }
      if (filter.EndDate) {
        const endDate = new Date(filter.EndDate);
        filteredShifts = filteredShifts.filter(s => new Date(s.StartTime) <= endDate);
      }

      // Apply sorting
      if (filter.SortBy) {
        const sortOrder = filter.SortOrder === 'desc' ? -1 : 1;
        filteredShifts.sort((a, b) => {
          const aVal = (a as unknown as Record<string, unknown>)[filter.SortBy!];
          const bVal = (b as unknown as Record<string, unknown>)[filter.SortBy!];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal) * sortOrder;
          }
          return 0;
        });
      } else {
        // Default sort by StartTime descending
        filteredShifts.sort((a, b) => 
          new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime()
        );
      }
    }

    // Apply pagination
    const page = filter?.Page || 1;
    const pageSize = filter?.PageSize || 10;
    const total = filteredShifts.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedShifts = filteredShifts.slice(startIndex, startIndex + pageSize);

    return {
      Data: paginatedShifts,
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: totalPages,
    };
  }

  async findById(id: string): Promise<Shift | null> {
    return dataStore.shifts.find(s => s.Id === id) || null;
  }

  async create(data: CreateShiftDto): Promise<Shift> {
    const now = new Date().toISOString();
    const newShift: Shift = {
      Id: `shift-${uuidv4()}`,
      WorkerId: data.WorkerId,
      LocationId: data.LocationId,
      Status: 'Active',
      StartTime: now,
      EstimatedEndTime: data.EstimatedEndTime,
      Notes: data.Notes,
      CheckInIntervalMinutes: data.CheckInIntervalMinutes || 15,
      CreatedAt: now,
    };
    dataStore.shifts.push(newShift);
    return newShift;
  }

  async update(id: string, data: UpdateShiftDto): Promise<Shift | null> {
    const index = dataStore.shifts.findIndex(s => s.Id === id);
    if (index === -1) return null;

    dataStore.shifts[index] = {
      ...dataStore.shifts[index],
      ...data,
      UpdatedAt: new Date().toISOString(),
    };

    return dataStore.shifts[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = dataStore.shifts.findIndex(s => s.Id === id);
    if (index === -1) return false;

    dataStore.shifts.splice(index, 1);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    return dataStore.shifts.some(s => s.Id === id);
  }

  async count(filter?: ShiftFilter): Promise<number> {
    let filteredShifts = [...dataStore.shifts];

    if (filter) {
      if (filter.WorkerId) {
        filteredShifts = filteredShifts.filter(s => s.WorkerId === filter.WorkerId);
      }
      if (filter.Status) {
        filteredShifts = filteredShifts.filter(s => s.Status === filter.Status);
      }
    }

    return filteredShifts.length;
  }

  async findActiveShiftByWorkerId(workerId: string): Promise<Shift | null> {
    return dataStore.shifts.find(
      s => s.WorkerId === workerId && s.Status === 'Active'
    ) || null;
  }

  async findActiveShifts(): Promise<Shift[]> {
    return dataStore.shifts.filter(s => s.Status === 'Active');
  }

  async findShiftsByWorkerId(workerId: string): Promise<Shift[]> {
    return dataStore.shifts
      .filter(s => s.WorkerId === workerId)
      .sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime());
  }

  async findTodaysShifts(): Promise<Shift[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return dataStore.shifts.filter(s => {
      const shiftStart = new Date(s.StartTime);
      return shiftStart >= today && shiftStart < tomorrow;
    });
  }

  async endShift(id: string): Promise<Shift | null> {
    const index = dataStore.shifts.findIndex(s => s.Id === id);
    if (index === -1) return null;

    dataStore.shifts[index] = {
      ...dataStore.shifts[index],
      Status: 'Completed',
      EndTime: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    return dataStore.shifts[index];
  }
}

// Export singleton instance
export const shiftRepository = new ShiftRepository();
