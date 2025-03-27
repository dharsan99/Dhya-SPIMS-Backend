const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/suppliers.controller');

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   contact:
 *                     type: string
 *                   email:
 *                     type: string
 *                   address:
 *                     type: string
 */
router.get('/', getAllSuppliers);

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Super Supplier Co.
 *               contact:
 *                 type: string
 *                 example: +91-9876543210
 *               email:
 *                 type: string
 *                 example: supply@nsc.com
 *               address:
 *                 type: string
 *                 example: Coimbatore, TN
 *     responses:
 *       201:
 *         description: Supplier created
 *       500:
 *         description: Failed to create supplier
 */
router.post('/', createSupplier);

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: Update an existing supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Supplier ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supplier updated
 *       500:
 *         description: Failed to update supplier
 */
router.put('/:id', updateSupplier);

/**
 * @swagger
 * /suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Supplier ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Supplier deleted
 *       500:
 *         description: Failed to delete supplier
 */
router.delete('/:id', deleteSupplier);

module.exports = router;