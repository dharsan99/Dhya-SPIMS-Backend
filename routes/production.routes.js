const express = require('express');
const router = express.Router();
const {
  getAllProduction,
  getProductionById,
  addProductionEntry,
  updateProductionEntry
} = require('../controllers/production.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Production
 *   description: Shift-wise production logging
 */

/**
 * @swagger
 * /production:
 *   get:
 *     summary: Get all production entries
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of production records
 */
router.get('/', verifyToken, getAllProduction);

/**
 * @swagger
 * /production/{id}:
 *   get:
 *     summary: Get a production record by ID
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       200:
 *         description: Single production record
 */
router.get('/:id', verifyToken, getProductionById);

/**
 * @swagger
 * /production:
 *   post:
 *     summary: Log a new production entry
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [tenant_id, date, section, shift, value, linked_order_id, entered_by]
 *             properties:
 *               tenant_id: { type: string }
 *               date: { type: string, format: date }
 *               section: { type: string, example: "carding" }
 *               shift: { type: string, example: "IInd" }
 *               value: { type: number, example: 356.75 }
 *               linked_order_id: { type: string }
 *               entered_by: { type: string }
 *     responses:
 *       201:
 *         description: Production entry logged
 */
router.post('/', verifyToken, requireRole('admin', 'supervisor', 'operator'), addProductionEntry);

/**
 * @swagger
 * /production/{id}:
 *   put:
 *     summary: Update a production record
 *     tags: [Production]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               section: { type: string }
 *               shift: { type: string }
 *               value: { type: number }
 *     responses:
 *       200:
 *         description: Production entry updated
 */
router.put('/:id', verifyToken, requireRole('admin', 'supervisor'), updateProductionEntry);

module.exports = router;