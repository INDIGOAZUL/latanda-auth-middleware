/**
 * @latanda/auth-middleware
 * Production-ready JWT authentication middleware for Node.js + PostgreSQL + Nginx
 *
 * Battle-tested with 30+ users at https://latanda.online
 *
 * @example
 * const { createAuthMiddleware, requireRole } = require('@latanda/auth-middleware');
 *
 * app.use('/api/*', createAuthMiddleware({ jwtSecret: process.env.JWT_SECRET }));
 * app.use('/api/admin/*', requireRole('ADMIN'));
 */

const jwt = require('./jwt');
const rbac = require('./rbac');
const middleware = require('./middleware');

module.exports = {
  // JWT functions
  generateToken: jwt.generateToken,
  validateToken: jwt.validateToken,
  decodeToken: jwt.decodeToken,
  isTokenExpiringSoon: jwt.isTokenExpiringSoon,
  refreshToken: jwt.refreshToken,

  // RBAC functions
  ROLES: rbac.ROLES,
  hasPermission: rbac.hasPermission,
  hasAnyPermission: rbac.hasAnyPermission,
  hasAllPermissions: rbac.hasAllPermissions,
  hasRoleLevel: rbac.hasRoleLevel,
  getRolePermissions: rbac.getRolePermissions,
  isValidRole: rbac.isValidRole,
  canAccessResource: rbac.canAccessResource,
  canPerformGroupAction: rbac.canPerformGroupAction,

  // Express middleware
  createAuthMiddleware: middleware.createAuthMiddleware,
  requirePermission: middleware.requirePermission,
  requireRole: middleware.requireRole,
  requireOwnership: middleware.requireOwnership,
  optionalAuth: middleware.optionalAuth
};
