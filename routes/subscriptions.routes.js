const express = require('express');
const router = express.Router();
const subscriptionsController = require('../controllers/subscriptions.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');

router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription management operations
 */

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Get all subscriptions with optional tenant filtering
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Optional tenant ID to filter subscriptions
 *     responses:
 *       200:
 *         description: Subscription list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       tenantId:
 *                         type: string
 *                         format: uuid
 *                       planId:
 *                         type: string
 *                         format: uuid
 *                       plan:
 *                         type: string
 *                       planType:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date
 *                       endDate:
 *                         type: string
 *                         format: date
 *                       renewalDate:
 *                         type: string
 *                         format: date
 *                       amount:
 *                         type: number
 *                       billingCycle:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
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
 *             required:
 *               - tenantId
 *               - planId
 *             properties:
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *                 description: Tenant ID for the subscription
 *               planId:
 *                 type: string
 *                 format: uuid
 *                 description: Plan ID to subscribe to
 *               planType:
 *                 type: string
 *                 description: Optional plan type identifier
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     tenantId:
 *                       type: string
 *                       format: uuid
 *                     planId:
 *                       type: string
 *                       format: uuid
 *                     planType:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     isActive:
 *                       type: boolean
 *                     plan:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         price:
 *                           type: number
 *                         billingCycle:
 *                           type: string
 *                         renewalDate:
 *                           type: string
 *                           format: date
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *                 description: New plan ID
 *               planType:
 *                 type: string
 *                 description: New plan type
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: New start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: New end date
 *               isActive:
 *                 type: boolean
 *                 description: Whether the subscription is active
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     tenantId:
 *                       type: string
 *                       format: uuid
 *                     planId:
 *                       type: string
 *                       format: uuid
 *                     planType:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     isActive:
 *                       type: boolean
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
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
 *             required:
 *               - event
 *             properties:
 *               event:
 *                 type: string
 *                 enum: [activated, canceled, renewed]
 *                 description: Event type to handle
 *     responses:
 *       200:
 *         description: Event handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     isActive:
 *                       type: boolean
 *                     endDate:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Invalid event type or missing event
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.post('/event/:id', subscriptionsController.handleEvent);

/**
 * @swagger
 * /subscriptions/usage:
 *   get:
 *     summary: Get usage statistics for the current tenant
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Optional tenant ID to filter usage stats (if not using authentication)
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 usage:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         trend:
 *                           type: string
 *                     apiCalls:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         trend:
 *                           type: string
 *                     users:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         trend:
 *                           type: string
 *                     storage:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: string
 *                         trend:
 *                           type: string
 *                 period:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       format: date
 *                     end:
 *                       type: string
 *                       format: date
 *       400:
 *         description: Missing tenant ID
 *       500:
 *         description: Internal server error
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
 *         description: Billing history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billingHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       date:
 *                         type: string
 *                         format: date
 *                       description:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [paid, unpaid]
 *                       invoice:
 *                         type: string
 *                       paymentMethod:
 *                         type: string
 *       400:
 *         description: Missing tenant ID
 *       500:
 *         description: Internal server error
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
 *           format: uuid
 *         required: false
 *         description: Tenant ID to filter billing history (optional, defaults to current user)
 *     responses:
 *       200:
 *         description: Billing history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 billingHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       date:
 *                         type: string
 *                         format: date
 *                       description:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [paid, unpaid]
 *                       invoice:
 *                         type: string
 *                       paymentMethod:
 *                         type: string
 *       400:
 *         description: Missing tenant ID
 *       500:
 *         description: Internal server error
 */
router.get('/billing-history/tenant', subscriptionsController.getBillingHistoryByTenantId);

module.exports = router;
