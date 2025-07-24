// attendance.routes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const validate = require('../middlewares/attendance.validation');
//const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');

// Add a public test route for debugging
// @swagger-ignore
router.get('/test', (req, res) => {
  res.json({ message: 'Attendance routes are working!' });
});

// For development/testing - allow public access to GET endpoints
const isDevelopment = process.env.NODE_ENV !== 'production';

// Public routes for development
if (isDevelopment) {
  // @swagger-ignore
  router.get('/', validate.validateQueryParams, attendanceController.getAllAttendance);
  // @swagger-ignore
  router.get('/by-date', validate.validateQueryParams, attendanceController.getByDate);
  // @swagger-ignore
  router.get('/range', validate.validateQueryParams, attendanceController.getByRange);
  // @swagger-ignore
  router.get('/summary', validate.validateQueryParams, attendanceController.getAttendanceSummary);
  // @swagger-ignore
  router.get('/summary/range', validate.validateQueryParams, attendanceController.getAttendanceRangeSummary);
  // @swagger-ignore
  router.get('/filter', validate.validateQueryParams, attendanceController.getFilteredAttendance);
}

// Protected routes (require authentication)
//router.use(verifyTokenAndTenant);

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance Management APIs
 */
/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Get all attendance records
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *       - in: query
 *         name: empid
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attendance records
 */
router.get('/', validate.validateQueryParams, attendanceController.getAllAttendance);

/**
 * @swagger
 * /attendance/{empid}:
 *   put:
 *     summary: Update attendance for specific employee and date
 *     description: |
 *       Updates or creates attendance record for an employee on a specific date. In/out times are automatically set based on shift type.
 *       
 *       - If `status` is `ABSENT`, `shift` is not required and can be empty, null, or any value.
 *       - If `shift` is not one of `SHIFT_1`, `SHIFT_2`, `SHIFT_3`, the record will be treated as `ABSENT` regardless of the provided status.
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: empid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - status
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *                 description: Date in YYYY-MM-DD format
 *               shift:
 *                 type: string
 *                 enum: [SHIFT_1, SHIFT_2, SHIFT_3]
 *                 description: Shift type (not required if status is ABSENT)
 *               overtime_hours:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 24
 *                 default: 0
 *                 description: Overtime hours worked
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY]
 *                 description: Attendance status (PRESENT=8hrs, HALF_DAY=4hrs, ABSENT=0hrs)
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     employee_id:
 *                       type: string
 *                     date:
 *                       type: string
 *                     shift:
 *                       type: string
 *                     in_time:
 *                       type: string
 *                     out_time:
 *                       type: string
 *                     overtime_hours:
 *                       type: number
 *                     total_hours:
 *                       type: number
 *                     status:
 *                       type: string
 */
/**
 * @swagger
 * /attendance/mark-bulk:
 *   put:
 *     summary: Bulk mark attendance for multiple employees on a specific date
 *     description: |
 *       Bulk upsert attendance for multiple employees on a given date.
 *       
 *       - If `status` is `ABSENT`, `shift` is not required and will be omitted in the response.
 *       - If `shift` is not one of `SHIFT_1`, `SHIFT_2`, `SHIFT_3`, it will be set to null in the response.
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - records
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-12"
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - employee_id
 *                     - status
 *                   properties:
 *                     employee_id:
 *                       type: string
 *                       format: uuid
 *                     shift:
 *                       type: string
 *                       example: "SHIFT_1"
 *                       description: Shift type (not required if status is ABSENT)
 *                     status:
 *                       type: string
 *                       enum: [PRESENT, ABSENT, HALF_DAY]
 *                     overtime_hours:
 *                       type: number
 *                       default: 0
 *     responses:
 *       200:
 *         description: Bulk attendance marked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                 records:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       employee_id:
 *                         type: string
 *                       shift:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                       overtime_hours:
 *                         type: number
 */
router.put('/mark-bulk', validate.bulkUpdateAttendance, attendanceController.markBulkAttendance);

router.put('/:empid', validate.updateAttendance, attendanceController.updateAttendance);

/**
 * @swagger
 * /attendance/{empid}:
 *   delete:
 *     summary: Delete all attendance records for an employee
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: empid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Attendance records deleted successfully
 */
router.delete('/:empid', attendanceController.deleteAttendance);

/**
 * @swagger
 * /attendance/by-date:
 *   get:
 *     summary: Get attendance records for a specific date
 *     description: Returns all employees with their attendance status for the specified date. Employees without attendance records show as ABSENT. Includes pagination and all attendance statuses (PRESENT, ABSENT, HALF_DAY).
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-15"
 *         description: Date in YYYY-MM-DD format
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
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Attendance list for the date with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       employee_id:
 *                         type: string
 *                       employee:
 *                         type: object
 *                         properties:
 *                           token_no:
 *                             type: string
 *                           name:
 *                             type: string
 *                           department:
 *                             type: string
 *                           shift_rate:
 *                             type: string
 *                       attendance:
 *                         type: object
 *                         additionalProperties:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [PRESENT, ABSENT, HALF_DAY]
 *                             in_time:
 *                               type: string
 *                               format: time
 *                             out_time:
 *                               type: string
 *                               format: time
 *                             total_hours:
 *                               type: number
 *                             overtime_hours:
 *                               type: number
 */
router.get('/by-date', attendanceController.getByDate);

/**
 * @swagger
 * /attendance/range:
 *   get:
 *     summary: Get attendance records by date range
 *     description: Returns all attendance records within the specified date range. Includes all attendance statuses (PRESENT, ABSENT, HALF_DAY) with pagination.
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-01"
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-31"
 *         description: End date in YYYY-MM-DD format
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
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Attendance records in date range with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       employee_id:
 *                         type: string
 *                       employee:
 *                         type: object
 *                         properties:
 *                           token_no:
 *                             type: string
 *                           name:
 *                             type: string
 *                           shift_rate:
 *                             type: string
 *                           department:
 *                             type: string
 *                       attendance:
 *                         type: object
 *                         additionalProperties:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [PRESENT, ABSENT, HALF_DAY]
 *                             in_time:
 *                               type: string
 *                               format: time
 *                             out_time:
 *                               type: string
 *                               format: time
 *                             total_hours:
 *                               type: number
 *                             overtime_hours:
 *                               type: number
 */
router.get('/range', validate.validateQueryParams, attendanceController.getByRange);

/**
 * @swagger
 * /attendance/summary:
 *   get:
 *     summary: Get detailed attendance summary
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Attendance summary
 */
// @swagger-ignore
router.get('/summary', validate.validateQueryParams, attendanceController.getAttendanceSummary);

/**
 * @swagger
 * /attendance/summary-range:
 *   get:
 *     summary: Get attendance summary (daily, monthly, or custom range)
 *     description: |
 *       Returns a summary of attendance for a single date, a custom date range, or a specific month/year.
 *       
 *       **Preferred query parameters:**
 *         - `start` (YYYY-MM-DD): Start date for custom range
 *         - `end` (YYYY-MM-DD): End date for custom range
 *         - `date` (YYYY-MM-DD): Single date for daily summary
 *         - `month` (1-12) and `year` (e.g., 2025): For monthly summary
 *       
 *       **Compatibility:**
 *         - `startDate` and `endDate` are also accepted as aliases for `start` and `end`.
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Single date (YYYY-MM-DD) for daily summary
 *       - in: query
 *         name: start
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD) for custom range summary
 *       - in: query
 *         name: end
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD) for custom range summary
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12) for monthly summary
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2025) for monthly summary
 *     responses:
 *       200:
 *         description: Summary of the attendance for the given date, range, or month/year
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary_type:
 *                   type: string
 *                   example: "daily"
 *                 range:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       format: date
 *                       example: "2025-06-01"
 *                     end:
 *                       type: string
 *                       format: date
 *                       example: "2025-06-15"
 *                 total_employees:
 *                   type: integer
 *                   example: 10
 *                 present:
 *                   type: integer
 *                   example: 8
 *                 absent:
 *                   type: integer
 *                   example: 2
 *                 total_overtime:
 *                   type: number
 *                   format: float
 *                   example: 12.5
 *                 average_shift_hours:
 *                   type: number
 *                   format: float
 *                   example: 7.75
 *       400:
 *         description: Missing or invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/summary-range', validate.validateQueryParams, attendanceController.getAttendanceRangeSummary);

// @swagger-ignore
/**
 * @swagger
 * /attendance/filter:
 *   get:
 *     summary: Filter attendance records by multiple criteria
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *           enum: [SHIFT_1, SHIFT_2, SHIFT_3]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PRESENT, ABSENT, HALF_DAY]
 *       - in: query
 *         name: empid
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Filtered attendance records
 */
// @swagger-ignore
router.get('/filter', validate.validateQueryParams, attendanceController.getFilteredAttendance);

// @swagger-ignore
/**
 * @swagger
 * /attendance/audit/{empid}:
 *   put:
 *     summary: Update attendance with audit trail
 *     description: Updates attendance for today's date and tracks who made the update
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: empid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shift
 *               - status
 *             properties:
 *               shift:
 *                 type: string
 *                 enum: [SHIFT_1, SHIFT_2, SHIFT_3]
 *               overtime_hours:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 24
 *                 default: 0
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY]
 *     responses:
 *       200:
 *         description: Attendance updated with audit trail
 */
// @swagger-ignore
router.put('/audit/:empid', validate.updateAttendance, attendanceController.updateAttendanceWithAudit);

module.exports = router;
