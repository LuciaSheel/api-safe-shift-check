/**
 * Authentication Routes
 * Handles login, register, and token operations
 */

import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate } from '../middleware/auth';
import {
  validate,
  loginValidation,
  registerValidation,
  changePasswordValidation,
} from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return token
 * @access  Public
 */
router.post('/login', validate(loginValidation), authController.login.bind(authController));

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
router.post('/reset-password', authController.resetPassword.bind(authController));

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
