const { signupUser, verifyEmailToken } = require('../services/verify.service');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, tenant_id } = req.body;
    if (!name || !email || !password || !tenant_id) return res.status(400).json({ error: 'Missing fields' });

    const result = await signupUser({ name, email, password, tenant_id });
    res.status(201).json({
      message: 'Signup successful. Please check your email to verify your account.',
      email: result.email,
      tenant_id: result.tenant_id,
      user_id: result.user_id,
      assigned_role_id: result.assigned_role_id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const result = await verifyEmailToken(token);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
