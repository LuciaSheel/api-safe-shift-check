/**
 * Auth Service
 * Handles authentication business logic
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories';
import { 
  User, 
  LoginCredentials, 
  AuthResponse, 
  TokenPayload,
  CreateUserDto 
} from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Demo credentials - these bypass password verification for development
const DEMO_CREDENTIALS: Record<string, string> = {
  'sarah.johnson@example.com': 'demo123',
  'david.taylor@example.com': 'demo123',
  'robert.anderson@example.com': 'demo123',
  'admin@safealone.com': 'admin123',
};

export class AuthService {
  
  async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    const user = await userRepository.findByEmailWithPassword(credentials.Email);
    
    if (!user) {
      return null;
    }

    if (!user.IsActive) {
      throw new Error('Account is inactive');
    }

    // Check demo credentials first (for development)
    const isDemoValid = DEMO_CREDENTIALS[credentials.Email.toLowerCase()] === credentials.Password;
    
    // Then check against hashed password if not demo
    let isPasswordValid = isDemoValid;
    if (!isPasswordValid && user.Password) {
      isPasswordValid = await bcrypt.compare(credentials.Password, user.Password);
    }

    if (!isPasswordValid) {
      return null;
    }

    const token = this.generateToken(user);
    const expiresAt = this.getTokenExpiration();

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Password, ...userWithoutPassword } = user;

    return {
      User: userWithoutPassword,
      Token: token,
      ExpiresAt: expiresAt,
    };
  }

  async register(data: CreateUserDto): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(data.Email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.Password, 10);

    // Create user
    const user = await userRepository.create({
      ...data,
      Password: hashedPassword,
    });

    const token = this.generateToken(user);
    const expiresAt = this.getTokenExpiration();

    return {
      User: user,
      Token: token,
      ExpiresAt: expiresAt,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await userRepository.findByEmailWithPassword(
      (await userRepository.findById(userId))?.Email || ''
    );

    if (!user || !user.Password) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.Password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    return await userRepository.updatePassword(userId, hashedNewPassword);
  }

  async resetPassword(email: string): Promise<boolean> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return true;
    }

    // In a real implementation, this would:
    // 1. Generate a reset token
    // 2. Store the token with expiration
    // 3. Send an email with the reset link

    console.log(`Password reset requested for ${email}`);
    return true;
  }

  async refreshToken(token: string): Promise<AuthResponse | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      const user = await userRepository.findById(decoded.UserId);

      if (!user || !user.IsActive) {
        return null;
      }

      const newToken = this.generateToken(user);
      const expiresAt = this.getTokenExpiration();

      return {
        User: user,
        Token: newToken,
        ExpiresAt: expiresAt,
      };
    } catch {
      return null;
    }
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  private generateToken(user: User): string {
    const payload = {
      UserId: user.Id,
      Email: user.Email,
      Role: user.Role,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  private getTokenExpiration(): string {
    const now = new Date();
    // Parse JWT_EXPIRES_IN (e.g., '7d', '24h', '30m')
    const match = JWT_EXPIRES_IN.match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case 'd':
          now.setDate(now.getDate() + value);
          break;
        case 'h':
          now.setHours(now.getHours() + value);
          break;
        case 'm':
          now.setMinutes(now.getMinutes() + value);
          break;
        case 's':
          now.setSeconds(now.getSeconds() + value);
          break;
      }
    } else {
      // Default to 7 days
      now.setDate(now.getDate() + 7);
    }
    return now.toISOString();
  }
}

// Export singleton instance
export const authService = new AuthService();
