const express = require('express');
const router = express.Router();
const buyersController = require('../controllers/buyers.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');

router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   name: Buyers
 *   description: Manage buyers (CRUD)
 */

/**
 * @swagger
 * /buyers:
 *   get:
 *     summary: Get all buyers
 *     tags: [Buyers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of buyers
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', buyersController.getAllBuyers);

/**
 * @swagger
 * /buyers/{id}:
 *   get:
 *     summary: Get a single buyer by ID
 *     tags: [Buyers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Buyer ID (UUID)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Buyer details
 *       404:
 *         description: Buyer not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', buyersController.getBuyerById);

/**
 * @swagger
 * /buyers:
 *   post:
 *     summary: Create a new buyer
 *     tags: [Buyers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Buyer created
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create buyer
 */
router.post('/', buyersController.createBuyer);

/**
 * @swagger
 * /buyers/{id}:
 *   put:
 *     summary: Update a buyer
 *     tags: [Buyers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Buyer ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Buyer updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.put('/:id', buyersController.updateBuyer);

/**
 * @swagger
 * /buyers/{id}:
 *   delete:
 *     summary: Delete a buyer
 *     tags: [Buyers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Buyer ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Buyer deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Buyer not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', buyersController.deleteBuyer);

module.exports = router;