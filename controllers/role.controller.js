const roleService = require('../services/role.service');

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
    console.error('Delete Role Error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};