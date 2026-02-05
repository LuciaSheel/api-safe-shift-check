/**
 * Authentication Middleware
 * Handles JWT token verification and authorization
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload, UserRole } from '../types';
import { userRepository } from '../repositories';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Verify JWT token and attach user to request
 * Also validates that the token version matches the user's current version
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      Success: false,
      Message: 'No authorization header provided',
    });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Verify token version matches current user's version
    const user = await userRepository.findById(decoded.UserId);
    if (!user) {
      res.status(401).json({
        Success: false,
        Message: 'User not found',
      });
      return;
    }

    const currentTokenVersion = user.TokenVersion || 1;
    const tokenVersion = decoded.TokenVersion || 1;
    
    if (tokenVersion !== currentTokenVersion) {
      res.status(401).json({
        Success: false,
        Message: 'Token has been invalidated. Please log in again.',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      Success: false,
      Message: 'Invalid or expired token',
    });
  }
}

/**
 * Optional authentication - continues even if no token provided
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
  } catch {
    // Token invalid, but continue without user
  }
  
  next();
}

/**
 * Authorize specific roles
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        Success: false,
        Message: 'Unauthorized',
      });
      return;
    }

    if (!roles.includes(req.user.Role)) {
      res.status(403).json({
        Success: false,
        Message: 'Forbidden - Insufficient permissions',
      });
      return;
    }

    next();
  };
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  authorize('Administrator')(req, res, next);
}

/**
 * Require admin role (for reports access)
 */
export function requireManagerOrAdmin(req: Request, res: Response, next: NextFunction): void {
  authorize('Administrator')(req, res, next);
}

/**
 * Any authenticated user can do shifts
 */
export function requireWorker(req: Request, res: Response, next: NextFunction): void {
  authorize('Cleaner', 'Booker', 'Director', 'BackupContact', 'Administrator')(req, res, next);
}
