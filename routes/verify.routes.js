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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
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
 *                 email:
 *                   type: string
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