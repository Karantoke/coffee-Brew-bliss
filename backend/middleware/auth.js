const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies the Bearer JWT and attaches `req.user`.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised — no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

/**
 * adminOnly — must be used AFTER protect.
 * Rejects non-admin users with 403.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied — admins only' });
};

module.exports = { protect, adminOnly };
