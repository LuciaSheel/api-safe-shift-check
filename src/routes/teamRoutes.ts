/**
 * Team Routes
 * CRUD operations for teams
 */

import { Router } from 'express';
import { teamController } from '../controllers';
import { authenticate, requireManagerOrAdmin, requireAdmin } from '../middleware/auth';
import {
  validate,
  createTeamValidation,
  updateTeamValidation,
  idParamValidation,
  paginationValidation,
} from '../middleware/validation';

const router = Router();

// All team routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/teams
 * @desc    Get all teams with optional filtering
 * @access  Private
 */
router.get(
  '/',
  validate(paginationValidation),
  teamController.findAll.bind(teamController)
);

/**
 * @route   GET /api/teams/:id
 * @desc    Get team by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(idParamValidation),
  teamController.findById.bind(teamController)
);

/**
 * @route   GET /api/teams/:id/details
 * @desc    Get team with full member details
 * @access  Private
 */
router.get(
  '/:id/details',
  validate(idParamValidation),
  teamController.getWithDetails.bind(teamController)
);

/**
 * @route   GET /api/teams/:id/members
 * @desc    Get team members
 * @access  Private
 */
router.get(
  '/:id/members',
  validate(idParamValidation),
  teamController.getTeamMembers.bind(teamController)
);

/**
 * @route   POST /api/teams
 * @desc    Create a new team
 * @access  Private (Admin)
 */
router.post(
  '/',
  requireAdmin,
  validate(createTeamValidation),
  teamController.create.bind(teamController)
);

/**
 * @route   PUT /api/teams/:id
 * @desc    Update team
 * @access  Private (Manager, Admin)
 */
router.put(
  '/:id',
  requireManagerOrAdmin,
  validate([...idParamValidation, ...updateTeamValidation]),
  teamController.update.bind(teamController)
);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Delete team
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  requireAdmin,
  validate(idParamValidation),
  teamController.delete.bind(teamController)
);

/**
 * @route   POST /api/teams/:id/members
 * @desc    Add member to team
 * @access  Private (Manager, Admin)
 */
router.post(
  '/:id/members',
  requireManagerOrAdmin,
  validate(idParamValidation),
  teamController.addMember.bind(teamController)
);

/**
 * @route   DELETE /api/teams/:id/members/:memberId
 * @desc    Remove member from team
 * @access  Private (Manager, Admin)
 */
router.delete(
  '/:id/members/:memberId',
  requireManagerOrAdmin,
  teamController.removeMember.bind(teamController)
);

export default router;
