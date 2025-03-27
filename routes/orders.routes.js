const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
} = require('../controllers/orders.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', verifyToken, getAllOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details
 */
router.get('/:id', verifyToken, getOrderById);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [order_number, buyer_name, yarn_id, quantity_kg, delivery_date, tenant_id, created_by]
 *             properties:
 *               tenant_id: { type: string }
 *               order_number: { type: string, example: "SO-1001" }
 *               buyer_name: { type: string }
 *               yarn_id: { type: string }
 *               quantity_kg: { type: number }
 *               delivery_date: { type: string, format: date }
 *               created_by: { type: string }
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', verifyToken, requireRole('admin', 'supervisor'), createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, dispatched]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id', verifyToken, requireRole('admin', 'supervisor'), updateOrderStatus);

module.exports = router;