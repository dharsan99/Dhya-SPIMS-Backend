// routes/purchaseOrders.routes.js
const express = require('express');
const router = express.Router();
const purchaseOrdersController = require('../controllers/purchaseOrders.controller');
const { verifyToken } = require('../middlewares/auth.middleware'); // ✅ Use the correct middleware
const upload = require('../middlewares/upload.middleware'); // 👈 Import multer middleware
const { requireRole } = require('../middlewares/role.middleware');

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(requireRole('admin', 'hr', 'manager'));

router.post(
  '/upload-and-parse',
  upload.single('file'), // 'file' must match the field name from the frontend
  purchaseOrdersController.parseAndCreatePurchaseOrder
);

// ✅ Apply verifyToken to all protected routes
router.post('/', purchaseOrdersController.createPurchaseOrder);

/**
 * @swagger
 * tags:
 *   name: Purchase Orders
 *   description: Purchase order management APIs
 */

/**
 * @swagger
 * /purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     tags: [Purchase Orders]
 *     parameters:
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
 *         description: List of purchase orders
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', purchaseOrdersController.getAllPurchaseOrders);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order details
 *       404:
 *         description: Purchase order not found
 */
router.get('/:id', purchaseOrdersController.getPurchaseOrderById);

/**
 * @swagger
 * /purchase-orders:
 *   post:
 *     summary: Create new purchase order
 *     tags: [Purchase Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - poNumber
 *               - poDate
 *               - buyerName
 *               - items
 *     responses:
 *       201:
 *         description: Purchase order created
 *       400:
 *         description: Invalid input
 */
router.post('/', purchaseOrdersController.createPurchaseOrder);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   put:
 *     summary: Update purchase order
 *     tags: [Purchase Orders]
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
 *         description: Purchase order updated
 *       404:
 *         description: Purchase order not found
 */
router.put('/:id', purchaseOrdersController.updatePurchaseOrder);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   delete:
 *     summary: Delete purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase order deleted
 *       404:
 *         description: Purchase order not found
 */
router.delete('/:id', purchaseOrdersController.deletePurchaseOrder);

router.post('/:id/verify', verifyToken, purchaseOrdersController.verify);
router.post('/:id/convert', verifyToken, purchaseOrdersController.convert);
module.exports = router;