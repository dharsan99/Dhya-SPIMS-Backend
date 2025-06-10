const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create a new role
 * @param {Object} roleData - Role data object
 * @returns {Promise<Object>} Created role object
 */
const createRole = async (roleData) => {
  try {
    // Verify tenant exists
    const tenant = await prisma.tenants.findUnique({
      where: { id: roleData.tenant_id }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Create the role
    const role = await prisma.roles.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        tenant_id: roleData.tenant_id,
        updated_at: new Date()
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return role;
  } catch (error) {
    console.error('Service error creating role:', error);
    throw error;
  }
};

/**
 * Get all roles for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} Array of roles
 */
const getRolesByTenant = async (tenantId) => {
  try {
    const roles = await prisma.roles.findMany({
      where: {
        tenant_id: tenantId
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
        user_roles: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true
              }
            }
          }
        },
        _count: {
          select: {
            user_roles: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return roles;
  } catch (error) {
    console.error('Service error fetching roles:', error);
    throw error;
  }
};

/**
 * Get a role by ID
 * @param {string} roleId - Role ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Object|null>} Role object or null
 */
const getRoleById = async (roleId, tenantId) => {
  try {
    const role = await prisma.roles.findFirst({
      where: {
        id: roleId,
        tenant_id: tenantId
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
        user_roles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true
              }
            }
          }
        },
        role_permissions: true
      }
    });

    return role;
  } catch (error) {
    console.error('Service error fetching role by ID:', error);
    throw error;
  }
};

/**
 * Update a role
 * @param {string} roleId - Role ID
 * @param {string} tenantId - Tenant ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} Updated role object or null
 */
const updateRole = async (roleId, tenantId, updateData) => {
  try {
    // Check if role exists and belongs to tenant
    const existingRole = await prisma.roles.findFirst({
      where: {
        id: roleId,
        tenant_id: tenantId
      }
    });

    if (!existingRole) {
      return null;
    }

    // Prepare update data
    const dataToUpdate = {
      updated_at: new Date()
    };

    if (updateData.name) {
      dataToUpdate.name = updateData.name.trim();
    }

    if (updateData.description !== undefined) {
      dataToUpdate.description = updateData.description;
    }

    if (updateData.permissions) {
      dataToUpdate.permissions = updateData.permissions;
    }

    const updatedRole = await prisma.roles.update({
      where: {
        id: roleId
      },
      data: dataToUpdate,
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            user_roles: true
          }
        }
      }
    });

    return updatedRole;
  } catch (error) {
    console.error('Service error updating role:', error);
    throw error;
  }
};

/**
 * Delete a role
 * @param {string} roleId - Role ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
const deleteRole = async (roleId, tenantId) => {
  try {
    // Check if role exists and belongs to tenant
    const existingRole = await prisma.roles.findFirst({
      where: {
        id: roleId,
        tenant_id: tenantId
      },
      include: {
        user_roles: true
      }
    });

    if (!existingRole) {
      return false;
    }

    // Check if role is being used by users
    if (existingRole.user_roles.length > 0) {
      const error = new Error('Cannot delete role: it is being used by users');
      error.code = 'P2003';
      throw error;
    }

    await prisma.roles.delete({
      where: {
        id: roleId
      }
    });

    return true;
  } catch (error) {
    console.error('Service error deleting role:', error);
    throw error;
  }
};

/**
 * Get user's role and permissions
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User role and permissions
 */
const getUserRole = async (userId) => {
  try {
    const userRole = await prisma.user_roles.findFirst({
      where: {
        user_id: userId
      },
      include: {
        role: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return userRole;
  } catch (error) {
    console.error('Service error fetching user role:', error);
    throw error;
  }
};

/**
 * Check if user has specific permission
 * @param {string} userId - User ID
 * @param {string} module - Module name (e.g., 'Orders', 'Shades')
 * @param {string} action - Action name (e.g., 'Add Order', 'Delete Shade')
 * @returns {Promise<boolean>} True if user has permission
 */
const checkUserPermission = async (userId, module, action) => {
  try {
    const userRole = await getUserRole(userId);

    if (!userRole || !userRole.role || !userRole.role.permissions) {
      return false;
    }

    const permissions = userRole.role.permissions;

    // Check if module exists and has the required action
    if (permissions[module] && Array.isArray(permissions[module])) {
      return permissions[module].includes(action);
    }

    return false;
  } catch (error) {
    console.error('Service error checking user permission:', error);
    return false;
  }
};

/**
 * Get all available permissions template
 * @returns {Object} Permissions template structure
 */
const getPermissionsTemplate = () => {
  return {
    Orders: [
      'Add Order',
      'Update Order',
      'Delete Order',
      'View Order',
      'Export Orders'
    ],
    Shades: [
      'Add Shade',
      'Update Shade',
      'Delete Shade',
      'View Shade',
      'Export Shades'
    ],
    Fibres: [
      'Add Fibre',
      'Update Fibre',
      'Delete Fibre',
      'View Fibre',
      'Export Fibres'
    ],
    Users: [
      'Add User',
      'Update User',
      'Delete User',
      'View User',
      'Export Users'
    ],
    Reports: [
      'View Reports',
      'Export Reports',
      'Generate Reports'
    ],
    Settings: [
      'View Settings',
      'Update Settings',
      'Manage Roles',
      'Manage Permissions'
    ]
  };
};

/**
 * Validate permissions structure
 * @param {Object} permissions - Permissions object to validate
 * @returns {Object} Validation result
 */
const validatePermissions = (permissions) => {
  const template = getPermissionsTemplate();
  const errors = [];
  const validatedPermissions = {};

  for (const [module, actions] of Object.entries(permissions)) {
    if (!template[module]) {
      errors.push(`Invalid module: ${module}`);
      continue;
    }

    if (!Array.isArray(actions)) {
      errors.push(`Actions for ${module} must be an array`);
      continue;
    }

    const validActions = [];
    for (const action of actions) {
      if (template[module].includes(action)) {
        validActions.push(action);
      } else {
        errors.push(`Invalid action '${action}' for module '${module}'`);
      }
    }

    if (validActions.length > 0) {
      validatedPermissions[module] = validActions;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedPermissions
  };
};

module.exports = {
  createRole,
  getRolesByTenant,
  getRoleById,
  updateRole,
  deleteRole,
  getUserRole,
  checkUserPermission,
  getPermissionsTemplate,
  validatePermissions
};