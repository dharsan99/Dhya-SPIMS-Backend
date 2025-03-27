const express = require('express');
const router = express.Router();
const {
  getAllBlends,
  getBlendById,
  createBlend,
  updateBlend,
  deleteBlend
} = require('../controllers/blends.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Blends
 *   description: Yarn blend codes and descriptions
 */

/**
 * @swagger
 * /blends:
 *   get:
 *     summary: Get all blends
 *     tags: [Blends]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blends
 */
router.get('/', verifyToken, getAllBlends);

/**
 * @swagger
 * /blends/{id}:
 *   get:
 *     summary: Get blend by ID
 *     tags: [Blends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blend found
 */
router.get('/:id', verifyToken, getBlendById);

/**
 * @swagger
 * /blends:
 *   post:
 *     summary: Create a new blend
 *     tags: [Blends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [blend_code, description]
 *             properties:
 *               blend_code:
 *                 type: string
 *                 example: 52C/48P
 *               description:
 *                 type: string
 *                 example: Cotton/Polyester 52/48
 *     responses:
 *       201:
 *         description: Blend created
 */
router.post('/', verifyToken, requireRole('admin', 'supervisor'), createBlend);

/**
 * @swagger
 * /blends/{id}:
 *   put:
 *     summary: Update a blend
 *     tags: [Blends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               blend_code: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Blend updated
 */
router.put('/:id', verifyToken, requireRole('admin', 'supervisor'), updateBlend);

/**
 * @swagger
 * /blends/{id}:
 *   delete:
 *     summary: Delete a blend
 *     tags: [Blends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blend deleted
 */
router.delete('/:id', verifyToken, requireRole('admin'), deleteBlend);

module.exports = router;