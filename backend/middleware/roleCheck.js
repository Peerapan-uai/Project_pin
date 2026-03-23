/**
 * Role check middleware factory.
 * Usage: router.get('/admin-route', auth, roleCheck('admin'), handler)
 *        router.get('/multi-role', auth, roleCheck('admin', 'technician'), handler)
 */
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = roleCheck;
