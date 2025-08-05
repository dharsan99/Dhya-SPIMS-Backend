const express = require('express');
const router = express.Router();
const planController = require('../controllers/plans.controller');

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Plan management operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PlanInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - billingCycle
 *         - features
 *         - maxUsers
 *         - maxOrders
 *         - maxStorage
 *         - popular
 *       properties:
 *         name:
 *           type: string
 *           example: Starter
 *           description: Plan name
 *         price:
 *           type: number
 *           example: 0
 *           description: Plan price
 *         billingCycle:
 *           type: string
 *           enum: [trial, month, year]
 *           example: trial
 *           description: Billing cycle for the plan
 *         description:
 *           type: string
 *           example: Basic 14-day trial plan
 *           description: Plan description
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Up to 5 users
 *             - Basic order management
 *             - Email support
 *             - 14-day trial
 *           description: List of plan features
 *         maxUsers:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *           example: 5
 *           description: Maximum number of users allowed
 *         maxOrders:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *           example: 20
 *           description: Maximum number of orders allowed
 *         maxStorage:
 *           type: string
 *           example: 2GB
 *           description: Maximum storage allowed
 *         popular:
 *           type: boolean
 *           example: false
 *           description: Whether this plan is marked as popular
 *         isActive:
 *           type: boolean
 *           example: true
 *           description: Whether the plan is active
 *     PlanOutputItem:
 *       allOf:
 *         - $ref: '#/components/schemas/PlanInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: 123e4567-e89b-12d3-a456-426614174000
 *             expiryDate:
 *               type: string
 *               format: date-time
 *               description: Plan expiry date
 *             renewalDate:
 *               type: string
 *               format: date-time
 *               description: Plan renewal date
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Plan creation date
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Plan last update date
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get all active plans
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlanOutputItem'
 *       500:
 *         description: Internal server error
 */
router.get('/', planController.getAllPlans);

/**
 * @swagger
 * /plans:
 *   post:
 *     summary: Create a new plan
 *     tags: [Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanInput'
 *     responses:
 *       201:
 *         description: Plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 plan:
 *                   $ref: '#/components/schemas/PlanOutputItem'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', planController.createPlan);

/**
 * @swagger
 * /plans/{id}:
 *   get:
 *     summary: Get plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 plan:
 *                   $ref: '#/components/schemas/PlanOutputItem'
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', planController.getPlanById);

/**
 * @swagger
 * /plans/{id}:
 *   put:
 *     summary: Update plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanInput'
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 plan:
 *                   $ref: '#/components/schemas/PlanOutputItem'
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', planController.updatePlan);

/**
 * @swagger
 * /plans/{id}:
 *   delete:
 *     summary: Delete plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Plan not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', planController.deletePlan);

module.exports = router;
