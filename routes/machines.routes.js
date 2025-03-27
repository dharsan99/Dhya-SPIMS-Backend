const express = require('express');
const router = express.Router();
const {
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deactivateMachine
} = require('../controllers/machines.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Machines
 *   description: Machine master management
 */

/**
 * @swagger
 * /machines:
 *   get:
 *     summary: Get all machines
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of machines
 */
router.get('/', verifyToken, getAllMachines);

/**
 * @swagger
 * /machines/{id}:
 *   get:
 *     summary: Get a machine by ID
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Machine metadata
 */
router.get('/:id', verifyToken, getMachineById);

/**
 * @swagger
 * /machines:
 *   post:
 *     summary: Create/register a machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [tenant_id, machine_code, section]
 *             properties:
 *               tenant_id: { type: string }
 *               machine_code: { type: string, example: "LMW-001" }
 *               section: { type: string, example: "carding" }
 *               description: { type: string, example: "LMW Trumac TC 5" }
 *     responses:
 *       201:
 *         description: Machine created
 */
router.post('/', verifyToken, requireRole('admin', 'supervisor'), createMachine);

/**
 * @swagger
 * /machines/{id}:
 *   put:
 *     summary: Update machine info
 *     tags: [Machines]
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
 *               machine_code: { type: string }
 *               description: { type: string }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Machine updated
 */
router.put('/:id', verifyToken, requireRole('admin', 'supervisor'), updateMachine);

/**
 * @swagger
 * /machines/{id}:
 *   delete:
 *     summary: Deactivate a machine
 *     tags: [Machines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Machine deactivated
 */
router.delete('/:id', verifyToken, requireRole('admin'), deactivateMachine);

module.exports = router;