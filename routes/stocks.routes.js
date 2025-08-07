const express = require('express');
const router = express.Router();
const stocksController = require('../controllers/stocks.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');

router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   - name: Stocks
 *     description: Manage stock items for fibres
 */

/**
 * @swagger
 * /stocks:
 *   get:
 *     summary: Get all stock items
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: List of all stock items
 *   post:
 *     summary: Create a new stock item
 *     tags: [Stocks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fibreId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               stockKg:
 *                 type: number
 *               thresholdKg:
 *                 type: number
 *     responses:
 *       201:
 *         description: Stock item created
 */
router.get('/', stocksController.getAllStocks);
router.post('/', stocksController.createStock);

/**
 * @swagger
 * /stocks/{id}:
 *   put:
 *     summary: Update a stock item
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fibreId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               stockKg:
 *                 type: number
 *               thresholdKg:
 *                 type: number
 *     responses:
 *       200:
 *         description: Stock item updated
 *   delete:
 *     summary: Delete a stock item
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock item ID
 *     responses:
 *       204:
 *         description: Stock item deleted
 */
router.put('/:id', stocksController.updateStock);
router.delete('/:id', stocksController.deleteStock);

module.exports = router;