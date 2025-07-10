const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
router.use(verifyTokenAndTenant);
/** 
 * @swagger
 * tags:
 *   name: Settings
 *   description: Tenant-level application settings
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get tenant settings
 *     tags: [Settings]

 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', settingsController.getTenantSettings);

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update tenant settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Settings'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/',  settingsController.updateTenantSettings);

module.exports = router;