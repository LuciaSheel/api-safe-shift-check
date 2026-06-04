/**
 * Authentication Routes
 * Handles login, register, and token operations
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers';
import { authenticate } from '../middleware/auth';
import {
  validate,
  loginValidation,
  changePasswordValidation,
} from '../middleware/validation';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { Success: false, Message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { Success: false, Message: 'Too many password reset requests. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return token
 * @access  Public
 */
router.post('/login', loginLimiter, validate(loginValidation), authController.login.bind(authController));

// NOTE: Self-registration is disabled. Users are created by admins via POST /api/users
// If you need to re-enable public registration, uncomment the route below:
// router.post('/register', validate(registerValidation), authController.register.bind(authController));

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken.bind(authController));

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordValidation),
  authController.changePassword.bind(authController)
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/reset-password', passwordResetLimiter, authController.resetPassword.bind(authController));

/**
 * @route   GET /api/auth/reset-password/:token
 * @desc    Verify password reset token
 * @access  Public
 */
router.get('/reset-password/:token', authController.verifyResetToken.bind(authController));

/**
 * @route   POST /api/auth/reset-password/complete
 * @desc    Complete password reset with new password
 * @access  Public
 */
router.post('/reset-password/complete', passwordResetLimiter, authController.completePasswordReset.bind(authController));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.me.bind(authController));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate all tokens
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

export default router;
