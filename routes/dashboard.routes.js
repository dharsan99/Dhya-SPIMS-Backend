const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware'); 
// Apply authentication middleware to all routes
router.use(verifyTokenAndTenant);

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

/**
 * @swagger
 * /dashboard/admin:
 *   get:
 *     summary: Get admin dashboard summary with system-wide statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Admin dashboard summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_tenants:
 *                   type: number
 *                   description: Total number of active tenants
 *                 total_users:
 *                   type: number
 *                   description: Total number of active users
 *                 revenue:
 *                   type: number
 *                   description: Total revenue (default 0)
 *                 orders:
 *                   type: number
 *                   description: Total orders (default 0)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/admin', dashboardController.getAdminSummary);

module.exports = router;  