const { User } = require('../models');
const { generateTokenPair, verifyToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// Create User instance
const userModel = new User();

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Basic validation for required fields before hitting DB or Joi in model
    if (!username || !email || !password) {
      const missingFields = [];
      if (!username) missingFields.push('username');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      return res.status(400).json({
        success: false,
        message: 'Validation error: Required fields are missing.',
        errors: missingFields.map(field => `"${field}" is required`)
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if username is taken
    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken'
      });
    }

    // Create new user
    const userData = {
      username,
      email,
      password,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        avatar: ''
      },
      roles: [role || 'developer'] // Default role as array
    };

    const user = await userModel.create(userData);

    // Generate token pair
    const tokens = generateTokenPair(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          role: user.roles?.[0] || 'developer',
          avatar: user.profile?.avatar || '',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        tokens
      }
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
      message: 'Error creating user',
      error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'
    });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await userModel.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token pair
    const tokens = generateTokenPair(user);

    // Update last login
    await userModel.update(user._id, { 
      lastLoginAt: new Date() 
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          role: user.roles?.[0] || 'developer',
          avatar: user.profile?.avatar || '',
          lastLoginAt: new Date(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        tokens
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'
    });
  }
};

/**
 * Refresh access token using refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    // Check if token type is refresh token
    if (decoded.type !== 'refresh') {
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

    // Generate new token pair
    const tokens = generateTokenPair(user);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user; // Set by authenticate middleware

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          role: user.roles?.[0] || 'developer',
          avatar: user.profile?.avatar || '',
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, avatar } = req.body;

    // Prepare update data
    const updateData = {};
    if (firstName !== undefined || lastName !== undefined || avatar !== undefined) {
      updateData.profile = {};
      if (firstName !== undefined) updateData.profile.firstName = firstName;
      if (lastName !== undefined) updateData.profile.lastName = lastName;
      if (avatar !== undefined) updateData.profile.avatar = avatar;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update user
    const updatedUser = await userModel.update(userId, updateData);

    // Get updated user to return latest data
    const user = await userModel.findById(userId);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          role: user.roles?.[0] || 'developer',
          avatar: user.profile?.avatar || '',
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
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
      message: 'Error updating profile',
      error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'
    });
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get current user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await userModel.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await userModel.update(userId, { passwordHash: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'
    });
  }
};

/**
 * Logout user (client-side token invalidation)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
  try {
    // In a stateless JWT setup, logout is typically handled client-side
    // by removing the tokens from storage. We could implement a token blacklist
    // here if needed for additional security.
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
