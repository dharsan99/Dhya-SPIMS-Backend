const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PlansService {
  async createPlan(data) {
    const createdAt = new Date();
    let expiry_date, renewal_date;
    if (data.billingCycle === 'trial') {
      expiry_date = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    } else if (data.billingCycle === 'month') {
      expiry_date = new Date(createdAt);
      expiry_date.setMonth(expiry_date.getMonth() + 1);
    } else if (data.billingCycle === 'year') {
      expiry_date = new Date(createdAt);
      expiry_date.setFullYear(expiry_date.getFullYear() + 1);
    }
    if (expiry_date) {
      renewal_date = new Date(expiry_date);
      renewal_date.setDate(renewal_date.getDate() + 1);
    } else {
      renewal_date = createdAt;
    }
    return prisma.plan.create({ data: { ...data, expiry_date, renewal_date } });
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
        popular: plan.popular,
        end_date: plan.end_date
      }))
    };
  }

  async getPlanById(id) {
    return prisma.plan.findUnique({ where: { id } });
  }

  async updatePlan(id, data) {
    const updatedAt = new Date();
    let expiry_date, renewal_date;
    if (data.billingCycle === 'trial') {
      expiry_date = new Date(updatedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    } else if (data.billingCycle === 'month') {
      expiry_date = new Date(updatedAt);
      expiry_date.setMonth(expiry_date.getMonth() + 1);
    } else if (data.billingCycle === 'year') {
      expiry_date = new Date(updatedAt);
      expiry_date.setFullYear(expiry_date.getFullYear() + 1);
    }
    if (expiry_date) {
      renewal_date = new Date(expiry_date);
      renewal_date.setDate(renewal_date.getDate() + 1);
    } else {
      renewal_date = updatedAt;
    }
    return prisma.plan.update({ where: { id }, data: { ...data, expiry_date, renewal_date } });
  }

  async deletePlan(id) {
    return prisma.plan.delete({ where: { id } });
  }
}

module.exports = new PlansService();
