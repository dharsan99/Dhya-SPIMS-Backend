// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const verifyTokenAndTenant = async (req, res, next) => {
  console.log('🔐 [AUTH] === VERIFY TOKEN AND TENANT ===');
  console.log('🔐 [AUTH] Request URL:', req.method, req.originalUrl);
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  const tenantIdHeader = req.headers['x-tenant-id'];

  console.log('🔐 [AUTH] Token exists:', !!token);
  console.log('🔐 [AUTH] Tenant ID header:', tenantIdHeader);

  if (!token) {
    console.log('❌ [AUTH] No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ [AUTH] Token verified, decoded:', {
      id: decoded.id,
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role
    });

    if (!tenantIdHeader || tenantIdHeader !== decoded.tenantId) {
      console.log('❌ [AUTH] Tenant ID mismatch:', {
        header: tenantIdHeader,
        token: decoded.tenantId
      });
      return res.status(403).json({ error: 'Invalid or missing tenant ID' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };

    console.log('✅ [AUTH] req.user set:', req.user);

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
    console.log('✅ [AUTH] Middleware completed successfully');
    next();
  } catch (error) {
    console.error('❌ [AUTH] Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  console.log('🔐 [AUTH] === JWT TOKEN VERIFICATION ===');
  console.log(`🔐 [AUTH] Request URL: ${req.method} ${req.originalUrl}`);
  console.log(`🔐 [AUTH] Headers received:`, {
    'user-agent': req.headers['user-agent'],
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? `Bearer ...${req.headers.authorization.slice(-6)}` : 'NONE'
  });
  
  // 🔍 Debug: Log incoming auth header (redact token length)
  if (process.env.DEBUG_AUTH === 'true') {
    console.log('\n[AuthMiddleware] Incoming Authorization:', req.headers.authorization ? `Bearer ...${req.headers.authorization.slice(-6)}` : 'NONE');
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('❌ [AUTH] Authorization header missing');
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('❌ [AUTH] Bearer token missing');
    return res.status(401).json({ error: 'Bearer token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ [AUTH] Token verified successfully');

    if (process.env.DEBUG_AUTH === 'true') {
      console.log('[AuthMiddleware] Decoded Token:', decoded);
    }

    // 🔁 Normalize keys for internal use
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      tenantId: decoded.tenantId, // ✅ Fixed: now reading camelCase tenantId
    };

    console.log('✅ [AUTH] User object set:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
      tenantId: req.user.tenantId
    });

    if (process.env.DEBUG_AUTH === 'true') {
      console.log('[AuthMiddleware] Req.user set:', req.user);
    }

    console.log('✅ [AUTH] === JWT TOKEN VERIFICATION SUCCESS ===');
    next();
  } catch (err) {
    console.error('❌ [AUTH] === JWT TOKEN VERIFICATION FAILED ===');
    console.error('[AuthMiddleware] Token verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * This middleware checks for a secret API key in the 'x-api-key' header.
 * It's used to protect endpoints that should only be accessible by our n8n workflows.
 */
const n8nAuthMiddleware = (req, res, next) => {
  console.log('🔐 [AUTH] === N8N API KEY VERIFICATION ===');
  console.log(`🔐 [AUTH] Request URL: ${req.method} ${req.originalUrl}`);
  
  const apiKey = req.headers['x-api-key'];
  console.log(`🔐 [AUTH] API Key received:`, apiKey ? `...${apiKey.slice(-6)}` : 'NONE');

  // 1. Check if the header exists
  if (!apiKey) {
    console.log('❌ [AUTH] API key is missing');
    return res.status(401).json({ message: 'Unauthorized: API key is missing.' });
  }

  // 2. Check if the key matches the one stored in your environment variables
  if (apiKey !== process.env.N8N_API_KEY) {
    console.log('❌ [AUTH] Invalid API key');
    return res.status(403).json({ message: 'Forbidden: Invalid API key.' });
  }

  console.log('✅ [AUTH] API key verified successfully');
  console.log('✅ [AUTH] === N8N API KEY VERIFICATION SUCCESS ===');
  // 3. If the key is valid, proceed to the next function (the controller)
  next();
};

/**
 * Combined middleware that accepts either JWT token or n8n API key
 * This allows the same endpoint to be used by both frontend users and n8n workflows
 */
const flexibleAuthMiddleware = (req, res, next) => {
  console.log('🔐 [AUTH] === FLEXIBLE AUTH MIDDLEWARE ===');
  console.log(`🔐 [AUTH] Request URL: ${req.method} ${req.originalUrl}`);
  console.log(`🔐 [AUTH] Headers received:`, {
    'authorization': req.headers.authorization ? `Bearer ...${req.headers.authorization.slice(-6)}` : 'NONE',
    'x-api-key': req.headers['x-api-key'] ? `...${req.headers['x-api-key'].slice(-6)}` : 'NONE'
  });
  
  // First, try JWT authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('🔐 [AUTH] Attempting JWT authentication...');
    return verifyToken(req, res, next);
  }

  // If no JWT, try n8n API key authentication
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    console.log('🔐 [AUTH] Attempting n8n API key authentication...');
    return n8nAuthMiddleware(req, res, next);
  }

  // If neither authentication method is provided
  console.log('❌ [AUTH] No valid authentication method provided');
  return res.status(401).json({ 
    error: 'Authentication required. Provide either Bearer token or x-api-key header.' 
  });
};

module.exports = {
  verifyTokenAndTenant,
  verifyToken, 
  n8nAuthMiddleware, 
  flexibleAuthMiddleware 
};
