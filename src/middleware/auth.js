const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { User } = require('../models');

// Create User instance
const userModel = new User();

/**
 * Authentication middleware - verifies JWT token and adds user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if token type is access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Get user from database
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'
    });
  }
};

/**
 * Optional authentication middleware - tries to authenticate but doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      
      if (decoded.type === 'access') {
        const user = await userModel.findById(decoded.id);
        if (user) {
          req.user = user;
          req.token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    // In optional auth, we don't fail on token errors
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of roles that can access the route
 * @returns {Function} Express middleware function
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin only authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = authorize(['admin']);

/**
 * Manager or Admin authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireManager = authorize(['admin', 'manager']);

/**
 * Developer, Manager or Admin authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireDeveloper = authorize(['admin', 'manager', 'developer']);

/**
 * Project ownership verification middleware
 * Checks if the authenticated user is the owner of the project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireProjectOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { Project } = require('../models');
    const projectModelInstance = new Project(); // Instantiate Project model
    const projectId = req.params.projectId || req.params.id;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID required'
      });
    }

    const project = await projectModelInstance.findById(projectId); // Use instance
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
        message: 'Project owner access required'
      });
    }

    req.project = project;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying project ownership',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Project access verification middleware
 * Checks if the authenticated user has access to the project (member or owner)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireProjectAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { Project } = require('../models');
    const projectModelInstance = new Project(); // Instantiate Project model
    const projectId = req.params.projectId || req.params.id;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID required'
      });
    }

    const project = await projectModelInstance.findById(projectId); // Use instance
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to project
    const hasAccess = await projectModelInstance.checkAccess(projectId, req.user._id.toString()); // Use instance and toString()
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Project access required'
      });
    }

    req.project = project;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying project access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Item access verification middleware
 * Checks if the authenticated user has access to the item (through project membership)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireItemAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { Item, Project } = require('../models');
    const projectModelInstance = new Project(); // Instantiate Project model
    const itemId = req.params.id;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID required'
      });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user has access to the project containing this item
    const hasAccess = await projectModelInstance.checkAccess(item.projectId.toString(), req.user._id.toString()); // Use instance and toString()
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Project access required to access this item'
      });
    }

    // Get the full project object for additional context
    const project = await projectModelInstance.findById(item.projectId.toString()); // Use instance and toString()
    
    req.item = item;
    req.project = project;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying item access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Comment access verification middleware
 * Checks if the authenticated user has access to the comment (through project membership)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireCommentAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { Comment, Item, Project } = require('../models');
    const projectModelInstance = new Project(); // Instantiate Project model
    const commentId = req.params.id;
    
    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: 'Comment ID required'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Get the item and project
    const item = await Item.findById(comment.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Associated item not found'
      });
    }

    // Check if user has access to the project containing this comment
    const hasAccess = await projectModelInstance.checkAccess(item.projectId.toString(), req.user._id.toString()); // Use instance and toString()
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Project access required to access this comment'
      });
    }

    // Get the full project object for additional context
    const project = await projectModelInstance.findById(item.projectId.toString()); // Use instance and toString()
    
    req.comment = comment;
    req.item = item;
    req.project = project;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying comment access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Tag access verification middleware
 * Checks if the authenticated user has access to the tag (through project membership)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireTagAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { Tag, Project } = require('../models');
    const projectModelInstance = new Project(); // Instantiate Project model
    const tagId = req.params.id;
    
    if (!tagId) {
      return res.status(400).json({
        success: false,
        message: 'Tag ID required'
      });
    }

    const tag = await Tag.findById(tagId);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Check if user has access to the project containing this tag
    const hasAccess = await projectModelInstance.checkAccess(tag.projectId.toString(), req.user._id.toString()); // Use instance and toString()
    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Project access required to access this tag'
      });
    }

    // Get the full project object for additional context
    const project = await projectModelInstance.findById(tag.projectId.toString()); // Use instance and toString()
    
    req.tag = tag;
    req.project = project;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying tag access',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireAdmin,
  requireManager,
  requireDeveloper,
  requireProjectOwner,
  requireProjectAccess,
  requireItemAccess,
  requireCommentAccess,
  requireTagAccess
};
