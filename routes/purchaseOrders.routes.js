// routes/purchaseOrders.routes.js
const express = require('express');
const router = express.Router();
const purchaseOrdersController = require('../controllers/purchaseOrders.controller');
const { verifyToken } = require('../middlewares/auth.middleware'); // ✅ Use the correct middleware
const upload = require('../middlewares/upload.middleware'); // 👈 Import multer middleware

router.post(
  '/upload-and-parse',
  verifyToken,
  upload.single('file'), // 'file' must match the field name from the frontend
  purchaseOrdersController.parseAndCreatePurchaseOrder
);

// ✅ Apply verifyToken to all protected routes
router.post('/', verifyToken, purchaseOrdersController.createPurchaseOrder);

/**
 * @swagger
 * /purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     description: Retrieves all purchase orders for the authenticated user's tenant, ordered by creation date (newest first)
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchase orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/PurchaseOrder'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "No data available"
 *                     data:
 *                       type: array
 *                       items: {}
 *                       example: []
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to fetch purchase orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch purchase orders"
 */
router.get('/', verifyToken, purchaseOrdersController.getAllPurchaseOrders);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     description: Retrieves a specific purchase order by ID for the authenticated user's tenant
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase order ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Purchase order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       404:
 *         description: Purchase order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Purchase order not found"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
router.get('/:id', verifyToken, purchaseOrdersController.getPurchaseOrderById);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   put:
 *     summary: Update purchase order
 *     description: Updates an existing purchase order. This will replace all existing items with the new items provided.
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase order ID to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePurchaseOrderRequest'
 *     responses:
 *       200:
 *         description: Purchase order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error message"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', verifyToken, purchaseOrdersController.updatePurchaseOrder);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   delete:
 *     summary: Delete purchase order
 *     description: Deletes a purchase order and all its associated items permanently
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase order ID to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Purchase order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Deleted successfully"
 *       400:
 *         description: Bad request - error deleting purchase order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, purchaseOrdersController.deletePurchaseOrder);

router.post('/:id/verify', verifyToken, purchaseOrdersController.verify);
router.post('/:id/convert', verifyToken, purchaseOrdersController.convert);
module.exports = router;