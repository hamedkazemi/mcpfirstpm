const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const commentController = require('../controllers/commentController');
const { authenticate, requireItemAccess } = require('../middleware/auth');

/**
 * @route   GET /api/items/:id
 * @desc    Get item by ID
 * @access  Private (project member)
 */
router.get('/:id', 
  authenticate, 
  requireItemAccess, 
  itemController.getItemById
);

/**
 * @route   PUT /api/items/:id
 * @desc    Update item
 * @access  Private (project member)
 */
router.put('/:id', 
  authenticate, 
  requireItemAccess, 
  itemController.updateItem
);

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete item
 * @access  Private (project member with permissions)
 */
router.delete('/:id', 
  authenticate, 
  requireItemAccess, 
  itemController.deleteItem
);

/**
 * @route   PUT /api/items/:id/status
 * @desc    Update item status
 * @access  Private (project member)
 */
router.put('/:id/status', 
  authenticate, 
  requireItemAccess, 
  itemController.updateStatus
);

/**
 * @route   PUT /api/items/:id/assign
 * @desc    Assign item to user
 * @access  Private (project member)
 */
router.put('/:id/assign', 
  authenticate, 
  requireItemAccess, 
  itemController.assignItem
);

/**
 * @route   GET /api/items/:id/comments
 * @desc    Get item comments
 * @access  Private (project member)
 */
router.get('/:id/comments', 
  authenticate, 
  requireItemAccess, 
  itemController.getItemComments
);

/**
 * @route   POST /api/items/:itemId/comments
 * @desc    Create new comment on item
 * @access  Private (project member)
 */
router.post('/:itemId/comments', 
  authenticate, 
  requireItemAccess, 
  commentController.createComment
);

/**
 * @route   GET /api/items/:id/history
 * @desc    Get item history
 * @access  Private (project member)
 */
router.get('/:id/history', 
  authenticate, 
  requireItemAccess, 
  itemController.getItemHistory
);

module.exports = router;
