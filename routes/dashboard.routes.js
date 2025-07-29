const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
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
router.get('/summary', dashboardController.getDashboardSummary);

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
 *             required: [name, domain, address, industry]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Example Company
 *               domain:
 *                 type: string
 *                 example: example.com
 *               address:
 *                 type: string
 *                 example: 123 Main St
 *               industry:
 *                 type: string
 *                 example: Textiles
 *               phone:
 *                 type: string
 *                 example: '+1-555-1234'
 *     responses:
 *       201:
 *         description: Tenant created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: successfully tenant is created!
 *                 id:
 *                   type: string
 *                   example: 123e4567-e89b-12d3-a456-426614174000
 *                 name:
 *                   type: string
 *                   example: Example Company
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: 123e4567-e89b-12d3-a456-426614174001 }
 *                     plan: { type: string, example: Starter (14-day trial) }
 *                     start_date: { type: string, example: 2024-06-01T00:00:00.000Z }
 *                     is_active: { type: boolean, example: true }
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Server error
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
 *                           isActive: { type: boolean }
 *                           createdAt: { type: string, format: date-time }
 *                           updatedAt: { type: string, format: date-time }
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
 * /dashboard/admin/tenants/subscriptions:
 *   get:
 *     summary: Admin - Get all tenant subscriptions (with search, filter, pagination, sorting)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search in tenant name
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, all] }
 *         description: Filter by subscription status
 *       - in: query
 *         name: plan
 *         schema: { type: string }
 *         description: Filter by plan name
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
 *         schema: { type: string, enum: [planName, createdAt, updatedAt] }
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of tenant subscriptions with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           tenantName: { type: string }
 *                           planName: { type: string }
 *                           description: { type: string }
 *                           price: { type: number }
 *                           billingCycle: { type: string }
 *                           maxUsers: { type: integer }
 *                           maxOrders: { type: integer }
 *                           maxStorage: { type: string }
 *                           status: { type: string, enum: [active, inactive] }
 *                           createdAt: { type: string, format: date-time }
 *                           updatedAt: { type: string, format: date-time }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage: { type: integer }
 *                         totalPages: { type: integer }
 *                         totalItems: { type: integer }
 *                         itemsPerPage: { type: integer }
 */
router.get('/admin/tenants/subscriptions', dashboardController.adminGetAllSubscriptions);

/**
 * @swagger
 * /dashboard/admin/tenants/subscriptions:
 *   post:
 *     summary: Admin - Create a new subscription, billing invoice, and payment for a tenant and plan
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID
 *               planId:
 *                 type: string
 *                 description: Plan ID
 *     responses:
 *       200:
 *         description: Subscription, invoice, and payment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptions: { type: array, items: { type: object } }
 *                     invoice: { type: object }
 *                     payment: { type: object }
 *                     pagination: { type: object }
 *                 message: { type: string }
 */
router.post('/admin/tenants/subscriptions', dashboardController.adminCreateSubscription);

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
 *                     isActive: { type: boolean }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
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
 *                           isActive: { type: boolean }
 *                           isVerified: { type: boolean }
 *                           createdAt: { type: string, format: date-time }
 *                           updatedAt: { type: string, format: date-time }
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
 *               status: { type: string, enum: [active, inactive, suspended], description: 'Set to inactive or suspended to deactivate tenant and all users' }
 *               companyDetails:
 *                 type: object
 *                 properties:
 *                   address: { type: string }
 *                   phone: { type: string }
 *                   industry: { type: string }
 *                   domain: { type: string }
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
 *                   type: object
 *                   properties:
 *                     isActive: { type: boolean, description: 'Current active status of the tenant' }
 *                     #/components/schemas/Tenant
 *                 message: { type: string, example: 'Tenant updated successfully. All users for this tenant have been deactivated and cannot login.' }
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

/**
 * @swagger
 * /dashboard/admin/verify-mail:
 *   get:
 *     summary: Verify admin email using token
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token from verification email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *                 role:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: 123e4567-e89b-12d3-a456-426614174002 }
 *                     tenantId: { type: string, example: 123e4567-e89b-12d3-a456-426614174000 }
 *                     name: { type: string, example: Admin }
 *                     description: { type: string, example: Default admin role for new tenant }
 *                     permissions: { type: object, example: {} }
 *       400:
 *         description: Invalid or missing token
 */
router.get('/admin/verify-mail', dashboardController.verifyMail);

/**
 * @swagger
 * /dashboard/admin/tenants/subscriptions/{id}:
 *   put:
 *     summary: Admin - Update a subscription status (active/inactive)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Set to 'active' or 'inactive'
 *     responses:
 *       200:
 *         description: Subscription updated
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
 *                     tenantName: { type: string }
 *                     planName: { type: string }
 *                     description: { type: string }
 *                     price: { type: number }
 *                     billingCycle: { type: string }
 *                     maxUsers: { type: integer }
 *                     maxOrders: { type: integer }
 *                     maxStorage: { type: string }
 *                     status: { type: string, enum: [active, inactive] }
 *                     createdAt: { type: string, format: date-time }
 *                     updatedAt: { type: string, format: date-time }
 *                 message: { type: string }
 *       400:
 *         description: Invalid request or business rule violation
 *       404:
 *         description: Subscription not found
 */
router.put('/admin/tenants/subscriptions/:id', dashboardController.adminUpdateSubscription);

/**
 * @swagger
 * /dashboard/admin/users:
 *   get:
 *     summary: Admin - Get all users (with search, filter, pagination)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: tenant_id
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional. Filter by tenant ID. If not provided, all users are returned.
 *       - in: query
 *         name: tenantname
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional. Filter by tenant name (case-insensitive, partial match).
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *         required: false
 *         description: Optional. Filter by user status (active, inactive, all).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Optional. Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Optional. Items per page for pagination.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional. Search by name or email.
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           tenantId: { type: string }
 *                           name: { type: string }
 *                           email: { type: string }
 *                           isActive: { type: boolean }
 *                           isVerified: { type: boolean }
 *                           role:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               name: { type: string }
 *                               permissions: { type: object }
 *                               tenantId: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage: { type: integer }
 *                         totalPages: { type: integer }
 *                         totalItems: { type: integer }
 *                         itemsPerPage: { type: integer }
 */
router.get('/admin/users', dashboardController.adminGetAllUsers);

/**
 * @swagger
 * /dashboard/admin/users/{id}:
 *   put:
 *     summary: Admin - Update a user
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               roleId: { type: string, description: 'Role UUID to assign to the user' }
 *               isActive: { type: boolean, description: 'Set to true or false to activate/deactivate user (optional)' }
 *               
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                     tenantId: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     isActive: { type: boolean }
 *                     isVerified: { type: boolean }
 *                     role:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *                         permissions: { type: object }
 *                         tenantId: { type: string }
 *                 message: { type: string }
 *       404:
 *         description: User not found
 */
router.put('/admin/users/:id', dashboardController.adminUpdateUser);

/**
 * @swagger
 * /dashboard/admin/invite-user:
 *   post:
 *     summary: Admin invites teammate via email
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - tenantId
 *               - roleId
 *             properties:
 *               email:
 *                 type: string
 *               tenantId:
 *                 type: string
 *               roleId:
 *                 type: string
 *               isSuperadmin:
 *                 type: boolean
 *                 description: Set true to send a Superadmin invite link
 *     responses:
 *       200:
 *         description: Invite sent
 *       400:
 *         description: Missing or invalid data
 */
router.post('/admin/invite-user', dashboardController.adminInviteUser);

/**
 * @swagger
 * /dashboard/admin/accept-invite:
 *   post:
 *     summary: Accept an invite and set password (admin)
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *               - token
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully from invite
 *       400:
 *         description: Invalid or expired token
 */
router.post('/admin/accept-invite', dashboardController.adminAcceptInvite);

/**
 * @swagger
 * /dashboard/admin/users/{id}:
 *   delete:
 *     summary: Admin - Deactivate (soft delete) a user
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User successfully deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 isActive: { type: boolean, example: false }
 *                 message: { type: string, example: 'This user successfully deactivated' }
 *       404:
 *         description: User not found
 */
router.delete('/admin/users/:id', dashboardController.adminDeleteUser);

module.exports = router;  