const attendanceService = require('../services/attendance.service');

exports.markAttendance = async (req, res) => {
  try {
    const result = await attendanceService.markAttendance(req.body); // pass full payload
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

exports.getAttendanceByDate = async (req, res) => {
    const { date } = req.query;
  
    if (!date) return res.status(400).json({ error: 'Date is required' });
  
    try {
      const data = await attendanceService.getAttendanceByDate(date);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  };


exports.exportMonthlyAttendance = async (req, res) => {
  try {
    const { data, filename } = await attendanceService.exportMonthlyAttendance(req.query);
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(400).json({ error: error.message || 'Failed to export attendance' });
  }
};

exports.updateAttendanceWithAudit = async (req, res) => {
  try {
    const employeeId = req.params.employee_id;
    const auditData = {
      ...req.body,
      last_updated_by: req.user?.id || 'system',
      updatedAt: new Date(),
    };
    
    const updated = await attendanceService.updateAttendanceWithAudit(employeeId, auditData);
    res.json({ message: 'Attendance updated with audit fields', count: updated.count });
  } catch (error) {
    console.error('Update Attendance with Audit Error:', error);
    res.status(500).json({ error: 'Failed to update attendance with audit' });
  }
};

exports.getAttendanceRangeSummary = async (req, res) => {
  try {
    const { date, startDate, endDate, month, year } = req.query;

    const summary = await attendanceService.getAttendanceRangeSummary({
      date,
      startDate,
      endDate,
      month,
      year,
    });

    res.json(summary);
  } catch (error) {
    console.error('Error in getAttendanceRangeSummary controller:', error);
    res.status(500).json({ error: error.message || 'Failed to get attendance summary' });
  }
};
