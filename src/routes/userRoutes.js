const express = require('express');
const { authenticate, requireAdmin, requireManager } = require('../middleware/auth');
const userController = require('../controllers/userController');
const commentController = require('../controllers/commentController');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/', authenticate, requireAdmin, userController.getAllUsers);

/**
 * @route   GET /api/users/search
 * @desc    Search users by username/email
 * @access  Private
 */
router.get('/search', authenticate, userController.searchUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, requireAdmin, userController.getUserStats);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', authenticate, userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user (admin only)
 * @access  Private (Admin)
 */
router.post('/', authenticate, requireAdmin, userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put('/:id', authenticate, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

/**
 * @route   GET /api/users/:userId/mentions
 * @desc    Get user mentions
 * @access  Private (user themselves or admin)
 */
router.get('/:userId/mentions', authenticate, commentController.getUserMentions);

/**
 * @route   PUT /api/users/:userId/mentions/read
 * @desc    Mark mentions as read
 * @access  Private (user themselves)
 */
router.put('/:userId/mentions/read', authenticate, commentController.markMentionsAsRead);

module.exports = router;
