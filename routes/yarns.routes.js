const express = require('express');
const router = express.Router();
const {
  getAllYarns,
  getYarnById,
  createYarn,
  updateYarn,
  deactivateYarn
} = require('../controllers/yarns.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Yarns
 *   description: Yarn master data
 */

/**
 * @swagger
 * /yarns:
 *   get:
 *     summary: Get all yarns
 *     tags: [Yarns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of yarns
 */
router.get('/', verifyToken, getAllYarns);

/**
 * @swagger
 * /yarns/{id}:
 *   get:
 *     summary: Get yarn by ID
 *     tags: [Yarns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Yarn details
 */
router.get('/:id', verifyToken, getYarnById);

/**
 * @swagger
 * /yarns:
 *   post:
 *     summary: Create a new yarn
 *     tags: [Yarns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [tenant_id, yarn_type_id, blend_id, count_range]
 *             properties:
 *               tenant_id: { type: string }
 *               yarn_type_id: { type: string }
 *               blend_id: { type: string }
 *               count_range: { type: string, example: "25s–40s" }
 *               base_shade: { type: string }
 *               special_effect: { type: string }
 *     responses:
 *       201:
 *         description: Yarn created
 */
router.post('/', verifyToken, requireRole('admin', 'supervisor'), createYarn);

/**
 * @swagger
 * /yarns/{id}:
 *   put:
 *     summary: Update yarn data
 *     tags: [Yarns]
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
 *               count_range: { type: string }
 *               base_shade: { type: string }
 *               special_effect: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Yarn updated
 */
router.put('/:id', verifyToken, requireRole('admin', 'supervisor'), updateYarn);

/**
 * @swagger
 * /yarns/{id}:
 *   delete:
 *     summary: Deactivate a yarn
 *     tags: [Yarns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Yarn marked inactive
 */
router.delete('/:id', verifyToken, requireRole('admin'), deactivateYarn);

module.exports = router;