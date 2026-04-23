const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Verify JWT and attach user to request ─────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. Token missing.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).populate('company', 'slug name status');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ── Role-based access control ─────────────────────────────────────────────────
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

// ── Platform owner only ───────────────────────────────────────────────────────
exports.platformOwnerOnly = (req, res, next) => {
  if (req.user.role !== 'platform_owner') {
    return res.status(403).json({ success: false, message: 'Platform owner access only.' });
  }
  next();
};

// ── Company staff only (not end users) ───────────────────────────────────────
exports.staffOnly = (req, res, next) => {
  const staffRoles = ['company_super_admin', 'company_admin', 'employee', 'agent'];
  if (!staffRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Staff access only.' });
  }
  next();
};
