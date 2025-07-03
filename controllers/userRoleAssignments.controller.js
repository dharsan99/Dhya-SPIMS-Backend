const userRolesAssignmentsService = require('../services/userRolesAssignments.service');

exports.assignRoleToUser = async (req, res) => {
  try {
    const result = await userRolesAssignmentsService.assignRoleToUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

exports.removeRoleFromUser = async (req, res) => {
  try {
    const result = await userRolesAssignmentsService.removeRoleFromUser(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ message: 'Role removed from user successfully' });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  }
};

exports.getUserRoles = async (req, res) => {
  try {
    const result = await userRolesAssignmentsService.getUserRoles(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ error: 'Failed to get user roles' });
  }
};