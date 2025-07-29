const dashboardService = require('../services/dashboard.service');
const purchaseOrdersService = require('../services/purchaseOrders.service');
const productionService = require('../services/production.service');
const fibreTransfersService = require('../services/fibreTransfers.service');
const tenantService = require('../services/tenant.service');
const { validate: isUuid } = require('uuid');

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
      purchaseOrdersService.getAll(req.user, { page: 1, limit: 1 }),
      productionService.getAllProductions(req.user.tenantId),
      fibreTransfersService.getPendingTransfers()
    ]);

    // Get recent activities (last 5 activities)
    const recentActivities = await getRecentActivities();

    res.json({
      totalPurchaseOrders: purchaseOrders.pagination?.total || 0,
      totalProductionOrders: productions?.length || 0,
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
    const id = req.params.id;
    if (!isUuid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant ID. Must be a valid UUID.' });
    }
    const details = await dashboardService.adminGetTenantById(id);
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
    let message = 'Tenant updated successfully';
    if (req.body.status === 'inactive' || req.body.status === 'suspended' || updated.isActive === false) {
      message += '. All users for this tenant have been deactivated and cannot login.';
    }
    res.json({
      success: true,
      data: updated,
      message,
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

const adminGetAllSubscriptions = async (req, res) => {
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
    const result = await dashboardService.adminGetAllSubscriptions({ search, status, plan, page, limit, sortBy, sortOrder });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminCreateSubscription = async (req, res) => {
  try {
    const { tenantId, planId } = req.body;
    if (!tenantId || !planId) {
      return res.status(400).json({ success: false, message: 'tenantId and planId are required' });
    }
    const result = await dashboardService.adminCreateSubscription({ tenantId, planId });
    res.json({
      success: true,
      data: result,
      message: 'Subscription, invoice, and payment created successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminUpdateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: 'subscription id and status are required' });
    }
    const updated = await dashboardService.adminUpdateSubscription(id, { status });
    res.json({ success: true, data: updated, message: 'Subscription updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const adminGetAllUsers = async (req, res) => {
  try {
    const { tenant_id, tenantname, status, page = 1, limit = 10, search = '' } = req.query;
    const result = await dashboardService.adminGetAllUsers({ tenant_id, tenantname, status, page, limit, search });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Remove isVerified if present in req.body
    const { isVerified, ...updateData } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User id is required' });
    }
    const result = await dashboardService.adminUpdateUser(id, updateData);
    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: result, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminInviteUser = async (req, res) => {
  try {
    const { email, tenant_id, role_id, isSuperadmin } = req.body;
    if (!email || !tenant_id || !role_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const result = await dashboardService.adminInviteUser({ email, tenant_id, role_id, isSuperadmin });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminAcceptInvite = async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token || !name || !password) {
      return res.status(400).json({ success: false, message: 'Missing fields: token, name, password' });
    }
    const user = await dashboardService.adminAcceptInvite({ token, name, password });
    res.status(201).json({ success: true, message: 'Account created and role assigned', user_id: user.id });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User id is required' });
    }
    const result = await dashboardService.adminDeleteUser(id);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
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
  adminGetAllSubscriptions,
  adminCreateSubscription,
  adminUpdateSubscription,
  adminGetAllUsers,
  adminUpdateUser,
  adminInviteUser,
  adminAcceptInvite,
  adminDeleteUser,
}; 