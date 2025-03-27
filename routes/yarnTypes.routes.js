const express = require('express');
const router = express.Router();
const {
  getAllYarnTypes,
  getYarnTypeById,
  createYarnType,
  updateYarnType,
  deleteYarnType
} = require('../controllers/yarnTypes.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: YarnTypes
 *   description: Master yarn types like melange, fancy, etc.
 */

/**
 * @swagger
 * /yarn-types:
 *   get:
 *     summary: Get all yarn types
 *     tags: [YarnTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of yarn types
 */
router.get('/', verifyToken, getAllYarnTypes);

/**
 * @swagger
 * /yarn-types/{id}:
 *   get:
 *     summary: Get a yarn type by ID
 *     tags: [YarnTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Yarn type detail
 */
router.get('/:id', verifyToken, getYarnTypeById);

/**
 * @swagger
 * /yarn-types:
 *   post:
 *     summary: Create a new yarn type
 *     tags: [YarnTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Melange" }
 *               category: { type: string, example: "Regular" }
 *     responses:
 *       201:
 *         description: Yarn type created
 */
router.post('/', verifyToken, requireRole('admin', 'supervisor'), createYarnType);

/**
 * @swagger
 * /yarn-types/{id}:
 *   put:
 *     summary: Update a yarn type
 *     tags: [YarnTypes]
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
 *               name: { type: string }
 *               category: { type: string }
 *     responses:
 *       200:
 *         description: Yarn type updated
 */
router.put('/:id', verifyToken, requireRole('admin', 'supervisor'), updateYarnType);

/**
 * @swagger
 * /yarn-types/{id}:
 *   delete:
 *     summary: Delete a yarn type
 *     tags: [YarnTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Yarn type deleted
 */
router.delete('/:id', verifyToken, requireRole('admin'), deleteYarnType);

module.exports = router;