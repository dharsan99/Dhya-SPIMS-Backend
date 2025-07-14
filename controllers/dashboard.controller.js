const dashboardService = require('../services/dashboard.service');
const purchaseOrdersService = require('../services/purchaseOrders.service');
const productionsService = require('../services/productions.service');
const fibreTransfersService = require('../services/fibreTransfers.service');
const tenantService = require('../services/tenant.service');

/**
 * Get comprehensive dashboard summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.user);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

/**
 * Get admin dashboard summary with system-wide statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAdminSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getAdminDashboardSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching admin dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard summary' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    // Get counts from various services
    const [purchaseOrders, productions, fibreTransfers] = await Promise.all([
      purchaseOrdersService.getAllPurchaseOrders({ page: 1, limit: 1 }),
      productionsService.getAllProductions({ page: 1, limit: 1 }),
      fibreTransfersService.getPendingTransfers()
    ]);

    // Get recent activities (last 5 activities)
    const recentActivities = await getRecentActivities();

    res.json({
      totalPurchaseOrders: purchaseOrders.pagination.total,
      totalProductionOrders: productions.pagination.total,
      pendingFibreTransfers: fibreTransfers.length,
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

async function getRecentActivities() {
  // This is a placeholder - implement actual activity tracking
  return [
    {
      type: 'PURCHASE_ORDER',
      action: 'CREATED',
      timestamp: new Date().toISOString(),
      details: 'New purchase order created'
    },
    {
      type: 'PRODUCTION',
      action: 'STARTED',
      timestamp: new Date().toISOString(),
      details: 'Production started'
    },
    {
      type: 'FIBRE_TRANSFER',
      action: 'REQUESTED',
      timestamp: new Date().toISOString(),
      details: 'New fibre transfer requested'
    }
  ];
}

// Admin: Create Tenant
const adminCreateTenant = async (req, res) => {
  try {
    const { name, domain, address, industry, phone } = req.body;
    if (!name || !address || !industry) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const result = await dashboardService.adminCreateTenant({ name, domain, address, industry, phone });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// New: verifyMail
const verifyMail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Missing token' });
    const result = await dashboardService.verifyAdminMail(token);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Get Single Tenant
const adminGetTenantById = async (req, res) => {
  try {
    const details = await dashboardService.adminGetTenantById(req.params.id);
    if (!details) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({
      success: true,
      data: details,
      message: 'Tenant details fetched successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Tenant
const adminUpdateTenant = async (req, res) => {
  try {
    const updated = await dashboardService.adminUpdateTenant(req.params.id, req.body);
    res.json({
      success: true,
      data: updated,
      message: 'Tenant updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get All Tenants
const adminGetAllTenants = async (req, res) => {
  try {
    const {
      search = '',
      status = 'all',
      plan,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;
    const result = await dashboardService.adminGetAllTenants({ search, status, plan, page, limit, sortBy, sortOrder });
    res.json({
      success: true,
      data: result,
      message: 'Tenants fetched successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete Tenant
const adminDeleteTenant = async (req, res) => {
  try {
    await dashboardService.adminDeleteTenant(req.params.id);
    res.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardSummary: exports.getDashboardSummary,
  getAdminSummary: exports.getAdminSummary,
  getSummary: exports.getSummary,
  adminCreateTenant,
  adminGetTenantById,
  adminUpdateTenant,
  adminGetAllTenants,
  adminDeleteTenant,
  verifyMail,
}; 