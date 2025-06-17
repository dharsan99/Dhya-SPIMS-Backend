const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const JWT_SECRET = process.env.JWT_SECRET;

const prisma = new PrismaClient();

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ error: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ error: 'Bearer token missing' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      tenantId: decoded.tenant_id,
    };

    // Optional: Inject permissions (from roles)
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const mergedPermissions = {};
    user.user_roles.forEach((ur) => {
      const perms = ur.role.permissions || {};
      for (const module in perms) {
        if (!mergedPermissions[module]) mergedPermissions[module] = [];
        mergedPermissions[module].push(...perms[module]);
      }
    });

    for (const module in mergedPermissions) {
      mergedPermissions[module] = [...new Set(mergedPermissions[module])];
    }

    req.user.permissions = mergedPermissions;

    next();
  } catch (err) {
    console.error('JWT auth error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };
