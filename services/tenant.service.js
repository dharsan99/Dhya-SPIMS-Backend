const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tenantService = {
  async createTenant(data) {
    // Accept companyDetails object or flat fields
    const companyDetails = data.companyDetails || {};
    const name = data.name;
    const domain = data.domain || companyDetails.domain || null;
    const address = companyDetails.address || data.address || null;
    const industry = companyDetails.industry || data.industry || null;
    const phone = companyDetails.phone || data.phone || null;
    const logo = data.logo || null;
    
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        domain,
        plan: data.plan || 'TRIAL',
        isActive: true,
        address,
        industry,
        phone,
        logo,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    
    // Return grouped companyDetails and domain at top level
    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain || '',
      plan: tenant.plan,
      isActive: tenant.isActive,
      companyDetails: {
        address: tenant.address || '',
        phone: tenant.phone || '',
        industry: tenant.industry || '',
        domain: tenant.domain || '',
      },
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  },

  async getTenantById(id) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        settings: true,
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        },
        subscriptions: {
          include: {
            plan: true
          }
        }
      }
    });
  },

  async getAllTenants() {
    return prisma.tenant.findMany({
      include: {
        settings: true,
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        },
        subscriptions: {
          include: {
            plan: true
          }
        }
      }
    });
  },

  async updateTenant(id, data) {
    return prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        domain: data.domain,
        plan: data.plan,
        isActive: data.isActive,
        address: data.address,
        industry: data.industry,
        phone: data.phone,
        logo: data.logo,
        updatedAt: new Date()
      }
    });
  },

  async deleteTenant(id) {
    return prisma.tenant.delete({
      where: { id }
    });
  },

  async deactivateTenant(id) {
    return prisma.tenant.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
  }
};

module.exports = tenantService;
