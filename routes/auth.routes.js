const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authService = require('../services/auth.service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
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
 *                 format: email
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
 *                     tenantId:
 *                       type: string
 *                     role:
 *                       type: object
 *                     isActive:
 *                       type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/invite:
 *   post:
 *     summary: Invite a user to join the system
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - tenantId
 *               - roleId
 *             properties:
 *               email:
 *                 type: string
 *               tenantId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/invite', authController.inviteUser);

/**
 * @swagger
 * /auth/accept-invite:
 *   post:
 *     summary: Accept invitation and create account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - name
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid or missing fields
 *       500:
 *         description: Internal server error
 */
router.post('/accept-invite', authController.acceptInvite);

module.exports = router;
