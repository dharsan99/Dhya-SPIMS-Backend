const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const subscriptionService = require('../services/subscription.service');


  exports.getSubscriptions = async (req, res) => {
    try {
      const subscriptions = await subscriptionService.getAll(req.user.tenantId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };



  // Create a new subscription
  exports. createSubscription=async (req, res)=> {
    try {
      const subscription = await prisma.subscriptions.create({
        data: {
          tenant_id: req.user.tenant_id,
          plan_type: req.body.plan_type,
          start_date: new Date(req.body.start_date),
          end_date: new Date(req.body.end_date),
          is_active: true
        }
      });
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Update a subscription
  exports. updateSubscription=async (req, res) => {
    try {
      const subscription = await prisma.subscriptions.update({
        where: { id: req.params.id },
        data: {
          plan_type: req.body.plan_type,
          start_date: new Date(req.body.start_date),
          end_date: new Date(req.body.end_date),
          is_active: req.body.is_active
        }
      });
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Delete a subscription
  exports. deleteSubscription=async(req, res) => {
    try {
      await prisma.subscriptions.delete({
        where: { id: req.params.id }
      });
      res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  exports. handleEvent=async (req, res)=> {
    try {
      const updated = await subscriptionService.handleEvent(req.params.id, req.body.event);
      res.json({ message: `Subscription ${req.body.event}`, updated });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };



