const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllTenants = async (req, res) => {
  try {
    console.log('🔍 [TENANTS] Fetching all tenants...');
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('✅ [TENANTS] Database connection successful');
    } catch (dbError) {
      console.error('❌ [TENANTS] Database connection failed:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const tenants = await prisma.tenant.findMany({
      include: {
        subscriptions: {
          include: {
            plan: true
          }
        },
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });
    
    console.log(`✅ [TENANTS] Successfully fetched ${tenants.length} tenants`);
    res.json(tenants);
  } catch (error) {
    console.error('❌ [TENANTS] Error fetching tenants:', error);
    console.error('❌ [TENANTS] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

const getTenantById = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ 
      where: { id: req.params.id },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        },
        settings: true
      }
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
};

const createTenant = async (req, res) => {
  const { name, domain, address, industry, phone, logo } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!address) return res.status(400).json({ error: 'Address is required' });
  if (!industry) return res.status(400).json({ error: 'Industry is required' });

  try {
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        domain: domain || null,
        plan: 'TRIAL',
        isActive: true,
        address,
        industry,
        phone: phone || null,
        logo: logo || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Find the trial plan
    const trialPlan = await prisma.plan.findFirst({ 
      where: { name: 'Starter (14-day trial)' } 
    });
    
    let subscription = null;
    if (trialPlan) {
      subscription = await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: trialPlan.id,
          planType: trialPlan.name,
          startDate: new Date(),
          isActive: true,
        }
      });
    }

    res.status(201).json({
      message: 'Tenant created successfully!',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        plan: tenant.plan,
        isActive: tenant.isActive,
        address: tenant.address,
        industry: tenant.industry,
        phone: tenant.phone,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt
      },
      subscription: subscription ? {
        id: subscription.id,
        plan: trialPlan ? trialPlan.name : null,
        startDate: subscription.startDate,
        isActive: subscription.isActive
      } : null
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
};

const updateTenant = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  try {
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
};

const deactivateTenant = async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.tenant.update({
      where: { id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });
    res.json({ message: 'Tenant deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating tenant:', error);
    res.status(500).json({ error: 'Failed to deactivate tenant' });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deactivateTenant
};