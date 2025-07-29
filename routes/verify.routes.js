const express = require('express');
const router = express.Router();
const controller = require('../controllers/verify.controller');

/**
 * @swagger
 * tags:
 *   name: Signup Process
 *   description: User signup and email verification operations
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Sign up a new user for 14-day trial
 *     tags: [Signup Process]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 example: securePassword123
 *                 description: User's password (min 8 characters)
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *                 example: 40d1df49-463d-4c86-9595-7c88f83d5ef9
 *                 description: Tenant ID for the user
 *     responses:
 *       201:
 *         description: Signup successful. Verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signup successful. Please check your email to verify your account.
 *                 email:
 *                   type: string
 *                   example: john.doe@example.com
 *                 tenantId:
 *                   type: string
 *                   example: 40d1df49-463d-4c86-9595-7c88f83d5ef9
 *                 userId:
 *                   type: string
 *                   example: c6f974a9-05ec-4f2a-98d5-e965f308d4e9
 *                 assignedRoleId:
 *                   type: string
 *                   example: 611e24f3-856f-471e-9d24-959f8b2e3dc1
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Server error
 */
router.post('/signup', controller.signup);

/**
 * @swagger
 * /verify-email:
 *   get:
 *     summary: Verify user's email using token
 *     tags: [Signup Process]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token from email
 *         example: abc123def456ghi789
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
 *                   nullable: true
 *                   description: User's assigned role information
 *       400:
 *         description: Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/verify-email', controller.verifyEmail);

/**
 * @swagger
 * /admin/signup:
 *   post:
 *     summary: Admin signup with superadmin privileges
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin User
 *                 description: Admin's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *                 description: Admin's email address
 *               password:
 *                 type: string
 *                 example: adminPassword123
 *                 description: Admin's password (min 8 characters)
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *                 example: 40d1df49-463d-4c86-9595-7c88f83d5ef9
 *                 description: Tenant ID for the admin
 *     responses:
 *       201:
 *         description: Admin signup successful. Verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin signup successful. Please check your email to verify your account.
 *                 email:
 *                   type: string
 *                   example: admin@example.com
 *                 tenantId:
 *                   type: string
 *                   example: 40d1df49-463d-4c86-9595-7c88f83d5ef9
 *                 userId:
 *                   type: string
 *                   example: c6f974a9-05ec-4f2a-98d5-e965f308d4e9
 *                 assignedRoleId:
 *                   type: string
 *                   example: 611e24f3-856f-471e-9d24-959f8b2e3dc1
 *       400:
 *         description: Missing or invalid fields
 *       500:
 *         description: Server error
 */
router.post('/admin/signup', controller.adminSignup);

module.exports = router;