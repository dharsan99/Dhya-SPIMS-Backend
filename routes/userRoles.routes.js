const express = require('express');
const router = express.Router();
const { 
  createRole, 
  getRoleById,
  getAllRoles,
  updateRole,
  deleteRole,
  assignRoleToUser,
  getUsersWithRolesByTenant,
  getRolesByTenant
} = require('../controllers/userRoles.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');

router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   name: User Roles
 *   description: Manage role definitions and assignments for a tenant
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RoleInput:
 *       type: object
 *       required:
 *         - name
 *         - tenantId
 *       properties:
 *         name:
 *           type: string
 *           example: Admin
 *           description: Role name
 *         description:
 *           type: string
 *           example: Administrator role with full access
 *           description: Role description
 *         permissions:
 *           type: object
 *           example:
 *             Orders: ["Add Order", "Update Order", "Delete Order", "View Order"]
 *             Users: ["Add User", "Update User", "Delete User", "View User"]
 *           description: Role permissions as JSON object
 *         tenantId:
 *           type: string
 *           format: uuid
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *           description: Tenant ID for the role
 *     RoleOutput:
 *       allOf:
 *         - $ref: '#/components/schemas/RoleInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: 123e4567-e89b-12d3-a456-426614174000
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Role creation date
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Role last update date
 *             userRoles:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 */

/**
 * @swagger
 * /user-roles:
 *   post:
 *     summary: Create a new role
 *     tags: [User Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
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
 *                 role:
 *                   $ref: '#/components/schemas/RoleOutput'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', createRole);

/**
 * @swagger
 * /user-roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [User Roles]
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
 *                 role:
 *                   $ref: '#/components/schemas/RoleOutput'
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getRoleById);

/**
 * @swagger
 * /user-roles:
 *   get:
 *     summary: Get all roles for a tenant with pagination
 *     tags: [User Roles]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tenant ID to filter roles
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for role name or description
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                     $ref: '#/components/schemas/RoleOutput'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Missing tenantId
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllRoles);

/**
 * @swagger
 * /user-roles/{id}:
 *   put:
 *     summary: Update role by ID
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *               description:
 *                 type: string
 *                 description: Role description
 *               permissions:
 *                 type: object
 *                 description: Role permissions as JSON object
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
 *                 role:
 *                   $ref: '#/components/schemas/RoleOutput'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updateRole);

/**
 * @swagger
 * /user-roles/{id}:
 *   delete:
 *     summary: Delete role by ID
 *     tags: [User Roles]
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
 *                 role:
 *                   $ref: '#/components/schemas/RoleOutput'
 *       400:
 *         description: Cannot delete role with assigned users
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteRole);

/**
 * @swagger
 * /user-roles/assign:
 *   post:
 *     summary: Assign role to user
 *     tags: [User Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *                 description: User ID
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *                 description: Role ID
 *     responses:
 *       200:
 *         description: Role assigned to user successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userRole:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     roleId:
 *                       type: string
 *                       format: uuid
 *                     role:
 *                       $ref: '#/components/schemas/RoleOutput'
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/assign', assignRoleToUser);

/**
 * @swagger
 * /user-roles/users-by-tenant:
 *   get:
 *     summary: Get users with their roles by tenant
 *     tags: [User Roles]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tenant ID to get users for
 *     responses:
 *       200:
 *         description: Users with roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       role:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           permissions:
 *                             type: object
 *                           tenantId:
 *                             type: string
 *                             format: uuid
 *       400:
 *         description: Missing tenantId or invalid format
 *       500:
 *         description: Internal server error
 */
router.get('/users-by-tenant', getUsersWithRolesByTenant);

/**
 * @swagger
 * /user-roles/roles-by-tenant:
 *   get:
 *     summary: Get all roles for a specific tenant
 *     tags: [User Roles]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tenant ID to get roles for
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 roles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RoleOutput'
 *       400:
 *         description: Missing tenantId
 *       500:
 *         description: Internal server error
 */
router.get('/roles-by-tenant', getRolesByTenant);

module.exports = router;