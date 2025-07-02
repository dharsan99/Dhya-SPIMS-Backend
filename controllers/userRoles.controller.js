const userRolesService = require('../services/userRoles.service');
//const { validate: isUuid } = require('uuid');

exports.createRole = async (req, res) => {
  try {
    const result = await userRolesService.createRole(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Role creation error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const result = await userRolesService.getRoleById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const { tenantId, ...restQuery } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenantId' });
    }

    const result = await userRolesService.getAllRoles({ tenantId, ...restQuery });
    res.json(result);
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const result = await userRolesService.updateRole(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(result);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const result = await userRolesService.deleteRole(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

exports.getUsersWithRolesByTenant = async (req, res) => {
  const { tenant_id } = req.query;

  try {
    const users = await userRolesService.getUsersWithRolesByTenant({ tenant_id });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users with roles:', error.message);
    res.status(400).json({ error: error.message || 'Failed to get users with roles' });
  }
};
