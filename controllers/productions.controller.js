const productionsService = require('../services/productions.service');

exports.getAllProductions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await productionsService.getAllProductions({ page, limit });
    res.json(result);
  } catch (error) {
    console.error('Error fetching productions:', error);
    res.status(500).json({ error: 'Failed to fetch productions' });
  }
};

exports.getProductionById = async (req, res) => {
  try {
    const { id } = req.params;
    const production = await productionsService.getProductionById(id);
    
    if (!production) {
      return res.status(404).json({ error: 'Production not found' });
    }
    
    res.json(production);
  } catch (error) {
    console.error('Error fetching production:', error);
    res.status(500).json({ error: 'Failed to fetch production' });
  }
};

exports.createProduction = async (req, res) => {
  try {
    const production = await productionsService.createProduction(req.body);
    res.status(201).json(production);
  } catch (error) {
    console.error('Error creating production:', error);
    res.status(400).json({ error: error.message || 'Failed to create production' });
  }
};

exports.updateProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await productionsService.updateProduction(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Production not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating production:', error);
    res.status(400).json({ error: error.message || 'Failed to update production' });
  }
};

exports.deleteProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await productionsService.deleteProduction(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Production not found' });
    }
    
    res.json({ message: 'Production deleted successfully' });
  } catch (error) {
    console.error('Error deleting production:', error);
    res.status(500).json({ error: 'Failed to delete production' });
  }
}; 