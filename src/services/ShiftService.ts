/**
 * Shift Service
 * Handles shift business logic
 */

import { 
  shiftRepository, 
  userRepository, 
  locationRepository,
  checkInRepository 
} from '../repositories';
import {
  Shift,
  CreateShiftDto,
  UpdateShiftDto,
  ShiftFilter,
  PaginatedResponse,
  CheckIn,
} from '../types';
import { systemSettingsRepository } from '../repositories/SystemSettingsRepository';

export class ShiftService {
  
  async findAll(filter?: ShiftFilter): Promise<PaginatedResponse<Shift>> {
    return shiftRepository.findAll(filter);
  }

  async findById(id: string): Promise<Shift | null> {
    return shiftRepository.findById(id);
  }

  async create(data: CreateShiftDto): Promise<Shift> {
    // Validate worker exists and is active
    const worker = await userRepository.findById(data.WorkerId);
    if (!worker) {
      throw new Error('Worker not found');
    }
    if (!worker.IsActive) {
      throw new Error('Worker is not active');
    }
    if (worker.Role !== 'Worker') {
      throw new Error('User is not a worker');
    }

    // Validate location exists and is active
    const location = await locationRepository.findById(data.LocationId);
    if (!location) {
      throw new Error('Location not found');
    }
    if (!location.IsActive) {
      throw new Error('Location is not active');
    }

    // Check for existing active shift
    const activeShift = await shiftRepository.findActiveShiftByWorkerId(data.WorkerId);
    if (activeShift) {
      throw new Error('Worker already has an active shift');
    }

    // Get default check-in interval from system settings if not provided
    if (!data.CheckInIntervalMinutes) {
      const settings = await systemSettingsRepository.get();
      data.CheckInIntervalMinutes = settings.CheckInIntervalMinutes;
    }

    return shiftRepository.create(data);
  }

  async update(id: string, data: UpdateShiftDto): Promise<Shift | null> {
    const exists = await shiftRepository.exists(id);
    if (!exists) {
      return null;
    }

    return shiftRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return shiftRepository.delete(id);
  }

  async startShift(workerId: string, locationId: string, estimatedHours: number, notes?: string): Promise<Shift> {
    const estimatedEndTime = new Date(Date.now() + estimatedHours * 60 * 60 * 1000).toISOString();
    
    return this.create({
      WorkerId: workerId,
      LocationId: locationId,
      EstimatedEndTime: estimatedEndTime,
      Notes: notes,
    });
  }

  async endShift(id: string): Promise<Shift | null> {
    const shift = await shiftRepository.findById(id);
    if (!shift) {
      return null;
    }

    if (shift.Status !== 'Active') {
      throw new Error('Shift is not active');
    }

    return shiftRepository.endShift(id);
  }

  async cancelShift(id: string): Promise<Shift | null> {
    const shift = await shiftRepository.findById(id);
    if (!shift) {
      return null;
    }

    if (shift.Status !== 'Active') {
      throw new Error('Shift is not active');
    }

    return shiftRepository.update(id, {
      Status: 'Cancelled',
      EndTime: new Date().toISOString(),
    });
  }

  async getActiveShiftByWorkerId(workerId: string): Promise<Shift | null> {
    return shiftRepository.findActiveShiftByWorkerId(workerId);
  }

  async getActiveShifts(): Promise<Shift[]> {
    return shiftRepository.findActiveShifts();
  }

  async getShiftsByWorkerId(workerId: string): Promise<Shift[]> {
    return shiftRepository.findShiftsByWorkerId(workerId);
  }

  async getTodaysShifts(): Promise<Shift[]> {
    return shiftRepository.findTodaysShifts();
  }

  async getShiftWithDetails(id: string): Promise<{
    shift: Shift;
    worker: { Id: string; FirstName: string; LastName: string; Email: string } | null;
    location: { Id: string; Name: string; Address: string } | null;
    checkIns: CheckIn[];
  } | null> {
    const shift = await shiftRepository.findById(id);
    if (!shift) {
      return null;
    }

    const worker = await userRepository.findById(shift.WorkerId);
    const location = await locationRepository.findById(shift.LocationId);
    const checkIns = await checkInRepository.findByShiftId(shift.Id);

    return {
      shift,
      worker: worker ? {
        Id: worker.Id,
        FirstName: worker.FirstName,
        LastName: worker.LastName,
        Email: worker.Email,
      } : null,
      location: location ? {
        Id: location.Id,
        Name: location.Name,
        Address: location.Address,
      } : null,
      checkIns,
    };
  }

  async count(filter?: ShiftFilter): Promise<number> {
    return shiftRepository.count(filter);
  }

  async extendShift(id: string, additionalHours: number): Promise<Shift | null> {
    const shift = await shiftRepository.findById(id);
    if (!shift) {
      return null;
    }

    if (shift.Status !== 'Active') {
      throw new Error('Can only extend active shifts');
    }

    const currentEndTime = new Date(shift.EstimatedEndTime);
    const newEndTime = new Date(currentEndTime.getTime() + additionalHours * 60 * 60 * 1000);

    return shiftRepository.update(id, {
      EstimatedEndTime: newEndTime.toISOString(),
    });
  }
}

// Export singleton instance
export const shiftService = new ShiftService();
