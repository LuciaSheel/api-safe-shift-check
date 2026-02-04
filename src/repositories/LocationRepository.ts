/**
 * Location Repository
 * Handles all data access operations for Location entities
 */

import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/dataStore';
import {
  Location,
  CreateLocationDto,
  UpdateLocationDto,
  PaginatedRequest,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';

export interface LocationFilter extends PaginatedRequest {
  IsActive?: boolean;
  Search?: string;
}

export class LocationRepository implements IBaseRepository<Location, CreateLocationDto, UpdateLocationDto, LocationFilter> {
  
  async findAll(filter?: LocationFilter): Promise<PaginatedResponse<Location>> {
    let filteredLocations = [...dataStore.locations];

    // Apply filters
    if (filter) {
      if (filter.IsActive !== undefined) {
        filteredLocations = filteredLocations.filter(l => l.IsActive === filter.IsActive);
      }
      if (filter.Search) {
        const search = filter.Search.toLowerCase();
        filteredLocations = filteredLocations.filter(
          l =>
            l.Name.toLowerCase().includes(search) ||
            l.Address.toLowerCase().includes(search)
        );
      }

      // Apply sorting
      if (filter.SortBy) {
        const sortOrder = filter.SortOrder === 'desc' ? -1 : 1;
        filteredLocations.sort((a, b) => {
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
    const total = filteredLocations.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedLocations = filteredLocations.slice(startIndex, startIndex + pageSize);

    return {
      Data: paginatedLocations,
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: totalPages,
    };
  }

  async findById(id: string): Promise<Location | null> {
    return dataStore.locations.find(l => l.Id === id) || null;
  }

  async create(data: CreateLocationDto): Promise<Location> {
    const newLocation: Location = {
      Id: `loc-${uuidv4()}`,
      ...data,
      IsActive: true,
      CreatedAt: new Date().toISOString(),
    };
    dataStore.locations.push(newLocation);
    return newLocation;
  }

  async update(id: string, data: UpdateLocationDto): Promise<Location | null> {
    const index = dataStore.locations.findIndex(l => l.Id === id);
    if (index === -1) return null;

    dataStore.locations[index] = {
      ...dataStore.locations[index],
      ...data,
      UpdatedAt: new Date().toISOString(),
    };

    return dataStore.locations[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = dataStore.locations.findIndex(l => l.Id === id);
    if (index === -1) return false;

    dataStore.locations.splice(index, 1);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    return dataStore.locations.some(l => l.Id === id);
  }

  async count(filter?: LocationFilter): Promise<number> {
    let count = dataStore.locations.length;

    if (filter) {
      let filteredLocations = [...dataStore.locations];
      if (filter.IsActive !== undefined) {
        filteredLocations = filteredLocations.filter(l => l.IsActive === filter.IsActive);
      }
      count = filteredLocations.length;
    }

    return count;
  }

  async findActiveLocations(): Promise<Location[]> {
    return dataStore.locations.filter(l => l.IsActive);
  }
}

// Export singleton instance
export const locationRepository = new LocationRepository();
