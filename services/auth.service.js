const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const authService = {
  async login(email, password) {
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        user_roles: { include: { role: true } },
        tenants: true
      }
    });

    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error('Invalid credentials');

    if (!user.is_verified) throw new Error('Email not verified');

    const roleObj = user.user_roles?.[0]?.role || null;

    const plan = await prisma.plan.findUnique({
      where: {
        id: user.tenants?.plan_id || '5020a2db-ac2f-4ddc-b12d-5aa83e3cbcc2'
      }
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        role: roleObj?.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenant_id: user.tenant_id,
        role: roleObj,
        is_verified: user.is_verified,
        plan
      }
    };
  },

  generateInviteToken(data, expiresIn = '72h') {
    return jwt.sign(data, JWT_SECRET, { expiresIn });
  },

  verifyInviteToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  },

  async createUserFromInvite({ token, name, password }) {
    const payload = authService.verifyInviteToken(token);
    if (!payload) throw new Error('Invalid or expired token');

    const { email, tenant_id, role_id } = payload;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) throw new Error('User already exists');

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        tenant_id,
        password_hash,
        is_verified: true
      }
    });

    await prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id
      }
    });

    return user;
  }
};

module.exports = authService;
