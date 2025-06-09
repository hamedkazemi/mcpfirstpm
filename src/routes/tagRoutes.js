const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authenticate, requireTagAccess, requireProjectAccess } = require('../middleware/auth');

/**
 * @route   PUT /api/tags/:id
 * @desc    Update tag
 * @access  Private (project member)
 */
router.put('/:id', 
  authenticate, 
  requireTagAccess, 
  tagController.updateTag
);

/**
 * @route   DELETE /api/tags/:id
 * @desc    Delete tag
 * @access  Private (project member with permissions)
 */
router.delete('/:id', 
  authenticate, 
  requireTagAccess, 
  tagController.deleteTag
);

/**
 * @route   GET /api/tags/:id/usage
 * @desc    Get tag usage details
 * @access  Private (project member)
 */
router.get('/:id/usage', 
  authenticate, 
  requireTagAccess, 
  tagController.getTagUsage
);

/**
 * @route   DELETE /api/tags/:id/force
 * @desc    Force delete tag (removes from all items first)
 * @access  Private (project owner/manager only)
 */
router.delete('/:id/force', 
  authenticate, 
  requireTagAccess, 
  requireProjectAccess,
  tagController.forceDeleteTag
);

module.exports = router;
