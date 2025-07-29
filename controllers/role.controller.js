//pullable request
const roleService = require('../services/role.service');




exports.getRoles = async (req, res) => {
  const { tenantId } = req.query;

  try {
    const roles = await roleService.getRolesByTenant(tenantId);
    // Transform roles to include all fields from schema
    const transformedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      tenantId: role.tenantId,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
    res.status(200).json(transformedRoles);
  } catch (error) {
    console.error('Get Roles Error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

exports.createRole = async (req, res) => {
  const { tenantId, name, description, permissions } = req.body;

  if (!tenantId || !name || !permissions) {
    return res.status(400).json({ error: 'Missing required fields: tenantId, name, permissions' });
  }

  try {
    const newRole = await roleService.createRole({ tenantId, name, description, permissions });
    res.status(201).json({ message: 'Role created successfully', data: newRole });
  } catch (error) {
    console.error('Create Role Error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

exports.updateRole = async (req, res) => {
  const { id, name, description, permissions } = req.body;

  if (!id || !name || !permissions) {
    return res.status(400).json({ error: 'Missing required fields: id, name, permissions' });
  }

  try {
    const updatedRole = await roleService.updateRole(id, { name, description, permissions });
    return res.status(200).json({ message: 'Role updated successfully', data: updatedRole });
  } catch (error) {
    console.error('Update Role Error:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
};


exports.deleteRole = async (req, res) => {
  try {
    const roleId = req.query.id;

    if (!roleId) {
      return res.status(400).json({ error: 'Role ID is required' });
    }

    await roleService.deleteRole(roleId);
    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    if (error.code === 'ROLE_IN_USE') {
      return res.status(400).json({ error: 'Cannot delete role: users are assigned to this role' });
    }
    console.error('Delete Role Error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

exports.getPermissions = async (req, res) => {
  try {
    const permissions = await roleService.getPermissions();
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Get Permissions Error:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};
