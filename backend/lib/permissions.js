const { getPermissionsForRole, hasPermission, hasAnyPermission, hasAllPermissions } = require('./rolePermissions');

/**
 * Safely parse permissions from database
 * Handles various formats: JSON arrays, comma-separated strings, single strings, objects, etc.
 */
const parsePermissions = (permissions) => {
  if (!permissions) return [];

  // If it's already an array, process its contents
  if (Array.isArray(permissions)) {
    return permissions.map(permission => {
      if (permission === 'all') {
        return 'system:full_access';
      }
      return permission;
    });
  }

  // If it's a string, try to parse it as JSON
  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      return parsePermissions(parsed); // Recursively process the parsed result
    } catch (error) {
      // Handle legacy format where permissions might be comma-separated strings
      if (permissions === 'all') {
        return ['system:full_access'];
      }
      if (permissions.includes(',')) {
        return permissions.split(',').map(p => p.trim());
      }
      // Single permission
      return [permissions];
    }
  }

  // If it's an object (from MySQL JSON column), convert to array
  if (typeof permissions === 'object' && permissions !== null) {
    // If it's an array-like object, convert to array
    if (Array.isArray(permissions)) {
      return parsePermissions(permissions); // Recursively process the array
    }

    // If it's a single value object, extract the value
    const values = Object.values(permissions);
    if (values.length === 1) {
      const value = values[0];
      if (value === 'all') {
        return ['system:full_access'];
      }
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map(p => p.trim());
      }
      return [value];
    }

    // If it's an object with multiple values, return the values
    return values;
  }

  return [];
};

/**
 * Get permissions for a user based on their role and stored permissions
 * @param {string} role - User's role
 * @param {any} storedPermissions - Permissions stored in database
 * @returns {string[]} Array of permissions
 */
const getUserPermissions = (role, storedPermissions = null) => {
  // Get base permissions for the role
  const rolePermissions = getPermissionsForRole(role);

  // If no stored permissions, return role-based permissions
  if (!storedPermissions) {
    return rolePermissions;
  }

  // Parse stored permissions
  const parsedStoredPermissions = parsePermissions(storedPermissions);

  // Combine role permissions with stored permissions
  const allPermissions = new Set([...rolePermissions, ...parsedStoredPermissions]);

  return Array.from(allPermissions);
};

/**
 * Check if user has a specific permission
 * @param {string} role - User's role
 * @param {string} permission - Permission to check
 * @param {any} storedPermissions - Permissions stored in database
 * @returns {boolean} True if user has the permission
 */
const userHasPermission = (role, permission, storedPermissions = null) => {
  const userPermissions = getUserPermissions(role, storedPermissions);
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {string} role - User's role
 * @param {string[]} permissions - Permissions to check
 * @param {any} storedPermissions - Permissions stored in database
 * @returns {boolean} True if user has any of the permissions
 */
const userHasAnyPermission = (role, permissions, storedPermissions = null) => {
  const userPermissions = getUserPermissions(role, storedPermissions);
  return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {string} role - User's role
 * @param {string[]} permissions - Permissions to check
 * @param {any} storedPermissions - Permissions stored in database
 * @returns {boolean} True if user has all of the permissions
 */
const userHasAllPermissions = (role, permissions, storedPermissions = null) => {
  const userPermissions = getUserPermissions(role, storedPermissions);
  return permissions.every(permission => userPermissions.includes(permission));
};

/**
 * Validate permissions for a role
 * @param {string} role - User's role
 * @param {string[]} permissions - Permissions to validate
 * @returns {object} Validation result with valid and invalid permissions
 */
const validatePermissionsForRole = (role, permissions) => {
  const rolePermissions = getPermissionsForRole(role);
  const validPermissions = [];
  const invalidPermissions = [];

  permissions.forEach(permission => {
    if (rolePermissions.includes(permission)) {
      validPermissions.push(permission);
    } else {
      invalidPermissions.push(permission);
    }
  });

  return {
    valid: validPermissions,
    invalid: invalidPermissions,
    isValid: invalidPermissions.length === 0
  };
};

module.exports = {
  parsePermissions,
  getUserPermissions,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  validatePermissionsForRole
};