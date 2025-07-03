const express = require('express');
const router = express.Router();
const userRolesAssignmentsController = require('../controllers/userRolesAssignments.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');

router.use(verifyTokenAndTenant);

/**
 * @swagger
 * /user-roles/assign:
 *   post:
 *     summary: Assign a role to a user
 *     tags: [User Roles Assignment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - role_id
 *             properties:
 *               user_id:
 *                 type: string
 *               role_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User or role not found
 *       500:
 *         description: Internal server error
 */
router.post('/assign', userRolesAssignmentsController.assignRoleToUser);

/**
 * @swagger
 * /user-roles/remove/{id}:
 *   delete:
 *     summary: Remove a role from a user
 *     tags: [User Roles Assignment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role removed successfully
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/remove/:id', userRolesAssignmentsController.removeRoleFromUser);

/**
 * @swagger
 * /user-roles/{id}:
 *   get:
 *     summary: Get all roles assigned to a user
 *     tags: [User Roles Assignment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user roles
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', userRolesAssignmentsController.getUserRoles);

module.exports = router;