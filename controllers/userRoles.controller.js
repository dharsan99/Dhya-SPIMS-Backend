const userRolesService = require('../services/userRoles.service');

exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions, tenantId } = req.body;
    
    if (!name || !tenantId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, tenantId' 
      });
    }

    const result = await userRolesService.createRole({
      name,
      description,
      permissions,
      tenantId
    });
    
    res.status(201).json({
      message: 'Role created successfully',
      role: result
    });
  } catch (error) {
    console.error('Role creation error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userRolesService.getRoleById(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({
      message: 'Role retrieved successfully',
      role: result
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const { tenantId, page = 1, limit = 10, search = '' } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenantId' });
    }

    const result = await userRolesService.getAllRoles({ 
      tenantId, 
      page: parseInt(page), 
      limit: parseInt(limit), 
      search 
    });
    
    res.json({
      message: 'Roles retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await userRolesService.updateRole(id, {
      name,
      description,
      permissions
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({
      message: 'Role updated successfully',
      role: result
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userRolesService.deleteRole(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({ 
      message: 'Role deleted successfully',
      role: result
    });
  } catch (error) {
    console.error('Delete role error:', error);
    if (error.message.includes('Cannot delete role with assigned users')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

exports.assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    if (!userId || !roleId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, roleId' 
      });
    }

    const result = await userRolesService.assignRoleToUser(userId, roleId);
    
    res.json({
      message: 'Role assigned to user successfully',
      userRole: result
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: 'Failed to assign role to user' });
  }
};

exports.getUsersWithRolesByTenant = async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenantId' });
    }

    const users = await userRolesService.getUsersWithRolesByTenant({ tenantId });
    
    res.json({
      message: 'Users with roles retrieved successfully',
      users
    });
  } catch (error) {
    console.error('Error fetching users with roles:', error.message);
    res.status(400).json({ error: error.message || 'Failed to get users with roles' });
  }
};

exports.getRolesByTenant = async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenantId' });
    }

    const roles = await userRolesService.getRolesByTenant(tenantId);
    
    res.json({
      message: 'Roles retrieved successfully',
      roles
    });
  } catch (error) {
    console.error('Get roles by tenant error:', error);
    res.status(500).json({ error: 'Failed to get roles by tenant' });
  }
};
