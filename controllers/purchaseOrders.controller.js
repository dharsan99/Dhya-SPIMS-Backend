const purchaseOrdersService = require('../services/purchaseOrders.service');

exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await purchaseOrdersService.getAllPurchaseOrders({ page, limit });
    res.json(result);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
};

exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await purchaseOrdersService.getPurchaseOrderById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await purchaseOrdersService.createPurchaseOrder(req.body);
    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(400).json({ error: error.message || 'Failed to create purchase order' });
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await purchaseOrdersService.updatePurchaseOrder(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(400).json({ error: error.message || 'Failed to update purchase order' });
  }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await purchaseOrdersService.deletePurchaseOrder(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
};

exports.verify = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await purchaseOrdersService.verify(id, req.user);
    res.json(result);
  } catch (err) {
    console.error('PO Verification Error:', err);
    res.status(400).json({ 
      error: err.message,
      details: err.stack,
      code: err.code || 'VERIFICATION_ERROR'
    });
  }
};

exports.convert = async (req, res) => {
  const { id } = req.params;
  try {
    const salesOrder = await purchaseOrdersService.convertToSalesOrder(id, req.user, req.body);
    res.status(201).json(salesOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.parseAndCreatePurchaseOrder = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await purchaseOrdersService.parseAndCreatePurchaseOrder(req.file);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error parsing and creating purchase order:', error);
    res.status(400).json({ error: error.message || 'Failed to process purchase order' });
  }
};