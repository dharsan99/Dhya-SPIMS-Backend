const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PlansService {
  async createPlan(data) {
    return prisma.plan.create({ data });
  }

  async getAllPlans() {
    const plans = await prisma.plan.findMany({
      where: { is_active: true },
      orderBy: { price: 'asc' }
    });

    return {
      data: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        description: plan.description,
        features: plan.features,
        maxUsers: plan.maxUsers,
        maxOrders: plan.maxOrders,
        maxStorage: plan.maxStorage,
        popular: plan.popular
      }))
    };
  }

  async getPlanById(id) {
    return prisma.plan.findUnique({ where: { id } });
  }

  async updatePlan(id, data) {
    return prisma.plan.update({ where: { id }, data });
  }

  async deletePlan(id) {
    return prisma.plan.delete({ where: { id } });
  }
}

module.exports = new PlansService();
