const billingService = require('../services/billing.service');

exports.getBillingStats = async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    const stats = await billingService.getBillingStats(tenantId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminGetInvoices = async (req, res) => {
  try {
    const result = await billingService.adminGetInvoices(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminCreateInvoice = async (req, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const result = await billingService.adminCreateInvoice(tenantId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { tenantId, search = '', status = 'all', plan, page = 1, limit = 20, sortBy = 'paidAt', sortOrder = 'desc' } = req.query;
    const result = await billingService.getPayments({ tenantId, search, status, plan, page, limit, sortBy, sortOrder });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const paymentId = req.query.paymentId || req.params.paymentId;
    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });
    const result = await billingService.getPayment(paymentId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.postPayment = async (req, res) => {
  try {
    const { billingId, tenantId, amount, method, status, txnId } = req.body;
    if (!billingId || !tenantId || !amount || !method || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await billingService.postPayment({ billingId, tenantId, amount, method, status, txnId });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRevenueTrends = async (req, res) => {
  try {
    const { tenantId } = req.query;
    const result = await billingService.getRevenueTrends(tenantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 