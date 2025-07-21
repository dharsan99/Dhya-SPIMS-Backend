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

exports.downloadInvoice = async (req, res) => {
  try {
    const invoice_number = req.query.invoiceId || req.query.invoice_number;
    if (!invoice_number) return res.status(400).json({ error: 'invoice_number is required' });
    const { filename, buffer, mimetype } = await billingService.downloadInvoice(invoice_number);
    res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`);
    res.setHeader('Content-Type', mimetype);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendInvoiceEmail = async (req, res) => {
  try {
    const invoice_number = req.body.invoice_number || req.query.invoice_number;
    if (!invoice_number) return res.status(400).json({ error: 'invoice_number is required' });
    await billingService.sendInvoiceEmail(invoice_number);
    res.json({ success: true, message: 'Invoice email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendInvoiceBillEmail = async (req, res) => {
  try {
    const invoice_number = req.body.invoice_number || req.query.invoice_number;
    if (!invoice_number) return res.status(400).json({ error: 'invoice_number is required' });
    await billingService.sendInvoiceEmail(invoice_number);
    res.json({ success: true, message: 'Invoice email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecentPaymentActivity = async (req, res) => {
  try {
    const result = await billingService.getRecentPaymentActivity();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 