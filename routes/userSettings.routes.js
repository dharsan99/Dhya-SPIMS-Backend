const express = require('express');
const router = express.Router();
const controller = require('../controllers/userSettings.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
router.use(verifyTokenAndTenant);
/**
 * @swagger
 * tags:
 *   name: UserSettings
 *   description: User-level app settings and preferences
 */

/**
 * @swagger
 * /user-settings:
 *   get:
 *     summary: Get settings for the logged-in user
 *     tags: [UserSettings]

 *     responses:
 *       200:
 *         description: User settings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSettings'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', controller.getUserSettings);

/**
 * @swagger
 * /user-settings:
 *   put:
 *     summary: Update settings for the logged-in user
 *     tags: [UserSettings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSettings'
 *     responses:
 *       200:
 *         description: Settings updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/',  controller.updateUserSettings);

module.exports = router;