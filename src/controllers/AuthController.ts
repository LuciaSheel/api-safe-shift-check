/**
 * Auth Controller
 * Handles authentication HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { LoginCredentials, CreateUserDto } from '../types';

export class AuthController {
  
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials: LoginCredentials = {
        Email: req.body.Email,
        Password: req.body.Password,
      };

      const result = await authService.login(credentials);

      if (!result) {
        res.status(401).json({
          Success: false,
          Message: 'Invalid email or password',
        });
        return;
      }

      res.json({
        Success: true,
        Data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserDto = {
        Email: req.body.Email,
        Password: req.body.Password,
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Role: req.body.Role || 'Worker',
        Phone: req.body.Phone,
        Avatar: req.body.Avatar,
        TeamId: req.body.TeamId,
      };

      const result = await authService.register(userData);

      res.status(201).json({
        Success: true,
        Data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          Success: false,
          Message: 'No token provided',
        });
        return;
      }

      const result = await authService.refreshToken(token);

      if (!result) {
        res.status(401).json({
          Success: false,
          Message: 'Invalid or expired token',
        });
        return;
      }

      res.json({
        Success: true,
        Data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as Request & { user?: { UserId: string } }).user?.UserId;

      if (!userId) {
        res.status(401).json({
          Success: false,
          Message: 'Unauthorized',
        });
        return;
      }

      const { CurrentPassword, NewPassword } = req.body;

      await authService.changePassword(userId, CurrentPassword, NewPassword);

      res.json({
        Success: true,
        Message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { Email } = req.body;

      await authService.resetPassword(Email);

      res.json({
        Success: true,
        Message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jwtUser = (req as Request & { user?: { UserId: string; Email: string; Role: string } }).user;

      if (!jwtUser) {
        res.status(401).json({
          Success: false,
          Message: 'Unauthorized',
        });
        return;
      }

      // Fetch full user profile from database
      const user = await authService.getUserById(jwtUser.UserId);
      
      if (!user) {
        res.status(404).json({
          Success: false,
          Message: 'User not found',
        });
        return;
      }

      res.json({
        Success: true,
        Data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jwtUser = (req as Request & { user?: { UserId: string } }).user;

      if (!jwtUser) {
        res.status(401).json({
          Success: false,
          Message: 'Unauthorized',
        });
        return;
      }

      // Increment token version to invalidate all tokens for this user
      await authService.logout(jwtUser.UserId);

      res.json({
        Success: true,
        Message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyResetToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const result = await authService.verifyResetToken(token);

      if (!result.valid) {
        res.status(400).json({
          Success: false,
          Message: 'Invalid or expired reset token',
        });
        return;
      }

      res.json({
        Success: true,
        Data: { Email: result.email },
      });
    } catch (error) {
      next(error);
    }
  }

  async completePasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { Token, NewPassword } = req.body;

      if (!Token || !NewPassword) {
        res.status(400).json({
          Success: false,
          Message: 'Token and new password are required',
        });
        return;
      }

      if (NewPassword.length < 8) {
        res.status(400).json({
          Success: false,
          Message: 'Password must be at least 8 characters long',
        });
        return;
      }

      await authService.completePasswordReset(Token, NewPassword);

      res.json({
        Success: true,
        Message: 'Password has been reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
