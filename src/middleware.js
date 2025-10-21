/**
 * Express Middleware for JWT Authentication
 * Production-ready authentication middleware from latanda.online
 */

const { validateToken } = require('./jwt');
const { hasPermission, hasRoleLevel, isValidRole } = require('./rbac');

/**
 * Create authentication middleware
 * @param {Object} config - Configuration options
 * @param {string} config.jwtSecret - JWT secret key
 * @param {string} [config.issuer='latanda.online'] - Token issuer
 * @param {string} [config.audience='latanda-web-app'] - Token audience
 * @param {Function} [config.onUnauthorized] - Custom unauthorized handler
 * @returns {Function} Express middleware
 */
function createAuthMiddleware(config) {
  const {
    jwtSecret,
    issuer = 'latanda.online',
    audience = 'latanda-web-app',
    onUnauthorized
  } = config;

  if (!jwtSecret) {
    throw new Error('@latanda/auth-middleware: jwtSecret is required');
  }

  return function authMiddleware(req, res, next) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = { message: 'Missing or invalid Authorization header', code: 'NO_TOKEN' };

      if (onUnauthorized) {
        return onUnauthorized(req, res, error);
      }

      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token
    const validation = validateToken(token, jwtSecret, { issuer, audience });

    if (!validation.valid) {
      const error = { message: validation.error, code: 'INVALID_TOKEN' };

      if (onUnauthorized) {
        return onUnauthorized(req, res, error);
      }

      return res.status(401).json({
        success: false,
        error: validation.error,
        code: 'INVALID_TOKEN',
        expired: validation.expired || false
      });
    }

    // Attach user data to request object
    req.user = {
      id: validation.user_id,
      email: validation.email,
      role: validation.role,
      permissions: validation.permissions
    };
    req.token = token;

    next();
  };
}

/**
 * Middleware to require specific permission
 * Must be used AFTER authMiddleware
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @param {Object} options - Options
 * @param {boolean} [options.requireAll=false] - Require all permissions vs any
 * @returns {Function} Express middleware
 */
function requirePermission(requiredPermissions, options = {}) {
  const { requireAll = false } = options;
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return function permissionMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before permission check',
        code: 'NO_AUTH'
      });
    }

    const userRole = req.user.role;

    // Check permissions
    const hasAccess = requireAll
      ? permissions.every(perm => hasPermission(userRole, perm))
      : permissions.some(perm => hasPermission(userRole, perm));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: permissions,
        userRole
      });
    }

    next();
  };
}

/**
 * Middleware to require specific role level or higher
 * Must be used AFTER authMiddleware
 * @param {string} minimumRole - Minimum role required (ADMIN, MIT, IT, USER)
 * @returns {Function} Express middleware
 */
function requireRole(minimumRole) {
  if (!isValidRole(minimumRole)) {
    throw new Error(`Invalid role: ${minimumRole}. Must be ADMIN, MIT, IT, or USER`);
  }

  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before role check',
        code: 'NO_AUTH'
      });
    }

    const userRole = req.user.role;

    if (!hasRoleLevel(userRole, minimumRole)) {
      return res.status(403).json({
        success: false,
        error: `Requires ${minimumRole} role or higher`,
        code: 'INSUFFICIENT_ROLE',
        required: minimumRole,
        current: userRole
      });
    }

    next();
  };
}

/**
 * Middleware to enforce resource ownership
 * Ensures user can only access their own resources (unless ADMIN)
 * Must be used AFTER authMiddleware
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware
 */
function requireOwnership(getResourceOwnerId) {
  return async function ownershipMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    // ADMIN bypasses ownership checks
    if (req.user.role === 'ADMIN') {
      return next();
    }

    try {
      // Get resource owner ID
      const resourceOwnerId = typeof getResourceOwnerId === 'function'
        ? await getResourceOwnerId(req)
        : getResourceOwnerId;

      if (req.user.id !== resourceOwnerId) {
        return res.status(403).json({
          success: false,
          error: 'You can only access your own resources',
          code: 'NOT_OWNER'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to verify resource ownership',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }
  };
}

/**
 * Optional authentication middleware
 * Validates token if present, but doesn't require it
 * Useful for endpoints that work with or without auth
 */
function optionalAuth(config) {
  const {
    jwtSecret,
    issuer = 'latanda.online',
    audience = 'latanda-web-app'
  } = config;

  if (!jwtSecret) {
    throw new Error('@latanda/auth-middleware: jwtSecret is required');
  }

  return function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    // No token provided - continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const validation = validateToken(token, jwtSecret, { issuer, audience });

    if (validation.valid) {
      req.user = {
        id: validation.user_id,
        email: validation.email,
        role: validation.role,
        permissions: validation.permissions
      };
      req.token = token;
    } else {
      req.user = null;
    }

    next();
  };
}

module.exports = {
  createAuthMiddleware,
  requirePermission,
  requireRole,
  requireOwnership,
  optionalAuth
};
