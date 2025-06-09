const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const itemController = require('../controllers/itemController');
const tagController = require('../controllers/tagController');
const { authenticate, requireProjectAccess, requireProjectOwner } = require('../middleware/auth');

/**
 * @route   GET /api/projects
 * @desc    Get user's projects
 * @access  Private
 */
router.get('/', authenticate, projectController.getUserProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private (project member)
 */
router.get('/:id', authenticate, requireProjectAccess, projectController.getProjectById);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
router.post('/', authenticate, projectController.createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private (project owner/manager)
 */
router.put('/:id', authenticate, requireProjectAccess, projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (project owner only)
 */
router.delete('/:id', authenticate, requireProjectOwner, projectController.deleteProject);

/**
 * @route   GET /api/projects/:id/members
 * @desc    Get project members
 * @access  Private (project member)
 */
router.get('/:id/members', authenticate, requireProjectAccess, projectController.getProjectMembers);

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add member to project
 * @access  Private (project owner/manager)
 */
router.post('/:id/members', authenticate, requireProjectAccess, projectController.addMember);

/**
 * @route   DELETE /api/projects/:id/members/:userId
 * @desc    Remove member from project
 * @access  Private (project owner/manager)
 */
router.delete('/:id/members/:userId', authenticate, requireProjectAccess, projectController.removeMember);

/**
 * @route   PUT /api/projects/:id/members/:userId
 * @desc    Update member role
 * @access  Private (project owner/manager)
 */
router.put('/:id/members/:userId', authenticate, requireProjectAccess, projectController.updateMemberRole);

/**
 * @route   GET /api/projects/:id/stats
 * @desc    Get project statistics
 * @access  Private (project member)
 */
router.get('/:id/stats', authenticate, requireProjectAccess, projectController.getProjectStats);

// === PROJECT ITEMS ROUTES ===

/**
 * @route   GET /api/projects/:projectId/items
 * @desc    Get items for a specific project
 * @access  Private (project member)
 */
router.get('/:projectId/items', authenticate, requireProjectAccess, itemController.getProjectItems);

/**
 * @route   POST /api/projects/:projectId/items
 * @desc    Create new item in project
 * @access  Private (project member)
 */
router.post('/:projectId/items', authenticate, requireProjectAccess, itemController.createItem);

// === PROJECT TAGS ROUTES ===

/**
 * @route   GET /api/projects/:projectId/tags
 * @desc    Get tags for a specific project
 * @access  Private (project member)
 */
router.get('/:projectId/tags', authenticate, requireProjectAccess, tagController.getProjectTags);

/**
 * @route   POST /api/projects/:projectId/tags
 * @desc    Create new tag in project
 * @access  Private (project member)
 */
router.post('/:projectId/tags', authenticate, requireProjectAccess, tagController.createTag);

module.exports = router;
