const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tenantContext = async (req, res, next) => {
  try {
    if (!req.user?.tenant_id) {
      return res.status(400).json({ error: 'Tenant context not found' });
    }

    // Get tenant details with active subscription
    const tenant = await prisma.tenants.findUnique({
      where: { id: req.user.tenant_id },
      include: {
        subscriptions: {
          where: {
            is_active: true,
            end_date: {
              gte: new Date()
            }
          },
          orderBy: {
            end_date: 'desc'
          },
          take: 1
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if tenant is active
    if (!tenant.is_active) {
      return res.status(403).json({ error: 'Tenant account is inactive' });
    }

    // Check if tenant has active subscription
    if (!tenant.subscriptions || tenant.subscriptions.length === 0) {
      return res.status(403).json({ error: 'No active subscription found' });
    }

    // Attach tenant context to request
    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      subscription: tenant.subscriptions[0]
    };

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    return res.status(500).json({ error: 'Error processing tenant context' });
  }
};

module.exports = { tenantContext }; 