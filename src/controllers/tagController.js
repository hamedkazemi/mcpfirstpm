const { Tag, Project, Item } = require('../models');

// Create model instances
const tagModel = new Tag();
const projectModel = new Project();
const itemModel = new Item();

/**
 * Get tags for a specific project
 * @route GET /api/projects/:projectId/tags
 * @access Private (project member)
 */
const getProjectTags = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { search, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Build filter object
    const filter = { projectId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get tags
    const tags = await tagModel.find(filter)
      .sort(sortConfig)
      .populate('createdBy', 'name email')
      .lean();

    // Get usage count for each tag
    const tagsWithUsage = await Promise.all(
      tags.map(async (tag) => {
        const usageCount = await itemModel.countDocuments({ 
          projectId,
          tags: tag._id 
        });
        return {
          ...tag,
          usageCount
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Project tags retrieved successfully',
      data: tagsWithUsage
    });

  } catch (error) {
    console.error('Get project tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project tags',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create new tag
 * @route POST /api/projects/:projectId/tags
 * @access Private (project member)
 */
const createTag = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, color } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Check if tag with same name already exists in this project
    const existingTag = await tagModel.findOne({ 
      projectId, 
      name: name.trim() 
    });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        message: 'Tag with this name already exists in the project'
      });
    }

    // Create tag
    const tagData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#3B82F6', // Default blue color
      projectId,
      createdBy: req.user.id
    };

    const savedTag = await tagModel.create(tagData);

    // Populate created tag
    const populatedTag = await tagModel.findById(savedTag._id)
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: {
        ...populatedTag,
        usageCount: 0
      }
    });

  } catch (error) {
    console.error('Create tag error:', error);
    
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
      message: 'Failed to create tag',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update tag
 * @route PUT /api/tags/:id
 * @access Private (project member)
 */
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const tag = await tagModel.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // If updating name, check for duplicates
    if (name && name.trim() !== tag.name) {
      const existingTag = await tagModel.findOne({ 
        projectId: tag.projectId, 
        name: name.trim(),
        _id: { $ne: id }
      });

      if (existingTag) {
        return res.status(409).json({
          success: false,
          message: 'Tag with this name already exists in the project'
        });
      }
    }

    // Update fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (color !== undefined) updateData.color = color;
    
    updateData.updatedAt = new Date();

    const updatedTag = await tagModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .lean();

    // Get usage count
    const usageCount = await itemModel.countDocuments({ 
      projectId: tag.projectId,
      tags: id 
    });

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: {
        ...updatedTag,
        usageCount
      }
    });

  } catch (error) {
    console.error('Update tag error:', error);
    
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
      message: 'Failed to update tag',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete tag
 * @route DELETE /api/tags/:id
 * @access Private (project member with permissions)
 */
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await tagModel.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Check if tag is in use
    const usageCount = await itemModel.countDocuments({ 
      projectId: tag.projectId,
      tags: id 
    });

    if (usageCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete tag. It is currently used by ${usageCount} item(s). Remove the tag from all items first.`,
        data: { usageCount }
      });
    }

    // Delete the tag
    await tagModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully'
    });

  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tag',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get tag usage details
 * @route GET /api/tags/:id/usage
 * @access Private (project member)
 */
const getTagUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const tag = await tagModel.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get items using this tag
    const items = await itemModel.find({ 
      projectId: tag.projectId,
      tags: id 
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .select('title status priority assignedTo createdBy createdAt updatedAt')
    .lean();

    // Get total count for pagination
    const totalItems = await itemModel.countDocuments({ 
      projectId: tag.projectId,
      tags: id 
    });
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    // Get tag details with usage statistics
    const tagWithStats = await tagModel.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Tag usage retrieved successfully',
      data: {
        tag: tagWithStats,
        items,
        usage: {
          totalItems,
          itemsByStatus: await itemModel.aggregate([
            { $match: { projectId: tag.projectId, tags: tag._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]),
          itemsByPriority: await itemModel.aggregate([
            { $match: { projectId: tag.projectId, tags: tag._id } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ])
        }
      },
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
    console.error('Get tag usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tag usage',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Force delete tag (removes from all items first)
 * @route DELETE /api/tags/:id/force
 * @access Private (project owner/manager only)
 */
const forceDeleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await tagModel.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Remove tag from all items
    const removeResult = await itemModel.updateMany(
      { projectId: tag.projectId, tags: id },
      { $pull: { tags: id } }
    );

    // Delete the tag
    await tagModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Tag force deleted successfully',
      data: {
        itemsUpdated: removeResult.modifiedCount
      }
    });

  } catch (error) {
    console.error('Force delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force delete tag',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getProjectTags,
  createTag,
  updateTag,
  deleteTag,
  getTagUsage,
  forceDeleteTag
};
