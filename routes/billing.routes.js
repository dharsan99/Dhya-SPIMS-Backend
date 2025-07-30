const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing and payment management
 */

/**
 * @swagger
 * /billing/stats:
 *   get:
 *     summary: Get billing statistics
 *     tags: [Billing]

 *     responses:
 *       200:
 *         description: Billing statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: string
 *                 pendingAmount:
 *                   type: string
 *                 overdueAmount:
 *                   type: string
 *                 paidInvoices:
 *                   type: string
 *                 totalInvoices:
 *                   type: string
 *                 paidPercentage:
 *                   type: string
 *                 stats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       value:
 *                         type: string
 *                       change:
 *                         type: string
 *                       changeType:
 *                         type: string
 *                       description:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
router.get('/stats', billingController.getBillingStats);

/**
 * @swagger
 * /billing/admin/invoices:
 *   get:
 *     summary: Admin - Get all invoices with filtering and pagination
 *     tags: [Billing]

 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for invoice number or tenant name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, paid, overdue]
 *         description: Filter by invoice status
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *         description: Filter by plan type
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
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, amount, status]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       tenantName:
 *                         type: string
 *                       tenantEmail:
 *                         type: string
 *                       invoiceNumber:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                       issueDate:
 *                         type: string
 *                       paidDate:
 *                         type: string
 *                       plan:
 *                         type: string
 *                       billingCycle:
 *                         type: string
 *                       description:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/admin/invoices', billingController.adminGetInvoices);

/**
 * @swagger
 * /billing/invoices/{invoiceNumber}/send-email:
 *   post:
 *     summary: Send invoice email
 *     tags: [Billing]

 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice number
 *     responses:
 *       200:
 *         description: Invoice email sent successfully
 *       500:
 *         description: Internal server error
 */
router.post('/invoices/:invoiceNumber/send-email', billingController.sendInvoiceEmail);

/**
 * @swagger
 * /billing/invoices/{invoiceNumber}/send-bill:
 *   post:
 *     summary: Send invoice bill email
 *     tags: [Billing]

 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice number
 *     responses:
 *       200:
 *         description: Invoice bill email sent successfully
 *       500:
 *         description: Internal server error
 */
router.post('/invoices/:invoiceNumber/send-bill', billingController.sendInvoiceBillEmail);

/**
 * @swagger
 * /billing/payments:
 *   get:
 *     summary: Get payments with filtering and pagination
 *     tags: [Billing]

 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for transaction ID, method, status, or invoice number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, paid, pending, failed]
 *         description: Filter by payment status
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *         description: Filter by plan type
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [paidAt, billingId, tenantId, amount]
 *           default: paidAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAmount:
 *                   type: number
 *                 Completed:
 *                   type: integer
 *                 Pending:
 *                   type: integer
 *                 Failed:
 *                   type: integer
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       billingId:
 *                         type: string
 *                       invoiceNumber:
 *                         type: string
 *                       tenantId:
 *                         type: string
 *                       tenantName:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       method:
 *                         type: string
 *                       status:
 *                         type: string
 *                       paidAt:
 *                         type: string
 *                       txnId:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/payments', billingController.getPayments);

/**
 * @swagger
 * /billing/payments/{paymentId}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Billing]

 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 billingId:
 *                   type: string
 *                 invoiceNumber:
 *                   type: string
 *                 tenantId:
 *                   type: string
 *                 tenantName:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 method:
 *                   type: string
 *                 status:
 *                   type: string
 *                 paidAt:
 *                   type: string
 *                 txnId:
 *                   type: string
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/payments/:paymentId', billingController.getPayment);

/**
 * @swagger
 * /billing/payments:
 *   post:
 *     summary: Create new payment
 *     tags: [Billing]

 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - billingId
 *               - tenantId
 *               - amount
 *               - method
 *               - status
 *             properties:
 *               billingId:
 *                 type: string
 *                 description: Billing ID
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               method:
 *                 type: string
 *                 description: Payment method
 *               status:
 *                 type: string
 *                 description: Payment status
 *               txnId:
 *                 type: string
 *                 description: Transaction ID (optional)
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/payments', billingController.postPayment);

/**
 * @swagger
 * /billing/revenue-trends:
 *   get:
 *     summary: Get revenue trends
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Revenue trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenueTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       revenue:
 *                         type: number
 *                       invoiceCount:
 *                         type: integer
 *                 totalRevenue:
 *                   type: number
 *                 averageMonthlyRevenue:
 *                   type: number
 *                 totalInvoices:
 *                   type: integer
 *                 changeFromLastMonth:
 *                   type: number
 *       500:
 *         description: Internal server error
 */
router.get('/revenue-trends', billingController.getRevenueTrends);

/**
 * @swagger
 * /billing/invoices/{invoiceNumber}/download:
 *   get:
 *     summary: Download invoice as PDF
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice number
 *     responses:
 *       200:
 *         description: Invoice PDF downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 *       500:
 *         description: Internal server error
 */
router.get('/invoices/:invoiceNumber/download', billingController.downloadInvoice);

/**
 * @swagger
 * /billing/admin/invoices:
 *   post:
 *     summary: Admin - Create new invoice
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/admin/invoices',  billingController.adminCreateInvoice);

/**
 * @swagger
 * /billing/recent-activity:
 *   get:
 *     summary: Get recent payment activity
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Recent payment activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   method:
 *                     type: string
 *                   txnId:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   date:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
router.get('/recent-activity',  billingController.getRecentPaymentActivity);

module.exports = router; 