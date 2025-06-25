const express = require('express');
const router = express.Router();
const {
  getAllTenants,
  getTenantById,      
  createTenant,
  updateTenant,
  deactivateTenant
} = require('../controllers/tenants.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
router.use(verifyTokenAndTenant);
const { requireRole } = require('../middlewares/role.middleware');


/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Multi-tenant management
 */

/**
 * @swagger
 * /tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenants
 */
router.get('/',  requireRole('admin'), getAllTenants);

/**
 * @swagger
 * /tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant object
 */
router.get('/:id', requireRole('admin'), getTenantById);

/**
 * @swagger
 * /tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [name, domain]
 *             properties:
 *               name:
 *                 type: string
 *                 example: NSC Spinning Mills
 *               domain:
 *                 type: string
 *                 example: nscspinning.com
 *     responses:
 *       201:
 *         description: Tenant created
 */
router.post('/',  requireRole('admin'), createTenant);

/**
 * @swagger
 * /tenants/{id}:
 *   put:
 *     summary: Update tenant details
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
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
 *               domain: { type: string }
 *               plan: { type: string }
 *     responses:
 *       200:
 *         description: Tenant updated
 */
router.put('/:id', requireRole('admin'), updateTenant);

/**
 * @swagger
 * /tenants/{id}:
 *   delete:
 *     summary: Deactivate tenant (soft delete)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant deactivated
 */
router.delete('/:id', requireRole('admin'), deactivateTenant);

module.exports = router;