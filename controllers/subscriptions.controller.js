const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const subscriptionService = require('../services/subscription.service');

exports.getSubscriptions = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenant ID' });
    }

    const subscriptions = await subscriptionService.getAll(tenantId);

    const result = subscriptions.map(sub => ({
      id: sub.id,
      tenantId: sub.tenantId,
      planId: sub.planId,
      plan: sub.plan?.name || 'Unknown',
      planType: sub.planType,
      startDate: sub.startDate ? sub.startDate.toISOString().split('T')[0] : null,
      endDate: sub.endDate ? sub.endDate.toISOString().split('T')[0] : null,
      renewalDate: sub.plan?.renewalDate ? sub.plan.renewalDate.toISOString().split('T')[0] : null,
      amount: sub.plan?.price || 0,
      billingCycle: sub.plan?.billingCycle || 'unknown',
      isActive: sub.isActive,
      createdAt: sub.createdAt ? sub.createdAt.toISOString() : null,
      updatedAt: sub.updatedAt ? sub.updatedAt.toISOString() : null
    }));

    res.status(200).json({
      message: 'Subscriptions retrieved successfully',
      subscriptions: result
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const { tenantId, planId, planType } = req.body;
    
    if (!tenantId || !planId) {
      return res.status(400).json({ 
        error: 'Missing required fields: tenantId, planId' 
      });
    }

    const result = await subscriptionService.create({
      tenantId,
      planId,
      planType
    }, tenantId);

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: {
        id: result.id,
        tenantId: result.tenantId,
        planId: result.planId,
        planType: result.planType,
        startDate: result.startDate,
        endDate: result.endDate,
        isActive: result.isActive,
        plan: {
          id: result.plan?.id,
          name: result.plan?.name,
          price: result.plan?.price,
          billingCycle: result.plan?.billingCycle,
          renewalDate: result.plan?.renewalDate
        }
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    const subscription = await subscriptionService.update(id, updateData);
    
    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    await subscriptionService.delete(id);
    
    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.handleEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { event } = req.body;
    
    if (!event) {
      return res.status(400).json({ error: 'Event type is required' });
    }
    
    const updated = await subscriptionService.handleEvent(id, event);
    
    res.json({ 
      message: `Subscription ${event} successfully`,
      subscription: updated
    });
  } catch (error) {
    console.error('Handle subscription event error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.getUsageStats = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenant ID' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Helper to get local ISO date string (yyyy-mm-dd)
    function toLocalISODate(date) {
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date - tzOffset).toISOString().split('T')[0];
    }

    // Last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Users this month
    const usersThisMonth = await prisma.users.count({
      where: {
        tenantId: tenantId,
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      }
    });
    
    // Users last month
    const usersLastMonth = await prisma.users.count({
      where: {
        tenantId: tenantId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
      }
    });
    
    // Total users
    const totalUsers = await prisma.users.count({ where: { tenantId: tenantId } });

    // User trend
    let userTrend = "0";
    if (usersThisMonth > usersLastMonth) {
      userTrend = `+${usersThisMonth - usersLastMonth} new`;
    } else if (usersThisMonth < usersLastMonth) {
      userTrend = `-${usersLastMonth - usersThisMonth}`;
    } else {
      userTrend = "0";
    }

    // Storage stub
    const storageUsed = "0 GB";
    const storageTrend = "0%";

    // Orders and API calls stub
    const ordersCount = 0;
    const ordersTrend = "0%";
    const apiCallsCount = 0;
    const apiCallsTrend = "0%";

    // Period (use local date, not UTC)
    const period = {
      start: toLocalISODate(startOfMonth),
      end: toLocalISODate(now)
    };

    res.json({
      message: 'Usage statistics retrieved successfully',
      usage: {
        orders: { count: ordersCount, trend: ordersTrend },
        apiCalls: { count: apiCallsCount, trend: apiCallsTrend },
        users: { count: totalUsers, trend: userTrend },
        storage: { used: storageUsed, trend: storageTrend }
      },
      period
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBillingHistory = async (req, res) => {
  try {
    console.log('🔍 [BILLING] Debug - req.user:', req.user);
    console.log('🔍 [BILLING] Debug - req.user?.tenantId:', req.user?.tenantId);
    
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      console.log('❌ [BILLING] Missing tenant ID in request');
      return res.status(400).json({ error: 'Missing tenant ID' });
    }

    console.log('✅ [BILLING] Using tenantId:', tenantId);

    // Get all subscriptions for this tenant, most recent first
    const subscriptions = await prisma.subscription.findMany({
      where: { tenantId: tenantId },
      include: { plan: true },
      orderBy: { startDate: 'desc' }
    });

    console.log('📊 [BILLING] Found subscriptions:', subscriptions.length);

    // Map to billing history format
    const billingHistory = subscriptions.map((sub, idx) => ({
      id: idx + 1,
      date: sub.startDate ? sub.startDate.toISOString().split('T')[0] : null,
      description: sub.plan?.description || 'Subscription',
      amount: sub.plan?.price || 0,
      status: sub.isActive ? 'paid' : 'unpaid',
      invoice: `INV-${sub.startDate ? sub.startDate.getFullYear() : '0000'}-${String(idx+1).padStart(3, '0')}`,
      paymentMethod: 'Visa ending in 4242' // stub value
    }));

    res.json({
      message: 'Billing history retrieved successfully',
      billingHistory
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBillingHistoryByTenantId = async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenant ID' });
    }

    // Get all subscriptions for this tenant, most recent first
    const subscriptions = await prisma.subscription.findMany({
      where: { tenantId: tenantId },
      include: { plan: true },
      orderBy: { startDate: 'desc' }
    });

    // If all subscriptions are trial, return []
    const allTrial = subscriptions.length > 0 && subscriptions.every(sub => sub.plan?.billingCycle === 'trial');
    if (allTrial || subscriptions.length === 0) {
      return res.json({
        message: 'No billing history found',
        billingHistory: []
      });
    }

    // Only include subscriptions where billingCycle is not 'trial'
    const filtered = subscriptions.filter(sub => sub.plan?.billingCycle !== 'trial');

    // Map to billing history format
    const billingHistory = filtered.map((sub, idx) => ({
      id: idx + 1,
      date: sub.startDate ? sub.startDate.toISOString().split('T')[0] : null,
      description: sub.plan?.description || 'Subscription',
      amount: sub.plan?.price || 0,
      status: sub.isActive ? 'paid' : 'unpaid',
      invoice: 'AAA-001-2025', // stub value as requested
      paymentMethod: 'Visa ending in 4242' // stub value
    }));

    res.json({
      message: 'Billing history retrieved successfully',
      billingHistory
    });
  } catch (error) {
    console.error('Get billing history by tenant error:', error);
    res.status(500).json({ error: error.message });
  }
};




