const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, requireCommentAccess } = require('../middleware/auth');

/**
 * @route   PUT /api/comments/:id
 * @desc    Update comment
 * @access  Private (comment author or project admin)
 */
router.put('/:id', 
  authenticate, 
  requireCommentAccess, 
  commentController.updateComment
);

/**
 * @route   DELETE /api/comments/:id
 * @desc    Delete comment
 * @access  Private (comment author or project admin)
 */
router.delete('/:id', 
  authenticate, 
  requireCommentAccess, 
  commentController.deleteComment
);

module.exports = router;
