const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // ---------------------------------------------------------
    // CHECK AUTHORIZATION HEADER
    // ---------------------------------------------------------

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided',
      });
    }

    // ---------------------------------------------------------
    // CHECK BEARER FORMAT
    // ---------------------------------------------------------

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format',
      });
    }

    // ---------------------------------------------------------
    // GET TOKEN
    // ---------------------------------------------------------

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    // ---------------------------------------------------------
    // CHECK JWT SECRET
    // ---------------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing from .env');

      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured',
      });
    }

    // ---------------------------------------------------------
    // VERIFY TOKEN
    // ---------------------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log('AUTH DECODED TOKEN:', decoded);

    // ---------------------------------------------------------
    // GET USER ID
    // Support different JWT payload formats
    // ---------------------------------------------------------

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id ||
      decoded.user?.id ||
      decoded.user?._id ||
      null;

    if (!userId) {
      console.error(
        'AUTH ERROR: User ID missing from JWT',
        decoded
      );

      return res.status(401).json({
        success: false,
        message: 'User Id was not provided in token',
      });
    }

    // ---------------------------------------------------------
    // SET USER INFORMATION
    // ---------------------------------------------------------

    req.userId = String(userId);

    req.user = {
      id: String(userId),
      _id: String(userId),
      userId: String(userId),
    };

    console.log(
      'AUTH SUCCESS - USER ID:',
      req.userId
    );

    next();

  } catch (error) {
    console.error(
      'AUTH ERROR:',
      error
    );

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};