const express = require('express');
const router = express.Router();
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const fibreTransfersController = require('../controllers/fibreTransfers.controller');
const quotaMiddleware = require('../middlewares/quota.middleware');
const parseController = require('../controllers/parse.controller');

// Apply authentication middleware to all routes
router.use(verifyTokenAndTenant);
router.use(requireRole('admin', 'hr', 'manager'));

/**
 * @swagger
 * tags:
 *   name: Fibre Transfers
 *   description: Fibre transfer management APIs
 */

/**
 * @swagger
 * /fibre-transfers:
 *   get:
 *     summary: Get all fibre transfers
 *     tags: [Fibre Transfers]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: List of fibre transfers
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', fibreTransfersController.getAllFibreTransfers);

/**
 * @swagger
 * /fibre-transfers/{id}:
 *   get:
 *     summary: Get fibre transfer by ID
 *     tags: [Fibre Transfers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fibre transfer details
 *       404:
 *         description: Fibre transfer not found
 */
router.get('/:id', fibreTransfersController.getFibreTransferById);

/**
 * @swagger
 * /fibre-transfers:
 *   post:
 *     summary: Create new fibre transfer
 *     tags: [Fibre Transfers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromLocation
 *               - toLocation
 *               - quantity
 *     responses:
 *       201:
 *         description: Fibre transfer created
 *       400:
 *         description: Invalid input
 */
router.post('/', fibreTransfersController.createFibreTransfer);

/**
 * @swagger
 * /fibre-transfers/{id}:
 *   put:
 *     summary: Update fibre transfer
 *     tags: [Fibre Transfers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Fibre transfer updated
 *       404:
 *         description: Fibre transfer not found
 */
router.put('/:id', fibreTransfersController.updateFibreTransfer);

/**
 * @swagger
 * /fibre-transfers/{id}:
 *   delete:
 *     summary: Delete fibre transfer
 *     tags: [Fibre Transfers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fibre transfer deleted
 *       404:
 *         description: Fibre transfer not found
 */
router.delete('/:id', fibreTransfersController.deleteFibreTransfer);

//router.post('/send', quotaMiddleware('email', 100), emailController.sendEmail);

//router.post('/parse', quotaMiddleware('ai_parse', 50), parseController.parseFile);

module.exports = router;