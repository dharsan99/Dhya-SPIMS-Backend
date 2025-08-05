const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const authService = require('../services/auth.service');
const { generateToken } = require('../utils/jwt.util');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
//const ADMIN_ROLE_ID = '5020a2db-ac2f-4ddc-b12d-5aa83e3cbcc2';

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    let user = await prisma.users.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
        tenant: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated.' });

    // Handle both old string-based role and new userRoles relation
    let roleObj = null;
    let roleName = null;

    if (user.userRoles && user.userRoles.length > 0) {
      // New relation-based role
      roleObj = user.userRoles[0]?.role;
      roleName = roleObj?.name;
    } else if (user.role) {
      // Old string-based role (for backward compatibility)
      roleName = user.role;
      roleObj = { name: user.role, description: `${user.role} role` };
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: roleName
    });

    const { passwordHash, userRoles, tenant, ...userData } = user;

    res.json({
      user: {
        ...userData,
        role: roleObj,
        isActive: user.isActive
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const inviteUser = async (req, res) => {
  const { email, tenantId, roleId } = req.body;

  if (!email || !tenantId || !roleId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const token = authService.generateInviteToken({ email, tenantId, roleId });

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;

    // Check if email credentials are configured
    if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
      console.log('⚠️ Email credentials not configured. Skipping invitation email.');
      console.log('📧 Invitation token:', token);
      console.log('🔗 Manual invitation URL:', inviteLink);
      return res.json({ 
        message: 'Invitation created successfully (email not sent due to missing credentials)',
        inviteLink,
        token
      });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TexIntelli SPIMS" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'You are invited to join TexIntelli SPIMS',
      html: `
        <p>Hello,</p>
        <p>You have been invited to join TexIntelli SPIMS. Click below to accept the invitation:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        <p>This link will expire in 72 hours.</p>
      `
    });

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

const acceptInvite = async (req, res) => {
  const { token, name, password } = req.body;
  if (!token || !name || !password) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const user = await authService.createUserFromInvite({ token, name, password });

    res.status(201).json({
      message: 'Account created and role assigned',
      userId: user.id
    });
  } catch (err) {
    console.error('Accept Invite Error:', err);
    res.status(400).json({ error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(400).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    const result = await authService.resetPassword(token, password);
    res.json(result);
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  login,
  inviteUser,
  acceptInvite,
  forgotPassword,
  resetPassword
};
