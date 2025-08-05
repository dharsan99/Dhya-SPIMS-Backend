const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subscriptionService = {
  async create(data, tenantId) {
    const { planId, planType } = data;
    
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new Error('Plan not found');

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenantId,
        planId: planId,
        planType: planType || null,
        startDate: new Date(),
        isActive: true,
      },
      include: {
        plan: true,
      },
    });

    return subscription;
  },

  async getAll(tenantId) {
    return await prisma.subscription.findMany({
      where: tenantId ? { tenantId: tenantId } : {},
      include: {
        plan: true,
        tenant: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  },

  async update(id, data) {
    // Remove fields that shouldn't be updated
    const updateData = { ...data };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    return await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: true,
        tenant: true,
      },
    });
  },

  async delete(id) {
    return await prisma.subscription.delete({
      where: { id },
    });
  },

  async handleEvent(id, event) {
    const subscription = await prisma.subscription.findUnique({ 
      where: { id },
      include: { plan: true }
    });
    
    if (!subscription) throw new Error('Subscription not found');

    switch (event) {
      case 'activated':
        return await prisma.subscription.update({
          where: { id },
          data: { isActive: true },
          include: { plan: true }
        });

      case 'canceled':
        return await prisma.subscription.update({
          where: { id },
          data: { isActive: false },
          include: { plan: true }
        });

      case 'renewed':
        const newEnd = new Date(subscription.endDate || new Date());
        newEnd.setMonth(newEnd.getMonth() + 1);
        return await prisma.subscription.update({
          where: { id },
          data: { endDate: newEnd, isActive: true },
          include: { plan: true }
        });

      default:
        throw new Error('Invalid event type');
    }
  },

  async getSubscriptionById(id) {
    return await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        tenant: true,
      },
    });
  },

  async getSubscriptionsByTenant(tenantId) {
    return await prisma.subscription.findMany({
      where: { tenantId },
      include: {
        plan: true,
        tenant: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  },

  async getActiveSubscription(tenantId) {
    return await prisma.subscription.findFirst({
      where: { 
        tenantId,
        isActive: true 
      },
      include: {
        plan: true,
        tenant: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  },
};

module.exports = subscriptionService;
