const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  // Get token from headers
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // Check if Authorization token exists
  if (!authHeader) {
    logger.warn('No authorization header provided');
    return errorResponse(res, 401, 'Authorization token is missing');
  }

  // Extract token from Bearer
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    logger.warn('Invalid authorization header format');
    return errorResponse(res, 401, 'Invalid authorization format. Use Bearer token');
  }

  if (!token) {
    logger.warn('No token provided after Bearer');
    return errorResponse(res, 401, 'No token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn('User not found for token', { userId: decoded.id });
      return errorResponse(res, 401, 'User not found for this token');
    }

    // Check if token matches the user's token (if using token invalidation)
    if (user.token && user.token !== token) {
      logger.warn('Token mismatch for user', { userId: user._id });
      return errorResponse(res, 401, 'Token has been invalidated');
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    logger.error('Token verification failed', { 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token has expired');
    }
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token');
    }
    
    return errorResponse(res, 500, 'Authentication failed', err.message);
  }
};

module.exports = { protect };