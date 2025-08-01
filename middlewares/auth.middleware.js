// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const verifyTokenAndTenant = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const tenantIdHeader = req.headers['x-tenant-id'];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!tenantIdHeader || tenantIdHeader !== decoded.tenantId) {
      return res.status(403).json({ error: 'Invalid or missing tenant ID' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    const mergedPermissions = {};
    user?.userRoles?.forEach((ur) => {
      const perms = ur.role?.permissions || {};
      for (const module in perms) {
        if (!mergedPermissions[module]) mergedPermissions[module] = new Set();
        perms[module].forEach((perm) => mergedPermissions[module].add(perm));
      }
    });

    // Convert Sets back to arrays
    for (const module in mergedPermissions) {
      mergedPermissions[module] = Array.from(mergedPermissions[module]);
    }

    req.user.permissions = mergedPermissions;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  verifyTokenAndTenant,
};
