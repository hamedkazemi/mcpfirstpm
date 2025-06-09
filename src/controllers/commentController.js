const { Comment, Item, User, Project } = require('../models');

// Create model instances
const commentModel = new Comment();
const itemModel = new Item();
const userModel = new User();
const projectModel = new Project();

/**
 * Get comments for a specific item
 * @route GET /api/items/:itemId/comments
 * @access Private (project member)
 */
const getItemComments = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 50, sortOrder = 'asc' } = req.query;

    // Verify item exists (should be checked by middleware, but double-check)
    const item = await itemModel.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort configuration (chronological by default for comments)
    const sortConfig = { createdAt: sortOrder === 'desc' ? -1 : 1 };

    // Get comments
    const comments = await commentModel.find({ itemId })
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('authorId', 'name email avatar')
      .lean();

    // Get total count for pagination
    const totalComments = await commentModel.countDocuments({ itemId });
    const totalPages = Math.ceil(totalComments / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalComments,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get item comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create new comment
 * @route POST /api/items/:itemId/comments
 * @access Private (project member)
 */
const createComment = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { content, mentions } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Verify item exists (should be checked by middleware, but double-check)
    const item = await itemModel.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Validate mentioned users if provided
    if (mentions && mentions.length > 0) {
      const mentionedUsers = await userModel.find({ _id: { $in: mentions } });
      if (mentionedUsers.length !== mentions.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more mentioned users not found'
        });
      }

      // Check if mentioned users are project members
      const project = await projectModel.findById(item.projectId);
      for (const mentionedUserId of mentions) {
        const isMember = project.members.some(member => 
          member.userId.toString() === mentionedUserId.toString()
        );
        if (!isMember) {
          return res.status(400).json({
            success: false,
            message: 'Cannot mention users who are not project members'
          });
        }
      }
    }

    // Create comment
    const commentData = {
      content: content.trim(),
      itemId,
      authorId: req.user.id,
      mentions: mentions || []
    };

    const savedComment = await commentModel.create(commentData);

    // Populate created comment
    const populatedComment = await commentModel.findById(savedComment._id)
      .populate('authorId', 'name email avatar')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: populatedComment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update comment
 * @route PUT /api/comments/:id
 * @access Private (comment author or project admin)
 */
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const comment = await commentModel.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can edit this comment (author or admin)
    const isAuthor = comment.authorId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      // Check if user is project owner/manager
      const item = await itemModel.findById(comment.itemId);
      const project = await projectModel.findById(item.projectId);
      const userMembership = project.members.find(member => 
        member.userId.toString() === req.user.id.toString()
      );
      
      const canEdit = isAdmin || 
                     project.owner.toString() === req.user.id.toString() ||
                     (userMembership && ['manager'].includes(userMembership.role));

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to edit this comment'
        });
      }
    }

    // Update comment
    const updatedComment = await commentModel.findByIdAndUpdate(
      id,
      { 
        content: content.trim(),
        updatedAt: new Date(),
        isEdited: true
      },
      { new: true, runValidators: true }
    )
    .populate('authorId', 'name email avatar')
    .lean();

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });

  } catch (error) {
    console.error('Update comment error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete comment
 * @route DELETE /api/comments/:id
 * @access Private (comment author or project admin)
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await commentModel.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can delete this comment (author or admin)
    const isAuthor = comment.authorId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      // Check if user is project owner/manager
      const item = await itemModel.findById(comment.itemId);
      const project = await projectModel.findById(item.projectId);
      const userMembership = project.members.find(member => 
        member.userId.toString() === req.user.id.toString()
      );
      
      const canDelete = isAdmin || 
                       project.owner.toString() === req.user.id.toString() ||
                       (userMembership && ['manager'].includes(userMembership.role));

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete this comment'
        });
      }
    }

    // Delete comment
    await commentModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user mentions
 * @route GET /api/users/:userId/mentions
 * @access Private (user themselves or admin)
 */
const getUserMentions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    // Check if user can access these mentions
    if (userId !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot access another user\'s mentions'
      });
    }

    // Build filter
    const filter = { mentions: userId };
    if (unreadOnly === 'true') {
      filter.readBy = { $ne: userId };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get mentions
    const comments = await commentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('authorId', 'name email avatar')
      .populate('itemId', 'title')
      .lean();

    // Get total count for pagination
    const totalMentions = await commentModel.countDocuments(filter);
    const totalPages = Math.ceil(totalMentions / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Mentions retrieved successfully',
      data: comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalMentions,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get user mentions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve mentions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Mark mentions as read
 * @route PUT /api/users/:userId/mentions/read
 * @access Private (user themselves)
 */
const markMentionsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const { commentIds } = req.body;

    // Check if user can mark these mentions
    if (userId !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot mark another user\'s mentions as read'
      });
    }

    let filter = { mentions: userId };
    if (commentIds && commentIds.length > 0) {
      filter._id = { $in: commentIds };
    }

    // Update comments to mark as read
    const result = await commentModel.updateMany(
      filter,
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({
      success: true,
      message: 'Mentions marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Mark mentions as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark mentions as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getItemComments,
  createComment,
  updateComment,
  deleteComment,
  getUserMentions,
  markMentionsAsRead
};
