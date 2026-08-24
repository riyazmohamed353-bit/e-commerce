const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: 'No authorization header provided',
      });
    }

    // Check Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Invalid authorization format',
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'No token provided',
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Support different JWT user ID field names
    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    // Make sure user ID exists
    if (!userId) {
      return res.status(401).json({
        message: 'User Id was not provided in token',
      });
    }

    // IMPORTANT:
    // ChatController uses req.userId
    req.userId = userId;

    next();

  } catch (error) {
    console.error('AUTH ERROR:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
      });
    }

    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};