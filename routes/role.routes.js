const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { 
  createRole, 
  getRolesByTenant, 
  getRoleById, 
  updateRole, 
  deleteRole, 
  checkPermission 
} = require('../controllers/role.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// Validation middleware
const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  body('permissions')
    .isObject()
    .withMessage('Permissions must be an object')
    .notEmpty()
    .withMessage('Permissions cannot be empty'),
  body('tenant_id')
    .optional()
    .isUUID()
    .withMessage('Tenant ID must be a valid UUID'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters')
];

const updateRoleValidation = [
  param('id')
    .isUUID()
    .withMessage('Role ID must be a valid UUID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Role name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters')
];

const roleIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Role ID must be a valid UUID')
];

const permissionCheckValidation = [
  query('module')
    .notEmpty()
    .withMessage('Module is required'),
  query('action')
    .notEmpty()
    .withMessage('Action is required')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - name
 *         - permissions
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the role
 *         name:
 *           type: string
 *           description: Role name
 *           example: "Manager"
 *         description:
 *           type: string
 *           description: Role description
 *           example: "Manager role with order management permissions"
 *         permissions:
 *           type: object
 *           description: Permissions object with modules and actions
 *           example:
 *             Orders: ["Add Order", "Update Order", "Delete Order"]
 *             Shades: ["Add Shade", "Delete Shade"]
 *         tenant_id:
 *           type: string
 *           format: uuid
 *           description: Tenant identifier
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateRoleRequest:
 *       type: object
 *       required:
 *         - name
 *         - permissions
 *       properties:
 *         name:
 *           type: string
 *           description: Role name
 *           example: "Manager"
 *         description:
 *           type: string
 *           description: Role description
 *           example: "Manager role with order management permissions"
 *         permissions:
 *           type: object
 *           description: Permissions object with modules and actions
 *           example:
 *             Orders: ["Add Order", "Update Order", "Delete Order"]
 *             Shades: ["Add Shade", "Delete Shade"]
 *         tenant_id:
 *           type: string
 *           format: uuid
 *           description: Tenant identifier (optional, will use user's tenant if not provided)
 *     UpdateRoleRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Role name
 *         description:
 *           type: string
 *           description: Role description
 *         permissions:
 *           type: object
 *           description: Permissions object with modules and actions
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles for the authenticated user's tenant
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', verifyToken, getRolesByTenant);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       201:
 *         description: Role created successfully
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
 *         description: Bad request - validation error
 *       409:
 *         description: Role name already exists for this tenant
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, requireRole('admin', 'super_admin'), createRoleValidation, createRole);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Get a specific role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, roleIdValidation, getRoleById);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
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
 *         description: Bad request - validation error
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role name already exists for this tenant
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.put('/:id', verifyToken, requireRole('admin', 'super_admin'), updateRoleValidation, updateRole);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Role not found
 *       409:
 *         description: Cannot delete role - it is being used by users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, requireRole('admin', 'super_admin'), roleIdValidation, deleteRole);

/**
 * @swagger
 * /roles/check-permission:
 *   get:
 *     summary: Check if the authenticated user has a specific permission
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *         description: Module name (e.g., Orders, Shades)
 *         example: "Orders"
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *         description: Action name (e.g., Add Order, Delete Shade)
 *         example: "Add Order"
 *     responses:
 *       200:
 *         description: Permission check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasPermission:
 *                   type: boolean
 *                 module:
 *                   type: string
 *                 action:
 *                   type: string
 *       400:
 *         description: Bad request - module and action are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/check-permission', verifyToken, permissionCheckValidation, checkPermission);

module.exports = router;