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
        userRoles: { include: { role: true } },
        tenant: true
      }
    });

    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Invalid credentials');

    if (user.isActive === false) throw new Error('User is not active');

    const roleObj = user.userRoles?.[0]?.role || null;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
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
        tenantId: user.tenantId,
        role: roleObj,
        isActive: user.isActive,
        tenant: user.tenant
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

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        tenantId: tenant_id,
        passwordHash,
        isActive: true
      }
    });

    await prisma.userRoles.create({
      data: {
        userId: user.id,
        roleId: role_id
      }
    });

    return user;
  }
};

module.exports = authService;
