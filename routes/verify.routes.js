const express = require('express');
const router = express.Router();
const controller = require('../controllers/verify.controller');


/**
 * @swagger
 * tags:
 *   name: sigup process
 *   description: Signup and email verification
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Sign up a new user for 14-day trial
 *     tags: [sigup process]
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
 *               - tenant_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: abi
 *               email:
 *                 type: string
 *                 example: abinayashree@dhya.in
 *               password:
 *                 type: string
 *                 example: string
 *               tenant_id:
 *                 type: string
 *                 example: 40d1df49-463d-4c86-9595-7c88f83d5ef9
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
 *                   example: abinayashree@dhya.in
 *                 tenant_id:
 *                   type: string
 *                   example: 40d1df49-463d-4c86-9595-7c88f83d5ef9
 *                 user_id:
 *                   type: string
 *                   example: c6f974a9-05ec-4f2a-98d5-e965f308d4e9
 *                 assigned_role_id:
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
 *     tags: [sigup process]
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
 *       400:
 *         description: Invalid or missing token
 */
router.get('/verify-email', controller.verifyEmail);

module.exports = router;