/**
 * Location Controller
 * Handles location HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { locationService } from '../services';
import { LocationFilter } from '../repositories';
import { CreateLocationDto, UpdateLocationDto } from '../types';

export class LocationController {
  
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: LocationFilter = {
        IsActive: req.query.IsActive === 'true' ? true : req.query.IsActive === 'false' ? false : undefined,
        Search: req.query.Search as string | undefined,
        Page: req.query.Page ? parseInt(req.query.Page as string) : undefined,
        PageSize: req.query.PageSize ? parseInt(req.query.PageSize as string) : undefined,
        SortBy: req.query.SortBy as string | undefined,
        SortOrder: req.query.SortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await locationService.findAll(filter);

      res.json({
        Success: true,
        Data: result.Data,
        Total: result.Total,
        Page: result.Page,
        PageSize: result.PageSize,
        TotalPages: result.TotalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const location = await locationService.findById(id);

      if (!location) {
        res.status(404).json({
          Success: false,
          Message: 'Location not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locationData: CreateLocationDto = {
        Name: req.body.Name,
        Address: req.body.Address,
        Latitude: req.body.Latitude,
        Longitude: req.body.Longitude,
      };

      const location = await locationService.create(locationData);

      res.status(201).json({
        Success: true,
        Data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateLocationDto = {
        Name: req.body.Name,
        Address: req.body.Address,
        Latitude: req.body.Latitude,
        Longitude: req.body.Longitude,
        IsActive: req.body.IsActive,
      };

      const location = await locationService.update(id, updateData);

      if (!location) {
        res.status(404).json({
          Success: false,
          Message: 'Location not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await locationService.delete(id);

      if (!deleted) {
        res.status(404).json({
          Success: false,
          Message: 'Location not found',
        });
        return;
      }

      res.json({
        Success: true,
        Message: 'Location deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const location = await locationService.activate(id);

      if (!location) {
        res.status(404).json({
          Success: false,
          Message: 'Location not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const location = await locationService.deactivate(id);

      if (!location) {
        res.status(404).json({
          Success: false,
          Message: 'Location not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locations = await locationService.getActiveLocations();

      res.json({
        Success: true,
        Data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  async findNearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = parseFloat(req.query.radius as string) || 10;

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          Success: false,
          Message: 'Invalid latitude or longitude',
        });
        return;
      }

      const locations = await locationService.findNearby(latitude, longitude, radius);

      res.json({
        Success: true,
        Data: locations,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const locationController = new LocationController();
