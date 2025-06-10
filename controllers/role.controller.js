const roleService = require('../services/role.service');
const { validationResult } = require('express-validator');

/**
 * Create a new role for a tenant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createRole = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, permissions, tenant_id } = req.body;
    
    // Use tenant_id from request body or fallback to user's tenant
    const tenantId = tenant_id || req.user.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID is required'
      });
    }

    // Validate permissions structure
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        error: 'Permissions must be a valid object'
      });
    }

    const roleData = {
      name: name.trim(),
      permissions,
      tenant_id: tenantId,
      description: req.body.description || null
    };

    const newRole = await roleService.createRole(roleData);

    res.status(201).json({
      message: 'Role created successfully',
      data: newRole
    });

  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Role name already exists for this tenant'
      });
    }
    
    if (error.message.includes('Tenant not found')) {
      return res.status(404).json({
        error: 'Tenant not found'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Get all roles for a tenant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRolesByTenant = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID is required'
      });
    }

    const roles = await roleService.getRolesByTenant(tenantId);

    res.status(200).json({
      message: 'Roles retrieved successfully',
      data: roles,
      count: roles.length
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Get a specific role by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    const role = await roleService.getRoleById(id, tenantId);

    if (!role) {
      return res.status(404).json({
        error: 'Role not found'
      });
    }

    res.status(200).json({
      message: 'Role retrieved successfully',
      data: role
    });

  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Update a role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const updateData = req.body;

    // Validate permissions if provided
    if (updateData.permissions && typeof updateData.permissions !== 'object') {
      return res.status(400).json({
        error: 'Permissions must be a valid object'
      });
    }

    const updatedRole = await roleService.updateRole(id, tenantId, updateData);

    if (!updatedRole) {
      return res.status(404).json({
        error: 'Role not found'
      });
    }

    res.status(200).json({
      message: 'Role updated successfully',
      data: updatedRole
    });

  } catch (error) {
    console.error('Error updating role:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Role name already exists for this tenant'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Delete a role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    const deleted = await roleService.deleteRole(id, tenantId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Role not found'
      });
    }

    res.status(200).json({
      message: 'Role deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting role:', error);
    
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'Cannot delete role: it is being used by users'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Check if user has specific permission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkPermission = async (req, res) => {
  try {
    const { module, action } = req.query;
    const userId = req.user.id;

    if (!module || !action) {
      return res.status(400).json({
        error: 'Module and action are required'
      });
    }

    const hasPermission = await roleService.checkUserPermission(userId, module, action);

    res.status(200).json({
      hasPermission,
      module,
      action
    });

  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

module.exports = {
  createRole,
  getRolesByTenant,
  getRoleById,
  updateRole,
  deleteRole,
  checkPermission
};