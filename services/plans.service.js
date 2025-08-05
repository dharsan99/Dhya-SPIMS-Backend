const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PlansService {
  async createPlan(data) {
    const { name, price, billingCycle, description, features, maxUsers, maxOrders, maxStorage, popular, isActive = true } = data;
    
    const createdAt = new Date();
    let expiryDate, renewalDate;
    
    if (billingCycle === 'trial') {
      expiryDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    } else if (billingCycle === 'month') {
      expiryDate = new Date(createdAt);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (billingCycle === 'year') {
      expiryDate = new Date(createdAt);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    if (expiryDate) {
      renewalDate = new Date(expiryDate);
      renewalDate.setDate(renewalDate.getDate() + 1);
    } else {
      renewalDate = createdAt;
    }
    
    return prisma.plan.create({ 
      data: { 
        name,
        price,
        billingCycle,
        description,
        features,
        maxUsers,
        maxOrders,
        maxStorage,
        popular,
        isActive,
        expiryDate,
        renewalDate,
        createdAt,
        updatedAt: createdAt
      } 
    });
  }

  async getAllPlans() {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
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
        isActive: plan.isActive,
        expiryDate: plan.expiryDate,
        renewalDate: plan.renewalDate,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }))
    };
  }

  async getPlanById(id) {
    return prisma.plan.findUnique({ 
      where: { id },
      include: {
        subscriptions: {
          include: {
            tenant: true
          }
        }
      }
    });
  }

  async updatePlan(id, data) {
    const { name, price, billingCycle, description, features, maxUsers, maxOrders, maxStorage, popular, isActive } = data;
    
    const updatedAt = new Date();
    let expiryDate, renewalDate;
    
    if (billingCycle === 'trial') {
      expiryDate = new Date(updatedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    } else if (billingCycle === 'month') {
      expiryDate = new Date(updatedAt);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (billingCycle === 'year') {
      expiryDate = new Date(updatedAt);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    if (expiryDate) {
      renewalDate = new Date(expiryDate);
      renewalDate.setDate(renewalDate.getDate() + 1);
    } else {
      renewalDate = updatedAt;
    }
    
    const updateData = {
      ...data,
      expiryDate,
      renewalDate,
      updatedAt
    };
    
    return prisma.plan.update({ 
      where: { id }, 
      data: updateData,
      include: {
        subscriptions: {
          include: {
            tenant: true
          }
        }
      }
    });
  }

  async deletePlan(id) {
    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        planId: id,
        isActive: true
      }
    });
    
    if (activeSubscriptions.length > 0) {
      throw new Error('Cannot delete plan with active subscriptions');
    }
    
    return prisma.plan.delete({ where: { id } });
  }

  async getPlanByBillingCycle(billingCycle) {
    return prisma.plan.findMany({
      where: { 
        billingCycle,
        isActive: true 
      },
      orderBy: { price: 'asc' }
    });
  }

  async getPopularPlans() {
    return prisma.plan.findMany({
      where: { 
        popular: true,
        isActive: true 
      },
      orderBy: { price: 'asc' }
    });
  }

  async getTrialPlan() {
    return prisma.plan.findFirst({
      where: { 
        billingCycle: 'trial',
        isActive: true 
      }
    });
  }
}

module.exports = new PlansService();
