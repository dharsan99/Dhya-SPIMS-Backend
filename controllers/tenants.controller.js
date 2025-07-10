const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllTenants = async (req, res) => {
  const tenants = await prisma.tenants.findMany();
  res.json(tenants);
};

const getTenantById = async (req, res) => {
  const tenant = await prisma.tenants.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(tenant);
};

const createTenant = async (req, res) => {
  const { name, domain } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  // Default plan values
  const planId = '15382d9a-6bdb-4769-8c62-08ffc86ddd8f';
  const planName = 'TRAIL';

  // Fetch plan data from plan table
  const planData = await prisma.plan.findUnique({ where: { id: planId } });

  // Create tenant
  const tenant = await prisma.tenants.create({
    data: {
      name,
      domain: domain || null,
      plan: planName,
      is_active: true,
    }
  });

  res.status(201).json({
    message: 'successfully tenant is created!',
    id: tenant.id,
    name: tenant.name,
    plan: planData ? [planData] : []
  });
};

const updateTenant = async (req, res) => {
  const updated = await prisma.tenants.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(updated);
};

const deactivateTenant = async (req, res) => {
  await prisma.tenants.update({
    where: { id: req.params.id },
    data: { is_active: false }
  });
  res.json({ message: 'Tenant deactivated' });
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deactivateTenant
};