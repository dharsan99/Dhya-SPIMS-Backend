// routes/purchaseOrders.routes.js
const express = require('express');
const router = express.Router();
const purchaseOrdersController = require('../controllers/purchaseOrders.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Item ID
 *         order_code:
 *           type: string
 *           description: Order code for the item
 *           example: "ORD001"
 *         yarn_description:
 *           type: string
 *           description: Description of the yarn
 *           example: "Cotton Yarn 100% Pure"
 *         color:
 *           type: string
 *           description: Color of the yarn
 *           example: "White"
 *         count:
 *           type: string
 *           description: Yarn count
 *           example: "30s"
 *         uom:
 *           type: string
 *           description: Unit of measurement
 *           example: "KG"
 *         bag_count:
 *           type: integer
 *           description: Number of bags
 *           example: 10
 *         quantity:
 *           type: number
 *           format: float
 *           description: Quantity ordered
 *           example: 100.5
 *         rate:
 *           type: number
 *           format: float
 *           description: Rate per unit
 *           example: 250.00
 *         gst_percent:
 *           type: number
 *           format: float
 *           description: GST percentage
 *           example: 18.0
 *         taxable_amount:
 *           type: number
 *           format: float
 *           description: Taxable amount
 *           example: 25125.00
 *         shade_no:
 *           type: string
 *           description: Shade number
 *           example: "SH001"
 *     
 *     PurchaseOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Purchase order ID
 *         tenant_id:
 *           type: integer
 *           description: Tenant ID
 *         created_by:
 *           type: integer
 *           description: User ID who created the order
 *         po_number:
 *           type: string
 *           description: Purchase order number
 *           example: "PO-2025-001"
 *         buyer_name:
 *           type: string
 *           description: Name of the buyer
 *           example: "ABC Textiles Ltd"
 *         buyer_contact_name:
 *           type: string
 *           description: Buyer contact person name
 *           example: "John Doe"
 *         buyer_contact_phone:
 *           type: string
 *           description: Buyer contact phone
 *           example: "+91-9876543210"
 *         buyer_email:
 *           type: string
 *           format: email
 *           description: Buyer email address
 *           example: "john@abctextiles.com"
 *         buyer_address:
 *           type: string
 *           description: Buyer address
 *           example: "123 Main Street, City, State - 123456"
 *         buyer_gst_no:
 *           type: string
 *           description: Buyer GST number
 *           example: "29ABCDE1234F1Z5"
 *         buyer_pan_no:
 *           type: string
 *           description: Buyer PAN number
 *           example: "ABCDE1234F"
 *         supplier_name:
 *           type: string
 *           description: Name of the supplier
 *           example: "XYZ Yarn Suppliers"
 *         supplier_gst_no:
 *           type: string
 *           description: Supplier GST number
 *           example: "27FGHIJ5678K1L2"
 *         payment_terms:
 *           type: string
 *           description: Payment terms
 *           example: "30 days from invoice date"
 *         style_ref_no:
 *           type: string
 *           description: Style reference number
 *           example: "STY001"
 *         delivery_address:
 *           type: string
 *           description: Delivery address
 *           example: "Factory Address, Industrial Area"
 *         tax_details:
 *           type: string
 *           description: Tax details
 *           example: "GST @ 18%"
 *         grand_total:
 *           type: number
 *           format: float
 *           description: Grand total amount
 *           example: 29647.50
 *         amount_in_words:
 *           type: string
 *           description: Amount in words
 *           example: "Twenty Nine Thousand Six Hundred Forty Seven and Fifty Paise Only"
 *         notes:
 *           type: string
 *           description: Additional notes
 *           example: "Please deliver within 15 days"
 *         po_date:
 *           type: string
 *           format: date-time
 *           description: Purchase order date
 *           example: "2025-06-16T10:30:00Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PurchaseOrderItem'
 *     
 *     CreatePurchaseOrderRequest:
 *       type: object
 *       required:
 *         - po_number
 *         - buyer_name
 *         - supplier_name
 *         - po_date
 *         - grand_total
 *       properties:
 *         po_number:
 *           type: string
 *           example: "PO-2025-001"
 *         buyer_name:
 *           type: string
 *           example: "ABC Textiles Ltd"
 *         buyer_contact_name:
 *           type: string
 *           example: "John Doe"
 *         buyer_contact_phone:
 *           type: string
 *           example: "+91-9876543210"
 *         buyer_email:
 *           type: string
 *           format: email
 *           example: "john@abctextiles.com"
 *         buyer_address:
 *           type: string
 *           example: "123 Main Street, City, State - 123456"
 *         buyer_gst_no:
 *           type: string
 *           example: "29ABCDE1234F1Z5"
 *         buyer_pan_no:
 *           type: string
 *           example: "ABCDE1234F"
 *         supplier_name:
 *           type: string
 *           example: "XYZ Yarn Suppliers"
 *         supplier_gst_no:
 *           type: string
 *           example: "27FGHIJ5678K1L2"
 *         payment_terms:
 *           type: string
 *           example: "30 days from invoice date"
 *         style_ref_no:
 *           type: string
 *           example: "STY001"
 *         delivery_address:
 *           type: string
 *           example: "Factory Address, Industrial Area"
 *         tax_details:
 *           type: string
 *           example: "GST @ 18%"
 *         grand_total:
 *           type: number
 *           format: float
 *           example: 29647.50
 *         amount_in_words:
 *           type: string
 *           example: "Twenty Nine Thousand Six Hundred Forty Seven and Fifty Paise Only"
 *         notes:
 *           type: string
 *           example: "Please deliver within 15 days"
 *         po_date:
 *           type: string
 *           format: date
 *           example: "2025-06-16"
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               order_code:
 *                 type: string
 *                 example: "ORD001"
 *               yarn_description:
 *                 type: string
 *                 example: "Cotton Yarn 100% Pure"
 *               color:
 *                 type: string
 *                 example: "White"
 *               count:
 *                 type: string
 *                 example: "30s"
 *               uom:
 *                 type: string
 *                 example: "KG"
 *               bag_count:
 *                 type: integer
 *                 example: 10
 *               quantity:
 *                 type: number
 *                 format: float
 *                 example: 100.5
 *               rate:
 *                 type: number
 *                 format: float
 *                 example: 250.00
 *               gst_percent:
 *                 type: number
 *                 format: float
 *                 example: 18.0
 *               taxable_amount:
 *                 type: number
 *                 format: float
 *                 example: 25125.00
 *               shade_no:
 *                 type: string
 *                 example: "SH001"
 *     
 *     UpdatePurchaseOrderRequest:
 *       type: object
 *       properties:
 *         po_number:
 *           type: string
 *           example: "PO-2025-001"
 *         buyer_name:
 *           type: string
 *           example: "ABC Textiles Ltd"
 *         payment_terms:
 *           type: string
 *           example: "30 days from invoice date"
 *         notes:
 *           type: string
 *           example: "Updated delivery requirements"
 *         amount_in_words:
 *           type: string
 *           example: "Twenty Nine Thousand Six Hundred Forty Seven and Fifty Paise Only"
 *         grand_total:
 *           type: number
 *           format: float
 *           example: 29647.50
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               order_code:
 *                 type: string
 *                 example: "ORD001"
 *               yarn_description:
 *                 type: string
 *                 example: "Cotton Yarn 100% Pure"
 *               color:
 *                 type: string
 *                 example: "White"
 *               uom:
 *                 type: string
 *                 example: "KG"
 *               bag_count:
 *                 type: integer
 *                 example: 10
 *               quantity:
 *                 type: number
 *                 format: float
 *                 example: 100.5
 *               rate:
 *                 type: number
 *                 format: float
 *                 example: 250.00
 *               gst_percent:
 *                 type: number
 *                 format: float
 *                 example: 18.0
 *               taxable_amount:
 *                 type: number
 *                 format: float
 *                 example: 25125.00
 *               shade_no:
 *                 type: string
 *                 example: "SH001"
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /purchase-orders:
 *   post:
 *     summary: Create a new purchase order
 *     description: Creates a new purchase order with items for the authenticated user's tenant
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePurchaseOrderRequest'
 *     responses:
 *       201:
 *         description: Purchase order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error message"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, purchaseOrdersController.createPurchaseOrder);

/**
 * @swagger
 * /purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     description: Retrieves all purchase orders for the authenticated user's tenant, ordered by creation date (newest first)
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchase orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/PurchaseOrder'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "No data available"
 *                     data:
 *                       type: array
 *                       items: {}
 *                       example: []
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Failed to fetch purchase orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch purchase orders"
 */
router.get('/', verifyToken, purchaseOrdersController.getAllPurchaseOrders);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by ID
 *     description: Retrieves a specific purchase order by ID for the authenticated user's tenant
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase order ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Purchase order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       404:
 *         description: Purchase order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Purchase order not found"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
router.get('/:id', verifyToken, purchaseOrdersController.getPurchaseOrderById);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   put:
 *     summary: Update purchase order
 *     description: Updates an existing purchase order. This will replace all existing items with the new items provided.
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase order ID to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePurchaseOrderRequest'
 *     responses:
 *       200:
 *         description: Purchase order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseOrder'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation error message"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', verifyToken, purchaseOrdersController.updatePurchaseOrder);

/**
 * @swagger
 * /purchase-orders/{id}:
 *   delete:
 *     summary: Delete purchase order
 *     description: Deletes a purchase order and all its associated items permanently
 *     tags: [Purchase Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Purchase order ID to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Purchase order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Deleted successfully"
 *       400:
 *         description: Bad request - error deleting purchase order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Purchase order not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, purchaseOrdersController.deletePurchaseOrder);

module.exports = router;