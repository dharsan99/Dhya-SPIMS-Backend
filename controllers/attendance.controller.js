const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const attendanceService = require('../services/attendance.service');

exports.markAttendance = async (req, res) => {
  try {
    const result = await attendanceService.markAttendance(req.body); // pass full payload
    res.json(result);
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

exports.getAttendanceByDate = async (req, res) => {
  const { date, employee_id, shift, status } = req.query;

  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    const data = await attendanceService.getAttendanceByDate({
      date,
      employee_id,
      shift,
      status,
    });
    res.json(data);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};



  
  exports.getAttendanceRange = async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required' });
  
    try {
      const data = await attendanceService.getAttendanceRange(start, end);
      res.json(data);
    } catch (err) {
      console.error('Error fetching range:', err);
      res.status(500).json({ error: 'Failed to fetch attendance range' });
    }
  };


  exports.getAllAttendance = async (req, res) => {
try {
    // Parse page and limit from query params, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get paginated data + total count from service
    const { total, data } = await attendanceService.getAllAttendance({ skip, take: limit });

    // Format data as you did before
    const formatted = data.map(a => ({
      employee_id: a.employee_id,
      name: a.employee?.name || '',
      date: a.date,
      status: a.status,
      overtime_hours: a.overtime_hours,
    }));

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: formatted,
    });
  } catch (err) {
    console.error('Error fetching attendance with pagination:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.createAttendance = async (req, res) => {
  try {
    const { employee_id, date, shift, in_time, out_time, overtime_hours, status } = req.body;

    const inTime = new Date(in_time);
    const outTime = new Date(out_time);

    const workingHours = (outTime - inTime) / (1000 * 60 * 60);
    const total_hours = parseFloat((workingHours + overtime_hours).toFixed(2));

    const attendance = await prisma.attendance.create({
      data: {
        employee_id,
        date: new Date(date),
        shift,
        in_time: inTime,
        out_time: outTime,
        overtime_hours,
        total_hours,
        status
      }
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error('Create Attendance Error:', error);
    res.status(500).json({ error: 'Failed to create attendance' });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const employeeId = req.params.employee_id;
    const updated = await attendanceService.updateAttendance(employeeId, req.body);
    res.json({ message: 'Attendance updated', count: updated.count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const employeeId = req.params.employee_id;
    const deleted = await attendanceService.deleteAttendance(employeeId);
    res.json({ message: 'Attendance deleted', count: deleted.count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};


exports.getAttendanceSummary = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year || !/^(0[1-9]|1[0-2])$/.test(month) || !/^\d{4}$/.test(year)) {
    return res.status(400).json({ error: 'Month and Year are required and must be valid' });
  }

  try {
    const summary = await attendanceService.getAttendanceSummary({ month, year });
    res.json(summary);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
};

exports.getFilteredAttendance = async (req, res) => {
  const { employee_id, department, shift } = req.query;

  try {
    const data = await attendanceService.getFilteredAttendance({ employee_id, department, shift });
    res.json(data);
  } catch (err) {
    console.error('Error fetching filtered attendance:', err); // ✅ Make sure this line exists
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};


exports.exportMonthlyAttendance = async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  try {
    const data = await attendanceService.getAttendanceByMonthYear(parseInt(month), parseInt(year));

    res.setHeader('Content-Disposition', `attachment; filename=attendance-${year}-${month}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error exporting attendance:', err);
    res.status(500).json({ error: 'Failed to export attendance' });
  }
};
