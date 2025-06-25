const express = require('express');
const router = express.Router();
const { requireRole } = require('../middlewares/role.middleware');
const dashboardController = require('../controllers/dashboard.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware'); 
// Apply authentication middleware to all routes
router.use(verifyTokenAndTenant);
router.use(requireRole('admin', 'hr', 'manager'));

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard management APIs
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPurchaseOrders:
 *                   type: number
 *                 totalProductionOrders:
 *                   type: number
 *                 pendingFibreTransfers:
 *                   type: number
 *                 recentActivities:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/summary', dashboardController.getSummary);

module.exports = router; 