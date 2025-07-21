const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
//const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
//router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing and invoice statistics
 */

/**
 * @swagger
 * /billing/stats:
 *   get:
 *     summary: Get billing statistics
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional tenant ID to filter billing stats
 *     responses:
 *       200:
 *         description: Billing statistics summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   example: 12345.67
 *                 pendingAmount:
 *                   type: number
 *                   example: 2345.00
 *                 overdueAmount:
 *                   type: number
 *                   example: 1200.00
 *                 paidInvoices:
 *                   type: integer
 *                   example: 89
 *                 totalInvoices:
 *                   type: integer
 *                   example: 100
 *                 paidPercentage:
 *                   type: integer
 *                   example: 89
 *                 stats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       value:
 *                         type: number
 *                       change:
 *                         type: string
 *                       changeType:
 *                         type: string
 *                       description:
 *                         type: string
 */

/**
 * @swagger
 * /billing/admin/invoices:
 *   get:
 *     summary: Get all invoices (admin)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by invoice number or tenant name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: false
 *         description: Invoice status (all, paid, pending, overdue)
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *         required: false
 *         description: Plan name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         required: false
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *         required: false
 *         description: Sort order (asc, desc)
 *     responses:
 *       200:
 *         description: List of invoices with pagination
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
 *                       id: { type: string }
 *                       tenantName: { type: string }
 *                       tenantEmail: { type: string }
 *                       invoiceNumber: { type: string }
 *                       amount: { type: number }
 *                       currency: { type: string }
 *                       status: { type: string }
 *                       dueDate: { type: string }
 *                       issueDate: { type: string }
 *                       paidDate: { type: string }
 *                       plan: { type: string }
 *                       billingCycle: { type: string }
 *                       description: { type: string }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     totalItems: { type: integer }
 *                     itemsPerPage: { type: integer }
 */

/**
 * @swagger
 * /billing/admin/invoice:
 *   post:
 *     summary: Create a billing invoice for a tenant (admin)
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID
 *     responses:
 *       201:
 *         description: Created invoice
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 tenantName: { type: string }
 *                 tenantEmail: { type: string }
 *                 invoiceNumber: { type: string }
 *                 amount: { type: number }
 *                 currency: { type: string }
 *                 status: { type: string }
 *                 dueDate: { type: string }
 *                 issueDate: { type: string }
 *                 paidDate: { type: string }
 *                 plan: { type: string }
 *                 billingCycle: { type: string }
 *                 description: { type: string }
 */

/**
 * @swagger
 * /billing/payments:
 *   get:
 *     summary: Get all payments (optionally filtered by tenant, paginated)
 *     tags: [Billing]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional tenant ID to filter payments. If not provided, returns all payments for all tenants.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by transaction ID, method, status, invoice number, or tenant name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by payment status (paid, pending, failed, all)
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *         required: false
 *         description: "(Reserved for future use: filter by plan)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: "Items per page (default: 20)"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         required: false
 *         description: "Field to sort by (default: paidAt)"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *         required: false
 *         description: "Sort order (asc or desc, default: desc)"
 *     responses:
 *       200:
 *         description: List of payments and total amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAmount:
 *                   type: number
 *                   example: 1200.00
 *                 Completed:
 *                   type: integer
 *                   example: 5
 *                 Pending:
 *                   type: integer
 *                   example: 2
 *                 Failed:
 *                   type: integer
 *                   example: 1
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       billingId: { type: string }
 *                       invoiceNumber: { type: string }
 *                       tenantId: { type: string }
 *                       tenantName: { type: string }
 *                       amount: { type: number }
 *                       method: { type: string }
 *                       status: { type: string }
 *                       paidAt: { type: string, format: date-time }
 *                       txnId: { type: string }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     totalItems: { type: integer }
 *                     itemsPerPage: { type: integer }
 */

/**
 * @swagger
 * /billing/payment:
 *   get:
 *     summary: Get a single payment by ID
 *     tags: [Billing]
 *     parameters:
 *       - in: query
 *         name: paymentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 billingId: { type: string }
 *                 invoiceNumber: { type: string }
 *                 tenantId: { type: string }
 *                 tenantName: { type: string }
 *                 amount: { type: number }
 *                 method: { type: string }
 *                 status: { type: string }
 *                 paidAt: { type: string, format: date-time }
 *                 txnId: { type: string }
 */

/**
 * @swagger
 * /billing/payment:
 *   post:
 *     summary: Create a new payment
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               billingId:
 *                 type: string
 *                 description: Billing (invoice) ID
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               method:
 *                 type: string
 *                 description: Payment method (creditcard, upi, banktransfer, etc.)
 *               status:
 *                 type: string
 *                 description: Payment status (paid, pending, overdue)
 *               txnId:
 *                 type: string
 *                 description: Transaction/reference ID (optional)
 *     responses:
 *       201:
 *         description: Created payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 billingId: { type: string }
 *                 invoiceNumber: { type: string }
 *                 tenantId: { type: string }
 *                 tenantName: { type: string }
 *                 amount: { type: number }
 *                 method: { type: string }
 *                 status: { type: string }
 *                 paidAt: { type: string, format: date-time }
 *                 txnId: { type: string }
 */

/**
 * @swagger
 * /billing/revenue-trends:
 *   get:
 *     summary: Get monthly revenue trends (optionally filtered by tenant)
 *     tags: [Billing]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional tenant ID to filter revenue trends
 *     responses:
 *       200:
 *         description: Revenue trends and summary
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
 *                       month: { type: string, example: "Jan 2024" }
 *                       revenue: { type: number, example: 1397 }
 *                       invoiceCount: { type: integer, example: 3 }
 *                 totalRevenue: { type: number, example: 3393 }
 *                 averageMonthlyRevenue: { type: number, example: 565.5 }
 *                 totalInvoices: { type: integer, example: 7 }
 *                 changeFromLastMonth: { type: number, example: 0.0 }
 */

/**
 * @swagger
 * /billing/admin/invoice/download:
 *   get:
 *     summary: Download invoice as PDF (admin)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: invoice_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Invoice number to download
 *     responses:
 *       200:
 *         description: PDF file of the invoice
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing or invalid invoice_number
 *       500:
 *         description: Server error
 */
router.get('/admin/invoice/download', billingController.downloadInvoice);

/**
 * @swagger
 * /billing/admin/invoice/send-email:
 *   post:
 *     summary: Send invoice email (admin)
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoice_number:
 *                 type: string
 *                 description: Invoice number to send
 *     responses:
 *       200:
 *         description: Invoice email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       400:
 *         description: Missing or invalid invoice_number
 *       500:
 *         description: Server error
 */
router.post('/admin/invoice/send-email', billingController.sendInvoiceEmail);


// GET /billing/stats
router.get('/stats', billingController.getBillingStats);
// GET /billing/admin/invoices
router.get('/admin/invoices', billingController.adminGetInvoices);
// POST /billing/admin/invoice
router.post('/admin/invoice', billingController.adminCreateInvoice);
router.get('/payments', billingController.getPayments);
router.get('/payment', billingController.getPayment);
router.post('/payment', billingController.postPayment);
router.get('/revenue-trends', billingController.getRevenueTrends);

module.exports = router; 