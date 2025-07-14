const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

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
 *                 dashboard_stats:
 *                   type: array
 *                   description: List of dashboard statistics
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: Unique identifier for the stat
 *                       key:
 *                         type: string
 *                         description: Key for the stat (e.g., total_tenants)
 *                       title:
 *                         type: string
 *                         description: Human-readable title
 *                       value:
 *                         type: number
 *                         description: Current value
 *                       change:
 *                         type: number
 *                         description: Change from previous month
 *                       change_type:
 *                         type: string
 *                         enum: [positive, negative]
 *                         description: Indicates if the change is positive or negative
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get('/admin', dashboardController.getAdminSummary);

/**
 * @swagger
 * /dashboard/admin/createTenant:
 *   post:
 *     summary: Admin - Create a new tenant
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [name, adminUser]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Example Company
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 example: active
 *               plan:
 *                 type: string
 *                 enum: [basic, premium, enterprise]
 *                 example: basic
 *               adminUser:
 *                 type: object
 *                 required: [firstName, lastName, email, password]
 *                 properties:
 *                   firstName: { type: string, example: John }
 *                   lastName: { type: string, example: Doe }
 *                   email: { type: string, example: admin@example.com }
 *                   password: { type: string, example: secret123 }
 *               companyDetails:
 *                 type: object
 *                 properties:
 *                   address: { type: string, example: 123 Main St }
 *                   phone: { type: string, example: '+1-555-1234' }
 *                   industry: { type: string, example: 'Textiles' }
 *     responses:
 *       201:
 *         description: Tenant and admin user created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *                         plan: { type: string }
 *                         is_active: { type: boolean }
 *                     adminUser:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *                         email: { type: string }
 *                 message: { type: string }
 */
router.post('/admin/createTenant', dashboardController.adminCreateTenant);

/**
 * @swagger
 * /dashboard/admin/tenants:
 *   get:
 *     summary: Admin - Get all tenants (with search, filter, pagination, sorting)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in name
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, suspended, all] }
 *         description: Filter by status
 *       - in: query
 *         name: plan
 *         schema: { type: string }
 *         description: Filter by plan
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, createdAt, lastActive, users] }
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of tenants with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           domain: { type: string }
 *                           plan: { type: string }
 *                           is_active: { type: boolean }
 *                           created_at: { type: string, format: date-time }
 *                           updated_at: { type: string, format: date-time }
 *                           userCount: { type: integer }
 *                           lastActive: { type: string, format: date-time, nullable: true }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage: { type: integer }
 *                         totalPages: { type: integer }
 *                         totalItems: { type: integer }
 *                         itemsPerPage: { type: integer }
 *                 message: { type: string }
 */
router.get('/admin/tenants', dashboardController.adminGetAllTenants);

/**
 * @swagger
 * /dashboard/admin/tenants/{id}:
 *   get:
 *     summary: Admin - Get tenant by ID (detailed)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     domain: { type: string }
 *                     plan: { type: string }
 *                     is_active: { type: boolean }
 *                     created_at: { type: string, format: date-time }
 *                     updated_at: { type: string, format: date-time }
 *                     companyDetails:
 *                       type: object
 *                       properties:
 *                         address: { type: string }
 *                         phone: { type: string }
 *                         industry: { type: string }
 *                         website: { type: string }
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         plan: { type: string }
 *                         startDate: { type: string, format: date-time }
 *                         endDate: { type: string, format: date-time }
 *                         status: { type: string }
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           email: { type: string }
 *                           is_active: { type: boolean }
 *                           is_verified: { type: boolean }
 *                           created_at: { type: string, format: date-time }
 *                           updated_at: { type: string, format: date-time }
 *                           role: { type: string }
 *                     usage:
 *                       type: object
 *                       properties:
 *                         totalUsers: { type: integer }
 *                         activeUsers: { type: integer }
 *                         storageUsed: { type: number }
 *                         storageLimit: { type: number }
 *                 message: { type: string }
 */
router.get('/admin/tenants/:id', dashboardController.adminGetTenantById);

/**
 * @swagger
 * /dashboard/admin/tenants/{id}:
 *   put:
 *     summary: Admin - Update tenant details
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               name: { type: string }
 *               status: { type: string, enum: [active, inactive, suspended] }
 *               plan: { type: string, enum: [basic, premium, enterprise] }
 *               companyDetails:
 *                 type: object
 *                 properties:
 *                   address: { type: string }
 *                   phone: { type: string }
 *                   industry: { type: string }
 *                   website: { type: string }
 *     responses:
 *       200:
 *         description: Tenant updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *                 message: { type: string }
 */
router.put('/admin/tenants/:id', dashboardController.adminUpdateTenant);

/**
 * @swagger
 * /dashboard/admin/tenants/{id}:
 *   delete:
 *     summary: Admin - Delete tenant
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 */
router.delete('/admin/tenants/:id', dashboardController.adminDeleteTenant);

module.exports = router;  