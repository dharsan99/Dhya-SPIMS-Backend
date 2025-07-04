const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt.util');
const prisma = new PrismaClient();

const ADMIN_ROLE_ID = 'cfd974b7-4841-4256-a402-0ea020d06f83'; // Global admin role

const login = async (req, res) => {
  const { email, password } = req.body;

  let user = await prisma.users.findUnique({
    where: { email },
    include: {
      user_roles: { include: { role: true } },
      tenants: true
    }
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  if (!user.is_verified) {
    return res.status(403).json({ error: 'Please verify your email before logging in.' });
  }

  // ✅ If user has no roles assigned, assign the fixed admin role
  if (!user.user_roles || user.user_roles.length === 0) {
    try {
      await prisma.user_roles.create({
        data: {
          user_id: user.id,
          role_id: ADMIN_ROLE_ID
        }
      });

      // Reload user with new role assigned
      user = await prisma.users.findUnique({
        where: { email },
        include: {
          user_roles: { include: { role: true } },
          tenants: true
        }
      });
    } catch (err) {
      if (err.code === 'P2002') {
        console.log('Admin role already assigned to user.');
      } else {
        console.error('Role assignment error:', err);
        return res.status(500).json({ error: 'Failed to assign admin role' });
      }
    }
  }

  const roleObj = user.user_roles?.[0]?.role;
  const roleName = roleObj?.name || 'admin';
  const permissions = roleObj?.permissions || {};

  // ✅ Fetch tenant plan
  const tenantPlanId = user.tenants?.plan_id || '5020a2db-ac2f-4ddc-b12d-5aa83e3cbcc2';
  const plan = await prisma.plan.findUnique({
    where: { id: tenantPlanId }
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    tenant_id: user.tenant_id,
    role: roleName
  });

  const { password_hash, user_roles, tenants, ...userData } = user;

  res.json({
    user: {
      ...userData,
      role: roleName,
      is_verified: user.is_verified,
      plan
    },
    permissions,
    token
  });
};

module.exports = { login };
