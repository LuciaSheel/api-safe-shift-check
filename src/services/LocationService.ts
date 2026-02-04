/**
 * Location Service
 * Handles location business logic
 */

import { locationRepository, LocationFilter } from '../repositories';
import {
  Location,
  CreateLocationDto,
  UpdateLocationDto,
  PaginatedResponse,
} from '../types';

export class LocationService {
  
  async findAll(filter?: LocationFilter): Promise<PaginatedResponse<Location>> {
    return locationRepository.findAll(filter);
  }

  async findById(id: string): Promise<Location | null> {
    return locationRepository.findById(id);
  }

  async create(data: CreateLocationDto): Promise<Location> {
    // Validate coordinates
    if (data.Latitude < -90 || data.Latitude > 90) {
      throw new Error('Invalid latitude. Must be between -90 and 90.');
    }
    if (data.Longitude < -180 || data.Longitude > 180) {
      throw new Error('Invalid longitude. Must be between -180 and 180.');
    }

    return locationRepository.create(data);
  }

  async update(id: string, data: UpdateLocationDto): Promise<Location | null> {
    // Check if location exists
    const exists = await locationRepository.exists(id);
    if (!exists) {
      return null;
    }

    // Validate coordinates if provided
    if (data.Latitude !== undefined && (data.Latitude < -90 || data.Latitude > 90)) {
      throw new Error('Invalid latitude. Must be between -90 and 90.');
    }
    if (data.Longitude !== undefined && (data.Longitude < -180 || data.Longitude > 180)) {
      throw new Error('Invalid longitude. Must be between -180 and 180.');
    }

    return locationRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return locationRepository.delete(id);
  }

  async activate(id: string): Promise<Location | null> {
    return locationRepository.update(id, { IsActive: true });
  }

  async deactivate(id: string): Promise<Location | null> {
    return locationRepository.update(id, { IsActive: false });
  }

  async getActiveLocations(): Promise<Location[]> {
    return locationRepository.findActiveLocations();
  }

  async count(filter?: LocationFilter): Promise<number> {
    return locationRepository.count(filter);
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number): Promise<Location[]> {
    const allLocations = await locationRepository.findActiveLocations();
    
    return allLocations.filter(location => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        location.Latitude,
        location.Longitude
      );
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Export singleton instance
export const locationService = new LocationService();
