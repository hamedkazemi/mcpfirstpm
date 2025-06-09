const { Item, Project, User, Comment } = require('../models');

// Create model instances
const itemModel = new Item();
const projectModel = new Project();
const userModel = new User();
const commentModel = new Comment();

/**
 * Get items for a specific project
 * @route GET /api/projects/:projectId/items
 * @access Private (project member)
 */
const getProjectItems = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      status, 
      priority, 
      assignedTo, 
      tags, 
      search,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { projectId };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get items with pagination
    const items = await itemModel.find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    // Get total count for pagination
    const totalItems = await itemModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Project items retrieved successfully',
      data: items,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get project items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get item by ID
 * @route GET /api/items/:id
 * @access Private (project member)
 */
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await itemModel.findById(id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name')
      .lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item retrieved successfully',
      data: item
    });

  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create new item
 * @route POST /api/projects/:projectId/items
 * @access Private (project member)
 */
const createItem = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, assignedTo, tags, dueDate } = req.body;

    // Validate assigned user if provided
    if (assignedTo) {
      const assignedUser = await userModel.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }

      // Check if assigned user is a project member
      const project = await projectModel.findById(projectId);
      const isMember = project.members.some(member => 
        member.userId.toString() === assignedTo.toString()
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign item to user who is not a project member'
        });
      }
    }

    // Create item data
    const itemData = {
      title,
      description,
      projectId,
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      tags: tags || [],
      dueDate: dueDate || null,
      createdBy: req.user.id,
      status: 'todo'
    };

    const savedItem = await itemModel.create(itemData);

    // Populate created item
    const populatedItem = await itemModel.findById(savedItem._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: populatedItem
    });

  } catch (error) {
    console.error('Create item error:', error);
    
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
      message: 'Failed to create item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update item
 * @route PUT /api/items/:id
 * @access Private (project member)
 */
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, assignedTo, tags, dueDate, status } = req.body;

    const item = await itemModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Validate assigned user if provided
    if (assignedTo !== undefined) {
      if (assignedTo && assignedTo !== item.assignedTo?.toString()) {
        const assignedUser = await userModel.findById(assignedTo);
        if (!assignedUser) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user not found'
          });
        }

        // Check if assigned user is a project member
        const project = await projectModel.findById(item.projectId);
        const isMember = project.members.some(member => 
          member.userId.toString() === assignedTo.toString()
        );

        if (!isMember) {
          return res.status(400).json({
            success: false,
            message: 'Cannot assign item to user who is not a project member'
          });
        }
      }
    }

    // Update fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (tags !== undefined) updateData.tags = tags;
    if (dueDate !== undefined) updateData.dueDate = dueDate || null;
    if (status !== undefined) updateData.status = status;
    
    updateData.updatedAt = new Date();

    const updatedItem = await itemModel.update(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('Update item error:', error);
    
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
      message: 'Failed to update item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete item
 * @route DELETE /api/items/:id
 * @access Private (project member with permissions)
 */
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await itemModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Delete associated comments first
    await commentModel.deleteMany({ itemId: id });

    // Delete the item
    await itemModel.delete(id);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update item status
 * @route PUT /api/items/:id/status
 * @access Private (project member)
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        validStatuses
      });
    }

    const updatedItem = await itemModel.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .lean();

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item status updated successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Assign item to user
 * @route PUT /api/items/:id/assign
 * @access Private (project member)
 */
const assignItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const item = await itemModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Validate assigned user if provided
    if (assignedTo) {
      const assignedUser = await userModel.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }

      // Check if assigned user is a project member
      const project = await projectModel.findById(item.projectId);
      const isMember = project.members.some(member => 
        member.userId.toString() === assignedTo.toString()
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: 'Cannot assign item to user who is not a project member'
        });
      }
    }

    const updatedItem = await itemModel.findByIdAndUpdate(
      id,
      { 
        assignedTo: assignedTo || null,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .lean();

    res.status(200).json({
      success: true,
      message: assignedTo ? 'Item assigned successfully' : 'Item unassigned successfully',
      data: updatedItem
    });

  } catch (error) {
    console.error('Assign item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get item comments
 * @route GET /api/items/:id/comments
 * @access Private (project member)
 */
const getItemComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify item exists
    const item = await itemModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get comments
    const comments = await commentModel.find({ itemId: id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('authorId', 'name email avatar')
      .lean();

    // Get total count for pagination
    const totalComments = await commentModel.countDocuments({ itemId: id });
    const totalPages = Math.ceil(totalComments / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Item comments retrieved successfully',
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
      message: 'Failed to retrieve item comments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get item history (status changes, assignments, etc.)
 * @route GET /api/items/:id/history
 * @access Private (project member)
 */
const getItemHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify item exists
    const item = await itemModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // For now, return basic history from item metadata
    // In a more advanced system, you'd track changes in a separate history collection
    const history = [
      {
        action: 'created',
        timestamp: item.createdAt,
        userId: item.createdBy,
        details: 'Item created'
      },
      {
        action: 'updated',
        timestamp: item.updatedAt,
        details: 'Last updated'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Item history retrieved successfully',
      data: history
    });

  } catch (error) {
    console.error('Get item history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve item history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getProjectItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateStatus,
  assignItem,
  getItemComments,
  getItemHistory
};
