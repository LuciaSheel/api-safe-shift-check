/**
 * Auth Service
 * Handles authentication business logic
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories';
import { dataStore } from '../data/dataStore';
import { emailService } from './EmailService';
import { 
  User, 
  LoginCredentials, 
  AuthResponse, 
  TokenPayload,
  CreateUserDto,
  PasswordResetToken,
} from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Convert time string to seconds for jwt.sign
function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([dhms])$/);
  if (match) {
    const num = parseInt(match[1]);
    switch (match[2]) {
      case 'd': return num * 86400;
      case 'h': return num * 3600;
      case 'm': return num * 60;
      case 's': return num;
    }
  }
  return 604800; // Default: 7 days in seconds
}

const JWT_EXPIRES_SECONDS = parseExpiresIn(JWT_EXPIRES_IN);

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
      // Don't reveal if email exists - still return success
      return true;
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidate any existing reset tokens for this user
    const existingIndex = dataStore.passwordResetTokens.findIndex(
      t => t.UserId === user.Id && !t.UsedAt
    );
    if (existingIndex !== -1) {
      dataStore.passwordResetTokens.splice(existingIndex, 1);
    }

    // Store the new reset token
    const resetToken: PasswordResetToken = {
      Id: uuidv4(),
      UserId: user.Id,
      Token: token,
      Email: email,
      ExpiresAt: expiresAt.toISOString(),
      CreatedAt: new Date().toISOString(),
    };
    dataStore.passwordResetTokens.push(resetToken);

    // Send the password reset email
    const emailResult = await emailService.sendPasswordResetEmail(email, token);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Still return true to not reveal if email exists
    }

    return true;
  }

  /**
   * Verify a password reset token is valid
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const resetToken = dataStore.passwordResetTokens.find(
      t => t.Token === token && !t.UsedAt
    );

    if (!resetToken) {
      return { valid: false };
    }

    // Check if token has expired
    if (new Date(resetToken.ExpiresAt) < new Date()) {
      return { valid: false };
    }

    return { valid: true, email: resetToken.Email };
  }

  /**
   * Complete password reset with token and new password
   */
  async completePasswordReset(token: string, newPassword: string): Promise<boolean> {
    const resetToken = dataStore.passwordResetTokens.find(
      t => t.Token === token && !t.UsedAt
    );

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token has expired
    if (new Date(resetToken.ExpiresAt) < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password (this also increments TokenVersion)
    const updated = await userRepository.updatePassword(resetToken.UserId, hashedPassword);
    
    if (!updated) {
      throw new Error('Failed to update password');
    }

    // Mark the token as used
    resetToken.UsedAt = new Date().toISOString();

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(resetToken.Email);

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
      TokenVersion: user.TokenVersion || 1,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_SECONDS,
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

  /**
   * Get user by ID (for profile retrieval)
   */
  async getUserById(userId: string): Promise<User | null> {
    return userRepository.findById(userId);
  }

  /**
   * Logout user - invalidates all tokens by incrementing TokenVersion
   */
  async logout(userId: string): Promise<boolean> {
    return await userRepository.incrementTokenVersion(userId);
  }
}

// Export singleton instance
export const authService = new AuthService();
