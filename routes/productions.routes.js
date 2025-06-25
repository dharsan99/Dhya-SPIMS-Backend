const express = require('express');
const router = express.Router();
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const productionsController = require('../controllers/productions.controller');

// Apply authentication middleware to all routes
router.use(verifyTokenAndTenant);
router.use(requireRole('admin', 'hr', 'manager'));

/**
 * @swagger
 * tags:
 *   name: Productions
 *   description: Production management APIs
 */

/**
 * @swagger
 * /productions:
 *   get:
 *     summary: Get all productions
 *     tags: [Productions]
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
 *         description: List of productions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', productionsController.getAllProductions);

/**
 * @swagger
 * /productions/{id}:
 *   get:
 *     summary: Get production by ID
 *     tags: [Productions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Production details
 *       404:
 *         description: Production not found
 */
router.get('/:id', productionsController.getProductionById);

/**
 * @swagger
 * /productions:
 *   post:
 *     summary: Create new production
 *     tags: [Productions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *               - endDate
 *     responses:
 *       201:
 *         description: Production created
 *       400:
 *         description: Invalid input
 */
router.post('/', productionsController.createProduction);

/**
 * @swagger
 * /productions/{id}:
 *   put:
 *     summary: Update production
 *     tags: [Productions]
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
 *         description: Production updated
 *       404:
 *         description: Production not found
 */
router.put('/:id', productionsController.updateProduction);

/**
 * @swagger
 * /productions/{id}:
 *   delete:
 *     summary: Delete production
 *     tags: [Productions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Production deleted
 *       404:
 *         description: Production not found
 */
router.delete('/:id', productionsController.deleteProduction);

module.exports = router; 