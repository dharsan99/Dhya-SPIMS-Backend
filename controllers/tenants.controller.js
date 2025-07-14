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

  // Create tenant
  const tenant = await prisma.tenants.create({
    data: {
      name,
      domain: domain || null,
      plan: 'TRIAL',
      is_active: true,
    }
  });

  // Find the plan with name 'Starter (4-day trial)'
  const trialPlan = await prisma.plan.findFirst({ where: { name: 'Starter (14-day trial)' } });
  let subscription = null;
  if (trialPlan) {
    subscription = await prisma.subscriptions.create({
      data: {
        tenant_id: tenant.id,
        plan_id: trialPlan.id,
        plan_type: trialPlan.name,
        start_date: new Date(),
        is_active: true,
      }
    });
  }

  res.status(201).json({
    message: 'successfully tenant is created!',
    id: tenant.id,
    name: tenant.name,
    subscription: subscription ? {
      id: subscription.id,
      plan: trialPlan ? trialPlan.name : null,
      start_date: subscription.start_date,
      is_active: subscription.is_active
    } : null
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