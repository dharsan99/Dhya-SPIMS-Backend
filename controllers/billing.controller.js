const billingService = require('../services/billing.service');

// Get billing statistics
const getBillingStats = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const stats = await billingService.getBillingStats(tenantId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting billing stats:', error);
    res.status(500).json({ error: 'Failed to get billing statistics' });
  }
};

// Admin: Get all invoices with pagination and filtering
const adminGetInvoices = async (req, res) => {
  try {
    const { search, status, plan, page, limit, sortBy, sortOrder } = req.query;
    const result = await billingService.adminGetInvoices({
      search,
      status,
      plan,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    });
    res.json(result);
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
};

// Send invoice email
const sendInvoiceEmail = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    await billingService.sendInvoiceEmail(invoiceNumber);
    res.json({ message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ error: 'Failed to send invoice email' });
  }
};

// Send invoice bill email (alias)
const sendInvoiceBillEmail = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    await billingService.sendInvoiceBillEmail(invoiceNumber);
    res.json({ message: 'Invoice bill email sent successfully' });
  } catch (error) {
    console.error('Error sending invoice bill email:', error);
    res.status(500).json({ error: 'Failed to send invoice bill email' });
  }
};

// Get payments with pagination and filtering
const getPayments = async (req, res) => {
  try {
    const { search, status, plan, page, limit, sortBy, sortOrder } = req.query;
    const { tenantId } = req.user;
    const result = await billingService.getPayments({
      search,
      status,
      plan,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy: sortBy || 'paidAt',
      sortOrder: sortOrder || 'desc',
      tenantId
    });
    res.json(result);
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
};

// Get single payment by ID
const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await billingService.getPayment(paymentId);
    res.json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ error: 'Failed to get payment' });
  }
};

// Create new payment
const postPayment = async (req, res) => {
  try {
    const { billingId, tenantId, amount, method, status, txnId } = req.body;
    const payment = await billingService.postPayment({
      billingId,
      tenantId,
      amount,
      method,
      status,
      txnId
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

// Get revenue trends
const getRevenueTrends = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const trends = await billingService.getRevenueTrends(tenantId);
    res.json(trends);
  } catch (error) {
    console.error('Error getting revenue trends:', error);
    res.status(500).json({ error: 'Failed to get revenue trends' });
  }
};

// Download invoice as PDF
const downloadInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const result = await billingService.downloadInvoice(invoiceNumber);
    
    res.setHeader('Content-Type', result.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
};

// Admin: Create new invoice
const adminCreateInvoice = async (req, res) => {
  try {
    const { tenantId } = req.body;
    const invoice = await billingService.adminCreateInvoice(tenantId);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// Get recent payment activity
const getRecentPaymentActivity = async (req, res) => {
  try {
    const activity = await billingService.getRecentPaymentActivity();
    res.json(activity);
  } catch (error) {
    console.error('Error getting recent payment activity:', error);
    res.status(500).json({ error: 'Failed to get recent payment activity' });
  }
};

module.exports = {
  getBillingStats,
  adminGetInvoices,
  sendInvoiceEmail,
  sendInvoiceBillEmail,
  getPayments,
  getPayment,
  postPayment,
  getRevenueTrends,
  downloadInvoice,
  adminCreateInvoice,
  getRecentPaymentActivity
}; 