const express = require('express');
const router = express.Router();
const {
  getAllTenants,
  getTenantById,      
  createTenant,
  updateTenant,
  deactivateTenant
} = require('../controllers/tenants.controller');
//const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
//router.use(verifyTokenAndTenant);
//const { requireRole } = require('../middlewares/role.middleware');


/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Multi-tenant management operations
 */

/**
 * @swagger
 * /tenants:
 *   get:
 *     summary: Get all tenants with their subscriptions and users
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: List of tenants with detailed information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   domain:
 *                     type: string
 *                   plan:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   address:
 *                     type: string
 *                   industry:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllTenants);

/**
 * @swagger
 * /tenants/{id}:
 *   get:
 *     summary: Get tenant by ID with detailed information
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant object with subscriptions, users, and settings
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getTenantById);

/**
 * @swagger
 * /tenants:
 *   post:
 *     summary: Create a new tenant with trial subscription
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - industry
 *             properties:
 *               name:
 *                 type: string
 *                 example: NSC Spinning Mills
 *                 description: Company name
 *               domain:
 *                 type: string
 *                 example: nscspinning.com
 *                 description: Company domain
 *               address:
 *                 type: string
 *                 example: 123 Main St, City, State
 *                 description: Company address
 *               industry:
 *                 type: string
 *                 example: Textiles
 *                 description: Industry type
 *               phone:
 *                 type: string
 *                 example: '+1-555-1234'
 *                 description: Contact phone number
 *               logo:
 *                 type: string
 *                 description: Base64 encoded logo data
 *     responses:
 *       201:
 *         description: Tenant created successfully with trial subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tenant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     domain:
 *                       type: string
 *                     plan:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     address:
 *                       type: string
 *                     industry:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     plan:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', createTenant);

/**
 * @swagger
 * /tenants/{id}:
 *   put:
 *     summary: Update tenant details
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: string
 *         description: Tenant ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               plan:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               address:
 *                 type: string
 *               industry:
 *                 type: string
 *               phone:
 *                 type: string
 *               logo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updateTenant);

/**
 * @swagger
 * /tenants/{id}:
 *   delete:
 *     summary: Deactivate tenant (soft delete)
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant deactivated successfully
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deactivateTenant);

module.exports = router;