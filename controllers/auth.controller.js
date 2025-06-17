const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt.util');
const prisma = new PrismaClient();

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.users.findUnique({
    where: { email },
    include: {
      user_roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  // Merge permissions
  const mergedPermissions = {};
  for (const ur of user.user_roles) {
    const rolePerms = ur.role?.permissions || {};
    for (const [module, actions] of Object.entries(rolePerms)) {
      if (!mergedPermissions[module]) mergedPermissions[module] = new Set();
      actions.forEach(action => mergedPermissions[module].add(action));
    }
  }

  // Convert Sets back to arrays
  for (const module in mergedPermissions) {
    mergedPermissions[module] = Array.from(mergedPermissions[module]);
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
    tenant_id: user.tenant_id,
    email: user.email
  });

  const { password_hash, ...userData } = user;
  res.json({
    user: {
      ...userData,
      permissions: mergedPermissions
    },
    token
  });
};

module.exports = { login };
