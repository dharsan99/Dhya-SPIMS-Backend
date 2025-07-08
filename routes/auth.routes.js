const express = require('express');
const router = express.Router();
const { login, inviteUser, acceptInvite } = require('../controllers/auth.controller');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and Invitation APIs
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     tenant_id:
 *                       type: string
 *                     role:
 *                       type: object
 *                     is_verified:
 *                       type: boolean
 *                     plan:
 *                       type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/invite:
 *   post:
 *     summary: Admin invites teammate via email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - tenant_id
 *               - role_id
 *             properties:
 *               email:
 *                 type: string
 *               tenant_id:
 *                 type: string
 *               role_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invite sent
 *       400:
 *         description: Missing or invalid data
 */
router.post('/invite', inviteUser);

/**
 * @swagger
 * /auth/accept-invite:
 *   post:
 *     summary: Accept an invite and set password
 *     tags: [Auth]
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
 *       200:
 *         description: User registered successfully from invite
 *       400:
 *         description: Invalid or expired token
 */
router.post('/accept-invite', acceptInvite);

module.exports = router;
