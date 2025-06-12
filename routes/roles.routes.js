const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Manage roles for tenants
 */


/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles for a tenant
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Tenant ID to filter roles
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *       400:
 *         description: Missing tenantId
 *       500:
 *         description: Server error
 */
router.get('/', roleController.getRoles);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenant_id
 *               - name
 *               - permissions
 *             properties:
 *               tenant_id:
 *                 type: string
 *                 format: uuid
 *                 example: 2f53e62e-8ff8-4e0e-8c0e-f03dc8a2d8e2
 *               name:
 *                 type: string
 *                 example: manager
 *               description:
 *                 type: string
 *                 example: Manager role with permissions
 *               permissions:
 *                 type: object
 *                 example:
 *                   Orders:
 *                     - Add Order
 *                     - Update Order
 *                   Shades:
 *                     - Add Shade
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Server error
 */
router.post('/', roleController.createRole);

/**
 * @swagger
 * /roles:
 *   put:
 *     summary: Update an existing role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - permissions
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 example: 1af24cd0-faf4-4a58-9905-9ef90fc92bd1
 *               name:
 *                 type: string
 *                 example: manager
 *               description:
 *                 type: string
 *                 example: manager
 *               permissions:
 *                 type: object
 *                 example:
 *                   Orders:
 *                     - Add Order
 *                     - Update Order
 *                   Shades:
 *                     - Add Shade
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Server error
 */

router.put('/', roleController.updateRole);


/**
 * @swagger
 * /roles:
 *   delete:
 *     summary: Delete a role by ID
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the role to delete
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       400:
 *         description: Missing or invalid role ID
 *       500:
 *         description: Server error
 */
router.delete('/', roleController.deleteRole);


module.exports = router;
