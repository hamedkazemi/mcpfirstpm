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

    const projects = await projectModel.findByUser(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: {
        projects: projects.results,
        pagination: projects.pagination
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({
      success: false,
      message: 'Error retrieving project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      owner: req.user._id,
      settings: settings || {}
    };

    const project = await projectModel.create(projectData);

    // Create default tags for the project
    await tagModel.createDefaults(project._id);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    // Handle validation errors
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
      message: 'Error creating project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    const updatedProject = await projectModel.update(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    // Handle validation errors
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
      message: 'Error updating project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({
      success: false,
      message: 'Error updating member role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({
      success: false,
      message: 'Error retrieving project members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    res.status(500).json({
      success: false,
      message: 'Error retrieving project statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
