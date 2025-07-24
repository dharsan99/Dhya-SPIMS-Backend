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
    let user = await prisma.Users.findUnique({
      where: { email },
      include: {
        user_roles: { include: { role: true } },
        tenants: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email before logging in.' });

    if (!user.user_roles || user.user_roles.length === 0) {
      await prisma.user_roles.create({
        data: { user_id: user.id, role_id: ADMIN_ROLE_ID }
      });

      user = await prisma.users.findUnique({
        where: { email },
        include: {
          user_roles: { include: { role: true } },
          tenants: true
        }
      });
    }

    const roleObj = user.user_roles[0]?.role;
    const plan = await prisma.plan.findUnique({
      where: { id: user.tenants?.plan_id || '5020a2db-ac2f-4ddc-b12d-5aa83e3cbcc2' }
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      role: roleObj?.name
    });

    const { password_hash, user_roles, tenants, ...userData } = user;

    res.json({
      user: {
        ...userData,
        role: roleObj,
        is_verified: user.is_verified,
        plan
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
