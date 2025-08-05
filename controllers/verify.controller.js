const { signupUser, verifyEmailToken } = require('../services/verify.service');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, tenantId } = req.body;
    if (!name || !email || !password || !tenantId) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, tenantId' });
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
    res.status(500).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
};

exports.adminSignup = async (req, res) => {
  try {
    const { name, email, password, tenantId } = req.body;
    if (!name || !email || !password || !tenantId) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, tenantId' });
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
    res.status(500).json({ error: error.message });
  }
};
