const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const authService = require('../services/auth.service');
const { generateToken } = require('../utils/jwt.util');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const ADMIN_ROLE_ID = '611e24f3-856f-471e-9d24-959f8b2e3dc1';

const login = async (req, res) => {
  const { email, password } = req.body;

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
    if (user.isActive === false) return res.status(403).json({ error: 'User is not active.' });

    if (!user.userRoles || user.userRoles.length === 0) {
      // Optionally assign a default role here if needed
      // For now, just return an error
      return res.status(403).json({ error: 'No roles assigned to user.' });
    }

    const roleObj = user.userRoles[0]?.role;
    // No plan lookup since there is no plan model in schema

    const token = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: roleObj?.name
    });

    const { passwordHash, userRoles, tenant, ...userData } = user;

    res.json({
      user: {
        ...userData,
        role: roleObj,
        isActive: user.isActive,
        tenant,
      },
      token
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const inviteUser = async (req, res) => {
  const { email, tenant_id, role_id } = req.body;

  if (!email || !tenant_id || !role_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const token = authService.generateInviteToken({ email, tenant_id, role_id });

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"TexIntelli" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'You are invited to join TexIntelli',
      html: `
        <p>Hello,</p>
        <p>You have been invited to join TexIntelli. Click below to accept the invitation:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        <p>This link will expire in 72 hours.</p>
      `
    });

    res.status(200).json({ message: 'Invitation sent, check your email' });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

const acceptInvite = async (req, res) => {
  const { token, name, password } = req.body;

  if (!token || !name || !password) {
    return res.status(400).json({ error: 'Missing fields: token, name, password' });
  }

  try {
    const user = await authService.createUserFromInvite({ token, name, password });

    res.status(201).json({
      message: 'Account created and role assigned',
      user_id: user.id
    });
  } catch (err) {
    console.error('Accept Invite Error:', err);
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  login,
  inviteUser,
  acceptInvite
};
