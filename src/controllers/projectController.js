const { Project, User, Tag } = require('../models');

// Create model instances
const projectModel = new Project();
const userModel = new User();
const tagModel = new Tag();

/**
 * Get all projects for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProjects = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      sortBy = 'updatedAt', 
      sortOrder = 'desc' 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder
    };

    const projects = await projectModel.findByUser(req.user._id.toString(), options);

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: {
        projects: projects.results,
        pagination: projects.pagination
      }
    });
  } catch (error) {
    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error retrieving projects',
      error: errorDetails
    });
  }
};

/**
 * Get project by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    const hasAccess = await projectModel.checkAccess(id, req.user._id);
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: { project }
    });
  } catch (error) {
    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error retrieving project',
      error: errorDetails
    });
  }
};

/**
 * Create new project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createProject = async (req, res) => {
  try {
    const { name, description, key, settings } = req.body;

    // Check if project key is already taken
    if (key) {
      const existingProject = await projectModel.findByKey(key);
      if (existingProject) {
        return res.status(409).json({
          success: false,
          message: 'Project key already exists'
        });
      }
    }

    const projectData = {
      name,
      description,
      key,
      owner: req.user._id.toString(), // Convert ObjectID to string
      // settings: settings || {} // Removed as 'settings' is not in Project Joi schema's top level
      // If settings are needed, they should be part of 'metadata' or a defined field
    };
    if (settings) { // If settings are provided in request, assume they go into metadata or handle appropriately
        projectData.metadata = { customFields: settings }; // Example: placing it in metadata.customFields
    }


    const project = await projectModel.create(projectData);

    // Create default tags for the project
    await tagModel.createDefaultTags(project._id); // Corrected method name

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    // Handle validation errors
    if (error.isJoi && error.details) { // Correctly check for Joi validation errors
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: errorDetails
    });
  }
};

/**
 * Update project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, settings } = req.body;

    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can update project settings'
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (settings !== undefined) updateData.settings = { ...project.settings, ...settings };

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    await projectModel.update(id, updateData);
    const projectWithUpdates = await projectModel.findById(id); // Fetch the updated document

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: projectWithUpdates }
    });
  } catch (error) {
    // Handle validation errors
    if (error.isJoi && error.details) { // Correctly check for Joi validation errors
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    let errorDetailsUpdate = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetailsUpdate = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: errorDetailsUpdate
    });
  }
};

/**
 * Delete project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete project'
      });
    }

    // TODO: Before deleting project, we should:
    // 1. Delete all items in the project
    // 2. Delete all comments in the project
    // 3. Delete all tags in the project
    // For now, we'll just delete the project record

    await projectModel.delete(id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: errorDetails
    });
  }
};

/**
 * Add member to project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'viewer' } = req.body;

    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can add members'
      });
    }

    // Check if user to be added exists
    const userToAdd = await userModel.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    const isMember = project.members.some(member => member.user.toString() === userId);
    if (isMember) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Check if user is the owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Project owner is automatically a member'
      });
    }

    const updatedProject = await projectModel.addMember(id, userId, role);

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: errorDetails
    });
  }
};

/**
 * Remove member from project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can remove members'
      });
    }

    // Check if trying to remove the owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner'
      });
    }

    const updatedProject = await projectModel.removeMember(id, userId);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: errorDetails
    });
  }
};

/**
 * Update member role in project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can update member roles'
      });
    }

    // Check if trying to update the owner's role
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change project owner role'
      });
    }

    // Find and update the member
    const memberIndex = project.members.findIndex(member => member.user.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this project'
      });
    }

    // Update the member role
    const updateData = {
      [`members.${memberIndex}.role`]: role,
      updatedAt: new Date()
    };

    const updatedProject = await projectModel.update(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error updating member role',
      error: errorDetails
    });
  }
};

/**
 * Get project members
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    const hasAccess = await projectModel.checkAccess(id, req.user._id);
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Get detailed member information
    const memberIds = [project.owner, ...project.members.map(m => m.user)];
    const members = [];

    for (const memberId of memberIds) {
      const user = await userModel.findById(memberId);
      if (user) {
        const isOwner = project.owner.toString() === memberId.toString();
        const memberRole = isOwner ? 'owner' : project.members.find(m => m.user.toString() === memberId.toString())?.role;
        
        members.push({
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          role: memberRole,
          isOwner,
          joinedAt: isOwner ? project.createdAt : project.members.find(m => m.user.toString() === memberId.toString())?.joinedAt
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Project members retrieved successfully',
      data: { members }
    });
  } catch (error) {
    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error retrieving project members',
      error: errorDetails
    });
  }
};

/**
 * Get project statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProjectStats = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await projectModel.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    const hasAccess = await projectModel.checkAccess(id, req.user._id);
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // TODO: Implement actual statistics calculation
    // This would require querying items, comments, etc.
    const stats = {
      totalItems: 0,
      itemsByStatus: {
        todo: 0,
        inprogress: 0,
        review: 0,
        testing: 0,
        done: 0
      },
      itemsByType: {
        epic: 0,
        feature: 0,
        task: 0,
        bug: 0
      },
      totalComments: 0,
      totalMembers: project.members.length + 1, // +1 for owner
      recentActivity: []
    };

    res.status(200).json({
      success: true,
      message: 'Project statistics retrieved successfully',
      data: { stats }
    });
  } catch (error) {
    let errorDetails = 'Internal server error';
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      errorDetails = error.message || error.toString() || error;
    }
    res.status(500).json({
      success: false,
      message: 'Error retrieving project statistics',
      error: errorDetails
    });
  }
};

module.exports = {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  getProjectMembers,
  getProjectStats
};
