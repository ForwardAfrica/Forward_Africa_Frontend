/**
 * Role-based permissions configuration
 * Defines what permissions each role has access to
 */

const ROLE_PERMISSIONS = {
  // Basic user permissions
  user: [
    'courses:view',
    'courses:take',
    'profile:edit',
    'certificates:view',
    'achievements:view',
    'progress:view'
  ],

  // Content management permissions
  content_manager: [
    'courses:view',
    'courses:take',
    'analytics:view',
    'content:edit',
    'content:delete',
    'content:create',
    'instructors:manage',
    'media:upload',
    'content:review',
    'content:publish',
    'content:workflow',
    'profile:edit',
    'certificates:view',
    'achievements:view',
    'progress:view'
  ],

  // Community management permissions
  community_manager: [
    'courses:view',
    'courses:take',
    'analytics:view',
    'users:manage',
    'users:view',
    'users:suspend',
    'users:activate',
    'users:ban',
    'users:unban',
    'community:moderate',
    'support:handle',
    'support:view_tickets',
    'support:respond_tickets',
    'users:view_activity',
    'profile:edit',
    'certificates:view',
    'achievements:view',
    'progress:view'
  ],

  // User support permissions
  user_support: [
    'courses:view',
    'courses:take',
    'analytics:view',
    'support:handle',
    'support:view_tickets',
    'support:respond_tickets',
    'support:close_tickets',
    'community:moderate_basic',
    'users:view_profile',
    'users:view_activity',
    'profile:edit',
    'certificates:view',
    'achievements:view',
    'progress:view'
  ],

  // Super admin permissions (includes all permissions)
  super_admin: [
    'courses:view',
    'courses:take',
    'analytics:view',
    'content:edit',
    'content:delete',
    'content:create',
    'instructors:manage',
    'media:upload',
    'content:review',
    'content:publish',
    'content:workflow',
    'users:manage',
    'users:view',
    'users:suspend',
    'users:activate',
    'users:ban',
    'users:unban',
    'community:moderate',
    'support:handle',
    'support:view_tickets',
    'support:respond_tickets',
    'support:close_tickets',
    'users:view_activity',
    'audit:view',
    'audit:export',
    'system:configure',
    'system:backup',
    'system:maintenance',
    'admins:create',
    'super_admins:manage',
    'security:configure',
    'database:manage',
    'profile:edit',
    'certificates:view',
    'achievements:view',
    'progress:view'
  ]
};

/**
 * Get permissions for a specific role
 * @param {string} role - The user role
 * @returns {string[]} Array of permissions for the role
 */
const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
};

/**
 * Check if a role has a specific permission
 * @param {string} role - The user role
 * @param {string} permission - The permission to check
 * @returns {boolean} True if the role has the permission
 */
const hasPermission = (role, permission) => {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - The user role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if the role has any of the permissions
 */
const hasAnyPermission = (role, permissions) => {
  const rolePermissions = getPermissionsForRole(role);
  return permissions.some(permission => rolePermissions.includes(permission));
};

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - The user role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if the role has all of the permissions
 */
const hasAllPermissions = (role, permissions) => {
  const rolePermissions = getPermissionsForRole(role);
  return permissions.every(permission => rolePermissions.includes(permission));
};

/**
 * Get all available permissions
 * @returns {string[]} Array of all available permissions
 */
const getAllPermissions = () => {
  const allPermissions = new Set();
  Object.values(ROLE_PERMISSIONS).forEach(permissions => {
    permissions.forEach(permission => allPermissions.add(permission));
  });
  return Array.from(allPermissions).sort();
};

/**
 * Get all available roles
 * @returns {string[]} Array of all available roles
 */
const getAllRoles = () => {
  return Object.keys(ROLE_PERMISSIONS);
};

/**
 * Check if a role can manage another role
 * @param {string} currentRole - The current user's role
 * @param {string} targetRole - The role to be managed
 * @returns {boolean} True if the current role can manage the target role
 */
const canManageRole = (currentRole, targetRole) => {
  const roleHierarchy = {
    'super_admin': ['user', 'content_manager', 'community_manager', 'user_support', 'super_admin'],
    'community_manager': ['user', 'user_support'],
    'content_manager': ['user'], // Content managers can't manage other roles
    'user_support': ['user'], // User support can't manage other roles
    'user': [] // Users can't manage any roles
  };

  return roleHierarchy[currentRole]?.includes(targetRole) || false;
};

/**
 * Get roles that can be managed by a specific role
 * @param {string} role - The role to check
 * @returns {string[]} Array of roles that can be managed
 */
const getManageableRoles = (role) => {
  const roleHierarchy = {
    'super_admin': ['user', 'content_manager', 'community_manager', 'user_support', 'super_admin'],
    'community_manager': ['user', 'user_support'],
    'content_manager': ['user'],
    'user_support': ['user'],
    'user': []
  };

  return roleHierarchy[role] || [];
};

/**
 * Validate if a permission is valid
 * @param {string} permission - The permission to validate
 * @returns {boolean} True if the permission is valid
 */
const isValidPermission = (permission) => {
  const allPermissions = getAllPermissions();
  return allPermissions.includes(permission);
};

/**
 * Validate if a role is valid
 * @param {string} role - The role to validate
 * @returns {boolean} True if the role is valid
 */
const isValidRole = (role) => {
  return Object.keys(ROLE_PERMISSIONS).includes(role);
};

module.exports = {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
  getAllRoles,
  canManageRole,
  getManageableRoles,
  isValidPermission,
  isValidRole
};