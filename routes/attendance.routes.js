const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const validateAttendance = require('../middlewares/attendance.validation');

const { verifyToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// 🔐 Apply middleware for all routes in this file
router.use(verifyToken);
router.use(requireRole('admin', 'hr'));

console.log('✅ Attendance routes loaded');

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       properties:
 *         employee_id:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date
 *         shift:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PRESENT, ABSENT, HALF_DAY, LEAVE]
 *         in_time:
 *           type: string
 *           format: date-time
 *         out_time:
 *           type: string
 *           format: date-time
 *         overtime_hours:
 *           type: number
 *         total_hours:
 *           type: number
 *         employee:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             department:
 *               type: string
 *             token_no:
 *               type: string
 *             shift_rate:
 *               type: number
 */

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance management APIs
 */

/**
 * @swagger
 * /attendance/export:
 *   get:
 *     summary: Export attendance for a specific month
 *     description: Returns downloadable JSON data for PDF/XLSX generation (handled in frontend).
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Month number (1-12)
 *         example: 5
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year of the attendance
 *         example: 2025
 *     responses:
 *       200:
 *         description: JSON file for attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Month or year missing
 *       500:
 *         description: Failed to export attendance
 */
router.get('/export', attendanceController.exportMonthlyAttendance);

/**
 * @swagger
 * /attendance/by-date:
 *   get:
 *     summary: Get attendance records for a specific date
 *     description: |
 *       Returns all attendance records for a given date (format: YYYY-MM-DD).
 *       Optionally filter by employee_id, shift, or status.
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         description: "Date to filter attendance (format: YYYY-MM-DD)"
 *         schema:
 *           type: string
 *           format: date
 *           example: 2025-06-01
 *       - in: query
 *         name: employee_id
 *         required: false
 *         description: Filter by employee ID
 *         schema:
 *           type: string
 *           example: 4487d2cb-966d-4cd4-b770-6e17d2036aa9
 *       - in: query
 *         name: shift
 *         required: false
 *         description: Filter by shift (e.g., morning, evening, night)
 *         schema:
 *           type: string
 *           example: morning
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter by attendance status (e.g., PRESENT, ABSENT, HALF_DAY)
 *         schema:
 *           type: string
 *           example: PRESENT
 *     responses:
 *       200:
 *         description: A list of attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   shift:
 *                     type: string
 *                   status:
 *                     type: string
 *                   overtime_hours:
 *                     type: number
 *       400:
 *         description: Missing or invalid date parameter
 *       500:
 *         description: Failed to fetch attendance
 */
router.get('/by-date', attendanceController.getAttendanceByDate);

/**
 * @swagger
 * /attendance/range:
 *   get:
 *     summary: Get attendance records between start and end dates
 *     tags:
 *       - Attendance
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *         example: '2025-06-01'
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *         example: '2025-06-09'
 *     responses:
 *       200:
 *         description: Attendance records between given dates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_id:
 *                     type: string
 *                     format: uuid
 *                     example: ca21fb9d-1bb5-4d7d-b3a5-e24c52caf93a
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: '2025-06-09'
 *                   status:
 *                     type: string
 *                     example: PRESENT
 *                   shift:
 *                     type: string
 *                     example: morning
 *                   in_time:
 *                     type: string
 *                     format: date-time
 *                     example: '2025-06-09T09:00:00Z'
 *                   out_time:
 *                     type: string
 *                     format: date-time
 *                     example: '2025-06-09T17:00:00Z'
 *                   overtime_hours:
 *                     type: number
 *                     format: float
 *                     example: 1.5
 *       400:
 *         description: Missing start or end date parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Start and end dates are required
 *       500:
 *         description: Failed to fetch attendance range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch attendance range
 */
router.get('/range', attendanceController.getAttendanceRange);

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
 *         description: List of attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   status:
 *                     type: string
 *                   overtime_hours:
 *                     type: number
 */
router.get('/', attendanceController.getAllAttendance);

/**
 * @swagger
 * /attendance/summary:
 *   get:
 *     summary: Get attendance summary (daily, weekly, or monthly)
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *         description: Type of summary to get
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for daily summary (YYYY-MM-DD)
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for weekly summary (YYYY-MM-DD)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for weekly summary (YYYY-MM-DD)
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: "^(0[1-9]|1[0-2])$"
 *         description: Month for monthly summary (MM format, e.g., 05 for May)
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *           pattern: "^[0-9]{4}$"
 *         description: Year for monthly summary (YYYY format)
 *     responses:
 *       200:
 *         description: Attendance summary based on type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [daily, weekly, monthly]
 *                 date:
 *                   type: string
 *                   format: date
 *                 start_date:
 *                   type: string
 *                   format: date
 *                 end_date:
 *                   type: string
 *                   format: date
 *                 month:
 *                   type: string
 *                 year:
 *                   type: string
 *                 attendanceSummary:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       employee_id:
 *                         type: string
 *                       employee_name:
 *                         type: string
 *                       department:
 *                         type: string
 *                       token_no:
 *                         type: string
 *                       shift_rate:
 *                         type: number
 *                       workingDays:
 *                         type: number
 *                       overtimeHours:
 *                         type: number
 *                       totalHours:
 *                         type: number
 *                       absents:
 *                         type: number
 *                       halfDays:
 *                         type: number
 *                       status:
 *                         type: string
 *                       in_time:
 *                         type: string
 *                         format: date-time
 *                       out_time:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/summary', attendanceController.getAttendanceSummary);

/**
 * @swagger
 * /attendance/daily-summary:
 *   get:
 *     summary: Get daily attendance summary
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for the attendance summary (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Summary of the attendance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                 total_employees:
 *                   type: integer
 *                 present:
 *                   type: integer
 *                 absent:
 *                   type: integer
 *                 total_overtime:
 *                   type: number
 *                 average_shift_hours:
 *                   type: number
 */
router.get('/daily-summary', attendanceController.getDailySummary);

/**
 * @swagger
 * /attendance/filter:
 *   get:
 *     summary: Get attendance records with optional filters
 *     description: Returns attendance records optionally filtered by employee ID, department, and shift.
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: employee_id
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by employee ID
 *         example: 4487d2cb-966d-4cd4-b770-6e17d2036aa9
 *       - in: query
 *         name: department
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by department
 *         example: Tamil
 *       - in: query
 *         name: shift
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by shift (e.g., morning, evening, night)
 *         example: morning
 *     responses:
 *       200:
 *         description: A list of attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_id:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   shift:
 *                     type: string
 *                   status:
 *                     type: string
 *                   in_time:
 *                     type: string
 *                     format: date-time
 *                   out_time:
 *                     type: string
 *                     format: date-time
 *                   overtime_hours:
 *                     type: number
 *                   employee:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       department:
 *                         type: string
 *       500:
 *         description: Failed to fetch attendance
 */
router.get('/filter', attendanceController.getFilteredAttendance);

/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Create a new attendance record
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee_id:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               shift:
 *                 type: string
 *               in_time:
 *                 type: string
 *                 format: date-time
 *               out_time:
 *                 type: string
 *                 format: date-time
 *               overtime_hours:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY, LEAVE]
 *     responses:
 *       201:
 *         description: Attendance record created
 *       400:
 *         description: Invalid input
 */
router.post('/', validateAttendance, attendanceController.createAttendance);

/**
 * @swagger
 * /attendance/mark-bulk:
 *   post:
 *     summary: Mark bulk attendance records for a specific date
 *     tags:
 *       - Attendance
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
 *                 example: '2025-04-09'
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - employee_id
 *                     - shift
 *                     - status
 *                   properties:
 *                     employee_id:
 *                       type: string
 *                       format: uuid
 *                       example: 4487d2cb-966d-4cd4-b770-6e17d2036aa9
 *                     shift:
 *                       type: string
 *                       example: morning
 *                     status:
 *                       type: string
 *                       example: PRESENT
 *                     in_time:
 *                       type: string
 *                       format: date-time
 *                       example: '2025-06-09T07:48:44.481Z'
 *                     out_time:
 *                       type: string
 *                       format: date-time
 *                       example: '2025-06-09T17:48:44.481Z'
 *                     overtime_hours:
 *                       type: number
 *                       format: float
 *                       example: 2
 *     responses:
 *       200:
 *         description: Bulk attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 markedCount:
 *                   type: integer
 *                   example: 3
 *       500:
 *         description: Failed to mark attendance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to mark attendance
 */
router.post('/mark-bulk', attendanceController.markAttendance);

/**
 * @swagger
 * /attendance/{employee_id}:
 *   put:
 *     summary: Update attendance records by employee ID
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shift:
 *                 type: string
 *               in_time:
 *                 type: string
 *                 format: date-time
 *               out_time:
 *                 type: string
 *                 format: date-time
 *               overtime_hours:
 *                 type: number
 *               total_hours:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY, LEAVE]
 *     responses:
 *       200:
 *         description: Attendance updated
 *       404:
 *         description: Attendance not found
 */
router.put('/:employee_id', attendanceController.updateAttendance);

/**
 * @swagger
 * /attendance/audit/{employee_id}:
 *   put:
 *     summary: Update attendance with audit fields
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shift:
 *                 type: string
 *               in_time:
 *                 type: string
 *                 format: date-time
 *               out_time:
 *                 type: string
 *                 format: date-time
 *               overtime_hours:
 *                 type: number
 *               total_hours:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, HALF_DAY, LEAVE]
 *     responses:
 *       200:
 *         description: Attendance updated with audit
 *       500:
 *         description: Failed to update attendance
 */
router.put('/audit/:employee_id', verifyToken, attendanceController.updateAttendanceWithAudit);

/**
 * @swagger
 * /attendance/{employee_id}:
 *   delete:
 *     summary: Delete attendance records by employee ID
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance deleted
 *       404:
 *         description: Attendance not found
 */
router.delete('/:employee_id', attendanceController.deleteAttendance);

module.exports = router;