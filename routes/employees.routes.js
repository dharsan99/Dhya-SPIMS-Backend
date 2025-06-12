
// routes/employee.routes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employees.controller');

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, aadhar_no, bank_acc_1]
 *             properties:
 *               name: { type: string }
 *               aadhar_no: { type: string }
 *               bank_acc_1: { type: string }
 *               bank_acc_2: { type: string }
 *               department: { type: string }
 *               join_date: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', employeeController.createEmployee);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Get all employees
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get('/', employeeController.getAllEmployees);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Single employee
 */
router.get('/:id', employeeController.getEmployeeById);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update an employee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', employeeController.updateEmployee);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete an employee
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
