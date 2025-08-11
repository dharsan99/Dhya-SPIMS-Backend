const { signupUser, verifyEmailToken } = require('../services/verify.service');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, tenantId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const result = await signupUser({ name, email, password, tenantId });
    res.status(201).json({
      message: 'Signup successful. Please check your email to verify your account.',
      email: result.email,
      tenantId: result.tenantId,
      userId: result.userId,
      assignedRoleId: result.assignedRoleId
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific error types
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: error.message });
    }
    if (error.message === 'Tenant not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Default role (admin) not found') {
      return res.status(500).json({ error: 'System configuration error. Please contact support.' });
    }
    
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Missing verification token' });
    }

    const result = await verifyEmailToken(token);
    res.status(200).json(result);
  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error.message === 'Invalid or expired token') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
};

exports.adminSignup = async (req, res) => {
  try {
    const { name, email, password, tenantId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const result = await signupUser({ name, email, password, tenantId, isSuperadmin: true });
    res.status(201).json({
      message: 'Admin signup successful. Please check your email to verify your account.',
      email: result.email,
      tenantId: result.tenantId,
      userId: result.userId,
      assignedRoleId: result.assignedRoleId
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    
    // Handle specific error types
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: error.message });
    }
    if (error.message === 'Tenant not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Default role (admin) not found') {
      return res.status(500).json({ error: 'System configuration error. Please contact support.' });
    }
    
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
};