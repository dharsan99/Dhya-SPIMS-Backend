const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subscriptionService = {
  async create(data, tenantId) {
    return await prisma.subscriptions.create({
      data: {
        tenant_id: tenantId,
        plan_type: data.plan_type,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        is_active: true,
      },
    });
  },

  async getAll(tenantId) {
    return await prisma.subscriptions.findMany({
      where: { tenant_id: tenantId },
    });
  },

  async update(id, data) {
    return await prisma.subscriptions.update({
      where: { id },
      data,
    });
  },
  

  async delete(id) {
    return await prisma.subscriptions.delete({
      where: { id },
    });
  },

  async handleEvent(id, event) {
    const subscription = await prisma.subscriptions.findUnique({ where: { id } });
    if (!subscription) throw new Error('Subscription not found');

    switch (event) {
      case 'activated':
        return await prisma.subscriptions.update({ where: { id }, data: { is_active: true } });

      case 'canceled':
        return await prisma.subscriptions.update({ where: { id }, data: { is_active: false } });

      case 'renewed':
        const newEnd = new Date(subscription.end_date || new Date());
        newEnd.setMonth(newEnd.getMonth() + 1);
        return await prisma.subscriptions.update({
          where: { id },
          data: { end_date: newEnd, is_active: true },
        });

      default:
        throw new Error('Invalid event type');
    }
  },
};

module.exports = subscriptionService;
