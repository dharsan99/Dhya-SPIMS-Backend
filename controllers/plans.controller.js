const plansService = require('../services/plans.service');

exports.createPlan = async (req, res) => {
  try {
    const { name, price, billingCycle, description, features, maxUsers, maxOrders, maxStorage, popular, isActive = true } = req.body;
    
    if (!name || price === undefined || !billingCycle) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, price, billingCycle' 
      });
    }

    const plan = await plansService.createPlan({
      name,
      price: parseFloat(price),
      billingCycle,
      description,
      features,
      maxUsers,
      maxOrders,
      maxStorage,
      popular: Boolean(popular),
      isActive
    });
    
    res.status(201).json({
      message: 'Plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
};

exports.getAllPlans = async (req, res) => {
  try {
    const plans = await plansService.getAllPlans();
    
    res.json({
      message: 'Plans retrieved successfully',
      ...plans
    });
  } catch (error) {
    console.error('Get all plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await plansService.getPlanById(id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({
      message: 'Plan retrieved successfully',
      plan
    });
  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({ error: 'Failed to get plan' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Convert price to float if provided
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }
    
    // Convert popular to boolean if provided
    if (updateData.popular !== undefined) {
      updateData.popular = Boolean(updateData.popular);
    }
    
    const plan = await plansService.updatePlan(id, updateData);
    
    res.json({
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await plansService.deletePlan(id);
    
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
};
