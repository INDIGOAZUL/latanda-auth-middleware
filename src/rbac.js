/**
 * Role-Based Access Control (RBAC) System
 * Extracted from La Tanda production system
 * Supports: ADMIN, MIT (Member-in-Trust), IT (Information Technology), USER
 */

/**
 * Role hierarchy and permissions mapping
 */
const ROLES = {
  ADMIN: {
    name: 'ADMIN',
    level: 100,
    permissions: [
      'full_access',
      'user_management',
      'system_config',
      'approve_deposits',
      'manage_groups',
      'view_analytics',
      'manage_roles',
      'delete_users',
      'system_settings'
    ]
  },
  MIT: {
    name: 'MIT', // Member-in-Trust (Group coordinator)
    level: 50,
    permissions: [
      'create_groups',
      'manage_own_groups',
      'approve_members',
      'view_group_analytics',
      'edit_group_settings'
    ]
  },
  IT: {
    name: 'IT', // Information Technology (Developer/Support)
    level: 75,
    permissions: [
      'view_system_logs',
      'debug_access',
      'api_access',
      'view_analytics',
      'technical_support'
    ]
  },
  USER: {
    name: 'USER',
    level: 10,
    permissions: [
      'view_own_profile',
      'edit_own_profile',
      'join_groups',
      'make_payments',
      'view_own_transactions'
    ]
  }
};

/**
 * Check if user has specific permission
 * @param {string} userRole - User's role (ADMIN, MIT, IT, USER)
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean} True if user has permission
 */
function hasPermission(userRole, requiredPermission) {
  const role = ROLES[userRole];
  if (!role) return false;

  // ADMIN has all permissions
  if (userRole === 'ADMIN') return true;

  return role.permissions.includes(requiredPermission);
}

/**
 * Check if user has any of the specified permissions
 * @param {string} userRole - User's role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has at least one permission
 */
function hasAnyPermission(userRole, permissions) {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 * @param {string} userRole - User's role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has all permissions
 */
function hasAllPermissions(userRole, permissions) {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Check if user's role is at or above required level
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean} True if user's role level meets requirement
 */
function hasRoleLevel(userRole, requiredRole) {
  const userRoleData = ROLES[userRole];
  const requiredRoleData = ROLES[requiredRole];

  if (!userRoleData || !requiredRoleData) return false;

  return userRoleData.level >= requiredRoleData.level;
}

/**
 * Get all permissions for a role
 * @param {string} role - Role name
 * @returns {string[]} Array of permissions
 */
function getRolePermissions(role) {
  const roleData = ROLES[role];
  return roleData ? roleData.permissions : [];
}

/**
 * Check if role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} True if role exists
 */
function isValidRole(role) {
  return Object.keys(ROLES).includes(role);
}

/**
 * Enforce resource ownership (user can only access their own resources)
 * @param {string} userId - Authenticated user ID
 * @param {string} resourceOwnerId - Resource owner ID
 * @param {string} userRole - User's role (ADMINs bypass this check)
 * @returns {boolean} True if user owns resource or is ADMIN
 */
function canAccessResource(userId, resourceOwnerId, userRole) {
  // ADMIN can access all resources
  if (userRole === 'ADMIN') return true;

  // User must own the resource
  return userId === resourceOwnerId;
}

/**
 * Check if user can perform action on group
 * @param {string} userId - Authenticated user ID
 * @param {Object} group - Group object with creator_id
 * @param {string} userRole - User's role
 * @param {string} action - Action to perform (edit, delete, approve_members, etc.)
 * @returns {boolean} True if action is allowed
 */
function canPerformGroupAction(userId, group, userRole, action) {
  // ADMIN can do anything
  if (userRole === 'ADMIN') return true;

  // MIT can manage their own groups
  if (userRole === 'MIT' && group.creator_id === userId) {
    const mitActions = ['edit', 'delete', 'approve_members', 'manage_settings'];
    return mitActions.includes(action);
  }

  // Regular users can only view
  if (action === 'view') return true;

  return false;
}

module.exports = {
  ROLES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRoleLevel,
  getRolePermissions,
  isValidRole,
  canAccessResource,
  canPerformGroupAction
};
