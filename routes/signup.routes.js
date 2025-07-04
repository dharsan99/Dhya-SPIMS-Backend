const express = require('express');
const router = express.Router();
const controller = require('../controllers/register.controller');

/**
 * @swagger
 * /sign:
 *   post:
 *     summary: Signup for a new tenant and admin user for 14-day trial
 *     tags: [Signup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantName
 *               - adminName
 *               - email
 *               - password
 *             properties:
 *               tenantName:
 *                 type: string
 *                 description: Name of the tenant organization
 *               domain:
 *                 type: string
 *                 description: Domain for the tenant (optional)
 *               adminName:
 *                 type: string
 *                 description: Name of the admin user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the admin user
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password for the admin user (minimum 8 characters)
 *     responses:
 *       201:
 *         description: Signup successful, verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tenant_id:
 *                   type: string
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     is_verified:
 *                       type: boolean
 *                     tenant_id:
 *                       type: string
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         permissions:
 *                           type: object
 *                         tenant_id:
 *                           type: string
 *                     plan:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: Starter
 *                         price:
 *                           type: number
 *                           example: 0
 *                         billingCycle:
 *                           type: string
 *                           example: trial
 *                         description:
 *                           type: string
 *                           example: Basic 14-day trial plan
 *                         features:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example:
 *                             - Up to 5 users
 *                             - Basic order management
 *                             - Email support
 *                             - 14-day trial
 *                         maxUsers:
 *                           oneOf:
 *                             - type: integer
 *                             - type: string
 *                           example: 5
 *                         maxOrders:
 *                           oneOf:
 *                             - type: integer
 *                             - type: string
 *                           example: 20
 *                         maxStorage:
 *                           type: string
 *                           example: 2GB
 *                         popular:
 *                           type: boolean
 *                           example: false
 *                 note:
 *                   type: string
 *       400:
 *         description: Missing required fields or invalid data
 *       409:
 *         description: User already exists with this email
 *       500:
 *         description: Server error
 */
router.post('/', controller.register);

module.exports = router; 