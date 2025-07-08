const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const subscriptionService = require('../services/subscription.service');

exports.getSubscriptions = async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    const subscriptions = await subscriptionService.getAll(tenantId);

    const result = subscriptions.map(sub => ({
      plan: sub.plan?.name || 'Unknown',
      renewalDate: sub.plan?.renewal_date?.toISOString().split('T')[0],
      amount: sub.plan?.price || 0,
      billingCycle: sub.plan?.billingCycle || 'unknown',
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




