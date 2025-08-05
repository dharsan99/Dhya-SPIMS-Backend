/**
 * Middleware to restrict access based on user roles
 * @param {...string} roles Allowed roles (e.g. 'admin', 'supervisor')
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
      console.log('User role:', req.user?.role, 'Allowed roles:', roles);
      if (!req.user || !roles.map(r => r.toLowerCase()).includes((req.user.role || '').toLowerCase())) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
      }
      next();
    };
  };
  
  module.exports = { requireRole };