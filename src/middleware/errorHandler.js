/**
 * Error handling middleware for Express application
 * This should be the last middleware in the stack
 */

/**
 * Development error handler - includes stack trace and detailed error info
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const developmentErrorHandler = (err, req, res, next) => {
  const error = {
    success: false,
    message: err.message || 'Internal server error',
    error: {
      status: err.status || err.statusCode || 500,
      stack: err.stack,
      details: err.details || null
    }
  };

  // Log error for debugging
  console.error('Error occurred:', {
    url: req.url,
    method: req.method,
    error: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });

  res.status(err.status || err.statusCode || 500).json(error);
};

/**
 * Production error handler - minimal error information exposed
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const productionErrorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  
  // Don't expose sensitive error information in production
  const error = {
    success: false,
    message: status === 500 ? 'Internal server error' : err.message || 'Something went wrong'
  };

  // Log error for monitoring (without exposing to client)
  console.error('Production error:', {
    url: req.url,
    method: req.method,
    status: status,
    message: err.message,
    timestamp: new Date().toISOString()
  });

  res.status(status).json(error);
};

/**
 * Handle specific error types
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Handle validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors
    });
  }

  // Handle cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Handle syntax errors in JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body'
    });
  }

  // Use development or production error handler based on environment
  if (process.env.NODE_ENV === 'development') {
    developmentErrorHandler(err, req, res, next);
  } else {
    productionErrorHandler(err, req, res, next);
  }
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Async error wrapper - catches async errors and passes to error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Error object with status code
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.status = statusCode;
  return error;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  developmentErrorHandler,
  productionErrorHandler
};
