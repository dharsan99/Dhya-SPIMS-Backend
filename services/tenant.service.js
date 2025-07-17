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
    // Create tenant
    const tenant = await prisma.tenants.create({
      data: {
        name,
        domain,
        plan: data.plan || 'free',
        is_active: true,
        address,
        industry,
        phone,
      }
    });
    // Return grouped companyDetails and domain at top level
    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain || '',
      plan: tenant.plan,
      is_active: tenant.is_active,
      companyDetails: {
        address: tenant.address || '',
        phone: tenant.phone || '',
        industry: tenant.industry || '',
        domain: tenant.domain || '',
      },
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
    };
  },

  async getTenantById(id) {
    return prisma.tenants.findUnique({
      where: { id },
      include: {
        settings: true,
        users: true
      }
    });
  },

  async updateTenant(id, data) {
    return prisma.tenants.update({
      where: { id },
      data: {
        name: data.name,
        domain: data.domain,
        plan: data.plan,
        is_active: data.is_active
      }
    });
  },

  async deleteTenant(id) {
    return prisma.tenants.delete({
      where: { id }
    });
  }
};

module.exports = tenantService;
