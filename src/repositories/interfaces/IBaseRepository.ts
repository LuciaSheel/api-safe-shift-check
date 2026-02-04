/**
 * Base Repository Interface
 * Defines the contract for all repository implementations
 * This abstraction allows for easy swapping between different data sources
 */

import { PaginatedResponse } from '../../types';

export interface IBaseRepository<T, CreateDto, UpdateDto, FilterDto> {
  /**
   * Find all entities with optional filtering and pagination
   */
  findAll(filter?: FilterDto): Promise<PaginatedResponse<T>>;

  /**
   * Find a single entity by its ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Create a new entity
   */
  create(data: CreateDto): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: string, data: UpdateDto): Promise<T | null>;

  /**
   * Delete an entity by its ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if an entity exists by its ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count entities matching the filter
   */
  count(filter?: FilterDto): Promise<number>;
}

/**
 * Database connection interface for future implementations
 */
export interface IDatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

/**
 * Transaction interface for atomic operations
 */
export interface ITransaction {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
