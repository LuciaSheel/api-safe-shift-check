/**
 * Alert Repository
 * Handles all data access operations for Alert entities
 */

import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../data/dataStore';
import {
  Alert,
  CreateAlertDto,
  UpdateAlertDto,
  AlertFilter,
  PaginatedResponse,
} from '../types';
import { IBaseRepository } from './interfaces';

export class AlertRepository implements IBaseRepository<Alert, CreateAlertDto, UpdateAlertDto, AlertFilter> {
  
  async findAll(filter?: AlertFilter): Promise<PaginatedResponse<Alert>> {
    let filteredAlerts = [...dataStore.alerts];

    // Apply filters
    if (filter) {
      if (filter.WorkerId) {
        filteredAlerts = filteredAlerts.filter(a => a.WorkerId === filter.WorkerId);
      }
      if (filter.BackupContactId) {
        filteredAlerts = filteredAlerts.filter(a => a.BackupContactId === filter.BackupContactId);
      }
      if (filter.Status) {
        filteredAlerts = filteredAlerts.filter(a => a.Status === filter.Status);
      }
      if (filter.Severity) {
        filteredAlerts = filteredAlerts.filter(a => a.Severity === filter.Severity);
      }
      if (filter.Type) {
        filteredAlerts = filteredAlerts.filter(a => a.Type === filter.Type);
      }
      if (filter.StartDate) {
        const startDate = new Date(filter.StartDate);
        filteredAlerts = filteredAlerts.filter(a => new Date(a.CreatedAt) >= startDate);
      }
      if (filter.EndDate) {
        const endDate = new Date(filter.EndDate);
        filteredAlerts = filteredAlerts.filter(a => new Date(a.CreatedAt) <= endDate);
      }

      // Apply sorting
      if (filter.SortBy) {
        const sortOrder = filter.SortOrder === 'desc' ? -1 : 1;
        filteredAlerts.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[filter.SortBy!];
          const bVal = (b as Record<string, unknown>)[filter.SortBy!];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal) * sortOrder;
          }
          return 0;
        });
      } else {
        // Default sort by CreatedAt descending
        filteredAlerts.sort((a, b) => 
          new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime()
        );
      }
    }

    // Apply pagination
    const page = filter?.Page || 1;
    const pageSize = filter?.PageSize || 10;
    const total = filteredAlerts.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + pageSize);

    return {
      Data: paginatedAlerts,
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: totalPages,
    };
  }

  async findById(id: string): Promise<Alert | null> {
    return dataStore.alerts.find(a => a.Id === id) || null;
  }

  async create(data: CreateAlertDto): Promise<Alert> {
    const newAlert: Alert = {
      Id: `alert-${uuidv4()}`,
      ShiftId: data.ShiftId,
      WorkerId: data.WorkerId,
      BackupContactId: data.BackupContactId,
      Type: data.Type,
      Severity: data.Severity,
      Message: data.Message,
      Status: 'Active',
      CreatedAt: new Date().toISOString(),
    };
    dataStore.alerts.push(newAlert);
    return newAlert;
  }

  async update(id: string, data: UpdateAlertDto): Promise<Alert | null> {
    const index = dataStore.alerts.findIndex(a => a.Id === id);
    if (index === -1) return null;

    dataStore.alerts[index] = {
      ...dataStore.alerts[index],
      ...data,
    };

    return dataStore.alerts[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = dataStore.alerts.findIndex(a => a.Id === id);
    if (index === -1) return false;

    dataStore.alerts.splice(index, 1);
    return true;
  }

  async exists(id: string): Promise<boolean> {
    return dataStore.alerts.some(a => a.Id === id);
  }

  async count(filter?: AlertFilter): Promise<number> {
    let filteredAlerts = [...dataStore.alerts];

    if (filter) {
      if (filter.Status) {
        filteredAlerts = filteredAlerts.filter(a => a.Status === filter.Status);
      }
      if (filter.WorkerId) {
        filteredAlerts = filteredAlerts.filter(a => a.WorkerId === filter.WorkerId);
      }
    }

    return filteredAlerts.length;
  }

  async findActiveAlerts(): Promise<Alert[]> {
    return dataStore.alerts
      .filter(a => a.Status === 'Active')
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
  }

  async findByWorkerId(workerId: string): Promise<Alert[]> {
    return dataStore.alerts
      .filter(a => a.WorkerId === workerId)
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
  }

  async findByBackupContactId(backupContactId: string): Promise<Alert[]> {
    return dataStore.alerts
      .filter(a => a.BackupContactId === backupContactId)
      .sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert | null> {
    const index = dataStore.alerts.findIndex(a => a.Id === id);
    if (index === -1) return null;

    dataStore.alerts[index] = {
      ...dataStore.alerts[index],
      Status: 'Acknowledged',
      AcknowledgedAt: new Date().toISOString(),
      AcknowledgedBy: acknowledgedBy,
    };

    return dataStore.alerts[index];
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<Alert | null> {
    const index = dataStore.alerts.findIndex(a => a.Id === id);
    if (index === -1) return null;

    dataStore.alerts[index] = {
      ...dataStore.alerts[index],
      Status: 'Resolved',
      ResolvedAt: new Date().toISOString(),
      ResolvedBy: resolvedBy,
    };

    return dataStore.alerts[index];
  }

  async countPendingAlerts(): Promise<number> {
    return dataStore.alerts.filter(a => a.Status === 'Active').length;
  }
}

// Export singleton instance
export const alertRepository = new AlertRepository();
