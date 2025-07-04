const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const subscriptionService = require('../services/subscription.service');

exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await subscriptionService.getAll(req.user.tenant_id);
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.create(req.body, req.user.tenant_id);
    res.status(201).json(subscription);
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




