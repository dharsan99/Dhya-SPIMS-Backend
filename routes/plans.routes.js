const express = require('express');
const router = express.Router();
const planController = require('../controllers/plans.controller');

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Plan management
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
 *           example: Enterprise
 *         price:
 *           type: number
 *           example: 199
 *         billingCycle:
 *           type: string
 *           example: month
 *         description:
 *           type: string
 *           example: For large mills with complex operations
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Unlimited employees
 *             - Full order management suite
 *             - Real-time production & inventory
 *             - 24/7 phone support
 *             - Unlimited storage
 *             - Custom analytics dashboard
 *             - Full API access
 *             - White-label solutions
 *             - Dedicated account manager
 *             - Custom training sessions
 *         maxUsers:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *           example: Unlimited
 *         maxOrders:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *           example: Unlimited
 *         maxStorage:
 *           type: string
 *           example: Unlimited
 *         popular:
 *           type: boolean
 *           example: false
 *     PlanOutputItem:
 *       allOf:
 *         - $ref: '#/components/schemas/PlanInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: enterprise
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get all plans
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: List of plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlanOutputItem'
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
 *               $ref: '#/components/schemas/PlanOutputItem'
 */
router.post('/', planController.createPlan);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanInput'
 *     responses:
 *       200:
 *         description: Plan updated
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
 *     responses:
 *       200:
 *         description: Plan deleted
 */
router.delete('/:id', planController.deletePlan);

module.exports = router;
