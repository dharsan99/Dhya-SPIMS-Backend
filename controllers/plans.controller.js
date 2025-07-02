const plansService = require('../services/plans.service');

exports.createPlan = async (req, res) => {
  try {
    const plan = await plansService.createPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPlans = async (req, res) => {
  try {
    const plans = await plansService.getAllPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const plan = await plansService.getPlanById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await plansService.updatePlan(req.params.id, req.body);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    await plansService.deletePlan(req.params.id);
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
