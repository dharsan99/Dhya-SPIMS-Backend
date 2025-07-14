const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const subscriptionService = require('../services/subscription.service');

exports.getSubscriptions = async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    const subscriptions = await subscriptionService.getAll(tenantId);

    const result = subscriptions.map(sub => ({
      id: sub.id,
      plan: sub.plan?.name || 'Unknown',
      renewalDate: sub.plan?.renewal_date?.toISOString().split('T')[0],
      amount: sub.plan?.price || 0,
      billingCycle: sub.plan?.billingCycle || 'unknown',
      created_at: sub.created_at ? sub.created_at.toISOString() : null,
      updated_at: sub.updated_at ? sub.updated_at.toISOString() : null
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || req.body.tenantId;
    const result = await subscriptionService.create(req.body, tenantId);

    res.status(201).json({
      tenantId,
      planId: result.plan.id,
      billingCycle: result.plan.billingCycle,
      amount: result.plan.price,
      renewalDate: result.plan.renewal_date.toISOString().split('T')[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.update(req.params.id, req.body);
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    await subscriptionService.delete(req.params.id);
    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.handleEvent = async (req, res) => {
  try {
    const updated = await subscriptionService.handleEvent(req.params.id, req.body.event);
    res.json({ message: `Subscription ${req.body.event}`, updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUsageStats = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Missing tenant ID' });

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
        tenant_id: tenantId,
        created_at: { gte: startOfMonth, lte: endOfMonth }
      }
    });
    // Users last month
    const usersLastMonth = await prisma.users.count({
      where: {
        tenant_id: tenantId,
        created_at: { gte: startOfLastMonth, lte: endOfLastMonth }
      }
    });
    // Total users
    const totalUsers = await prisma.users.count({ where: { tenant_id: tenantId } });

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
      usage: {
        orders: { count: ordersCount, trend: ordersTrend },
        apiCalls: { count: apiCallsCount, trend: apiCallsTrend },
        users: { count: totalUsers, trend: userTrend },
        storage: { used: storageUsed, trend: storageTrend }
      },
      period
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBillingHistory = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Missing tenant ID' });

    // Get all subscriptions for this tenant, most recent first
    const subscriptions = await prisma.subscriptions.findMany({
      where: { tenant_id: tenantId },
      include: { plan: true },
      orderBy: { start_date: 'desc' }
    });

    // Map to billing history format
    const billingHistory = subscriptions.map((sub, idx) => ({
      id: idx + 1,
      date: sub.start_date ? sub.start_date.toISOString().split('T')[0] : null,
      description: sub.plan?.description || 'Subscription',
      amount: sub.plan?.price || 0,
      status: sub.is_active ? 'paid' : 'unpaid',
      invoice: `INV-${sub.start_date ? sub.start_date.getFullYear() : '0000'}-${String(idx+1).padStart(3, '0')}`,
      paymentMethod: 'Visa ending in 4242' // stub value
    }));

    res.json(billingHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBillingHistoryByTenantId = async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Missing tenant ID' });

    // Get all subscriptions for this tenant, most recent first
    const subscriptions = await prisma.subscriptions.findMany({
      where: { tenant_id: tenantId },
      include: { plan: true },
      orderBy: { start_date: 'desc' }
    });

    // If all subscriptions are trial, return []
    const allTrial = subscriptions.length > 0 && subscriptions.every(sub => sub.plan?.billingCycle === 'trial');
    if (allTrial || subscriptions.length === 0) {
      return res.json([]);
    }

    // Only include subscriptions where billingCycle is not 'trial'
    const filtered = subscriptions.filter(sub => sub.plan?.billingCycle !== 'trial');

    // Map to billing history format
    const billingHistory = filtered.map((sub, idx) => ({
      id: idx + 1,
      date: sub.start_date ? sub.start_date.toISOString().split('T')[0] : null,
      description: sub.plan?.description || 'Subscription',
      amount: sub.plan?.price || 0,
      status: sub.is_active ? 'paid' : 'unpaid',
      invoice: 'AAA-001-2025', // stub value as requested
      paymentMethod: 'Visa ending in 4242' // stub value
    }));

    res.json(billingHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




