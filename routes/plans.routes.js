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
 *           example: Starter
 *         price:
 *           type: number
 *           example: 0
 *         billingCycle:
 *           type: string
 *           example: trial
 *         description:
 *           type: string
 *           example: Basic 14-day trial plan
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Up to 5 users
 *             - Basic order management
 *             - Email support
 *             - 14-day trial
 *         maxUsers:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *           example: 5
 *         maxOrders:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *           example: 20
 *         maxStorage:
 *           type: string
 *           example: 2GB
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
