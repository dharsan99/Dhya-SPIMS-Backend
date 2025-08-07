const express = require('express');
const router = express.Router();
const controller = require('../controllers/shades.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
router.use(verifyTokenAndTenant);   
// Apply auth middleware to all routes
router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   name: Shades
 *   description: Manage shade codes, colors, and fibre compositions
 */

/**
 * @swagger
 * /shades:
 *   get:
 *     summary: Get all shades (optionally filter by fibre_id)
 *     tags: [Shades]
 *     parameters:
 *       - in: query
 *         name: fibre_id
 *         schema:
 *           type: string
 *         description: Filter shades by fibre ID
 *     responses:
 *       200:
 *         description: List of shades
 */
router.get('/', controller.getAllShades);

/**
 * @swagger
 * /shades/stock-summary:
 *   get:
 *     summary: Get total available stock for each shade (grouped)
 *     tags: [Shades]
 *     responses:
 *       200:
 *         description: Aggregated stock summary
 */
router.get('/stock-summary', controller.getStockSummary);

/**
 * @swagger
 * /shades/{id}:
 *   get:
 *     summary: Get a shade by ID (with fibre composition)
 *     tags: [Shades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shade ID
 *     responses:
 *       200:
 *         description: Shade details
 *       404:
 *         description: Shade not found
 */
router.get('/:id', controller.getShadeById);

/**
 * @swagger
 * /shades:
 *   post:
 *     summary: Create a new shade with multiple fibres
 *     tags: [Shades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shadeCode
 *               - shadeName
 *             properties:
 *               shadeCode:
 *                 type: string
 *                 example: SHD12345
 *                 description: Unique shade code
 *               shadeName:
 *                 type: string
 *                 example: Light Grey
 *                 description: Name of the shade
 *               percentage:
 *                 type: string
 *                 example: 100%
 *                 description: Percentage value
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID (optional, will use user's tenant if not provided)
 *               blendFibres:
 *                 type: array
 *                 description: Array of fibre compositions
 *                 items:
 *                   type: object
 *                   properties:
 *                     fibreId:
 *                       type: string
 *                       example: 3cd43b5c-1aa7-4a05-809f-28c4c428528d
 *                       description: Fibre ID
 *                     percentage:
 *                       type: number
 *                       example: 70
 *                       description: Percentage of this fibre in the blend
 *               rawCottonCompositions:
 *                 type: array
 *                 description: Array of raw cotton compositions
 *                 items:
 *                   type: object
 *                   properties:
 *                     percentage:
 *                       type: number
 *                       description: Percentage of this cotton
 *                     cottonId:
 *                       type: string
 *                       description: Cotton ID (optional)
 *                     lotNumber:
 *                       type: string
 *                       description: Lot number
 *                     grade:
 *                       type: string
 *                       description: Cotton grade
 *                     source:
 *                       type: string
 *                       description: Cotton source
 *                     notes:
 *                       type: string
 *                       description: Additional notes
 *     responses:
 *       201:
 *         description: Shade created successfully
 */
router.post('/', controller.createShade);

/**
 * @swagger
 * /shades/{id}:
 *   put:
 *     summary: Update an existing shade and its fibre composition
 *     tags: [Shades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shade ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shadeCode:
 *                 type: string
 *                 description: Unique shade code
 *               shadeName:
 *                 type: string
 *                 description: Name of the shade
 *               percentage:
 *                 type: string
 *                 description: Percentage value
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID
 *               blendFibres:
 *                 type: array
 *                 description: Array of fibre compositions
 *                 items:
 *                   type: object
 *                   properties:
 *                     fibreId:
 *                       type: string
 *                       description: Fibre ID
 *                     percentage:
 *                       type: number
 *                       description: Percentage of this fibre in the blend
 *               rawCottonCompositions:
 *                 type: array
 *                 description: Array of raw cotton compositions
 *                 items:
 *                   type: object
 *                   properties:
 *                     percentage:
 *                       type: number
 *                       description: Percentage of this cotton
 *                     cottonId:
 *                       type: string
 *                       description: Cotton ID
 *                     lotNumber:
 *                       type: string
 *                       description: Lot number
 *                     grade:
 *                       type: string
 *                       description: Cotton grade
 *                     source:
 *                       type: string
 *                       description: Cotton source
 *                     notes:
 *                       type: string
 *                       description: Additional notes
 *     responses:
 *       200:
 *         description: Shade updated successfully
 *       404:
 *         description: Shade not found
 */
router.put('/:id', controller.updateShade);

/**
 * @swagger
 * /shades/{id}:
 *   delete:
 *     summary: Delete a shade
 *     tags: [Shades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shade ID
 *     responses:
 *       204:
 *         description: Shade deleted successfully
 *       404:
 *         description: Shade not found
 */
router.delete('/:id', controller.deleteShade);

module.exports = router;