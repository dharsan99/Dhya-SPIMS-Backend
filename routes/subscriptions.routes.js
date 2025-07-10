const express = require('express');
const router = express.Router();
const subscriptionsController = require('../controllers/subscriptions.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');

router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription management
 */
/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional tenant ID to filter subscriptions
 *     responses:
 *       200:
 *         description: Subscription list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   plan:
 *                     type: string
 *                   renewalDate:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   billingCycle:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   updated_at:
 *                     type: string
 */
router.get('/', subscriptionsController.getSubscriptions);

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenantId:
 *                 type: string
 *               planId:
 *                 type: string
 *               plan_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', subscriptionsController.createSubscription);

/**
 * @swagger
 * /subscriptions/{id}:
 *   put:
 *     summary: Update a subscription
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan_id:
 *                 type: string
 *               plan_type:
 *                 type: string
 *               start_date:
 *                 type: string
 *               end_date:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', subscriptionsController.updateSubscription);

/**
 * @swagger
 * /subscriptions/{id}:
 *   delete:
 *     summary: Delete a subscription
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription deleted successfully
 *       400:
 *         description: Missing or invalid subscription ID
 *       500:
 *         description: Server error
 */
router.delete('/:id', subscriptionsController.deleteSubscription);

/**
 * @swagger
 * /subscriptions/event/{id}:
 *   post:
 *     summary: Handle subscription event (activated, canceled, renewed)
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 enum: [activated, canceled, renewed]
 *     responses:
 *       200:
 *         description: Event handled
 */
router.post('/event/:id', subscriptionsController.handleEvent);

/**
 * @swagger
 * /subscriptions/usage:
 *   get:
 *     summary: Get usage statistics for the current tenant
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Usage statistics
 */
router.get('/usage', subscriptionsController.getUsageStats);

/**
 * @swagger
 * /subscriptions/billing-history:
 *   get:
 *     summary: Get billing history for the current tenant
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Billing history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   date:
 *                     type: string
 *                   description:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   invoice:
 *                     type: string
 *                   paymentMethod:
 *                     type: string
 */
router.get('/billing-history', subscriptionsController.getBillingHistory);

/**
 * @swagger
 * /subscriptions/billing-history/tenant:
 *   get:
 *     summary: Get billing history for a tenant (by tenantId param or current user)
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         required: false
 *         description: Tenant ID to filter billing history (optional, defaults to current user)
 *     responses:
 *       200:
 *         description: Billing history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   date:
 *                     type: string
 *                   description:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   invoice:
 *                     type: string
 *                   paymentMethod:
 *                     type: string
 */
router.get('/billing-history/tenant', subscriptionsController.getBillingHistoryByTenantId);

module.exports = router;
