const express = require('express');
const router = express.Router();
const {
  getAllShades,
  getShadeById,
  createShade,
  updateShade,
  deleteShade
} = require('../controllers/shades.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Shades
 *   description: Shade card management
 */

/**
 * @swagger
 * /shades:
 *   get:
 *     summary: Get all shade cards
 *     tags: [Shades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shades
 */
router.get('/', verifyToken, getAllShades);

/**
 * @swagger
 * /shades/{id}:
 *   get:
 *     summary: Get shade by ID
 *     tags: [Shades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shade details
 */
router.get('/:id', verifyToken, getShadeById);

/**
 * @swagger
 * /shades:
 *   post:
 *     summary: Create new shade card
 *     tags: [Shades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [shade_code, brand_id, blend_id, shade_name, percentage]
 *             properties:
 *               shade_code: { type: string }
 *               brand_id: { type: string }
 *               blend_id: { type: string }
 *               shade_name: { type: string }
 *               percentage: { type: string, example: "98C/2P" }
 *               available_stock_kg: { type: number, example: 500 }
 *     responses:
 *       201:
 *         description: Shade created
 */
router.post('/', verifyToken, requireRole('admin', 'supervisor'), createShade);

/**
 * @swagger
 * /shades/{id}:
 *   put:
 *     summary: Update shade card
 *     tags: [Shades]
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
 *               shade_code: { type: string }
 *               shade_name: { type: string }
 *               percentage: { type: string }
 *               available_stock_kg: { type: number }
 *     responses:
 *       200:
 *         description: Shade updated
 */
router.put('/:id', verifyToken, requireRole('admin', 'supervisor'), updateShade);

/**
 * @swagger
 * /shades/{id}:
 *   delete:
 *     summary: Delete shade card
 *     tags: [Shades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shade deleted
 */
router.delete('/:id', verifyToken, requireRole('admin'), deleteShade);

module.exports = router;