const dashboardService = require('../services/dashboard.service');
const purchaseOrdersService = require('../services/purchaseOrders.service');
const productionsService = require('../services/productions.service');
const fibreTransfersService = require('../services/fibreTransfers.service');

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