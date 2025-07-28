const userService = require('../services/user.service');

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, tenantId, roleId, isActive = true } = req.body;
    
    if (!name || !email || !password || !tenantId || !roleId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, password, tenantId, roleId' 
      });
    }

    const result = await userService.createUser({
      name,
      email,
      password,
      tenantId,
      roleId,
      isActive
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: result
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.getUserById(id);
    
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User retrieved successfully',
      user: result
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { tenantId, page, limit, search } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const result = await userService.getAllUsers({
      tenantId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search
    });
    
    res.json({
      message: 'Users retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.passwordHash;
    delete updateData.verificationToken;
    
    const result = await userService.updateUser(id, updateData);
    
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User updated successfully',
      user: result
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUser(id);
    
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

exports.getAllUsersRoles = async (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenantId' });
    }

    const result = await userService.getAllUsersRoles({ tenantId });
    
    res.json({
      message: 'User roles retrieved successfully',
      roles: result
    });
  } catch (error) {
    console.error('Get all user roles error:', error);
    res.status(500).json({ error: 'Failed to get user roles' });
  }
};
