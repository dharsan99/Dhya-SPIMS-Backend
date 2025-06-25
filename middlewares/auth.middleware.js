// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

const verifyTokenAndTenant = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const tenantIdHeader = req.headers['x-tenant-id'];

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Bearer token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!tenantIdHeader || tenantIdHeader !== decoded.tenant_id) {
      return res.status(403).json({ error: 'Invalid or missing tenant ID' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenant_id,
    };

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      include: {
        user_roles: { include: { role: true } },
      },
    });

    const mergedPermissions = {};
    user?.user_roles?.forEach((ur) => {
      const perms = ur.role?.permissions || {};
      for (const module in perms) {
        if (!mergedPermissions[module]) mergedPermissions[module] = new Set();
        perms[module].forEach((action) => mergedPermissions[module].add(action));
      }
    });

    for (const module in mergedPermissions) {
      mergedPermissions[module] = Array.from(mergedPermissions[module]);
    }

    req.user.permissions = mergedPermissions;
    next();
  } catch (err) {
    console.error('JWT auth error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  verifyTokenAndTenant,
};
