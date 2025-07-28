const attendanceService = require('../services/attendance.service');

// Example: getAllAttendance
exports.getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, empid } = req.query;
    const result = await attendanceService.getAllAttendance({ page, limit, empid });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: updateAttendance
exports.updateAttendance = async (req, res) => {
  try {
    const empid = req.params.empid;
    const result = await attendanceService.updateAttendance(empid, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: markBulkAttendance
exports.markBulkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    const result = await attendanceService.markBulkAttendance(date, records);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: deleteAttendance
exports.deleteAttendance = async (req, res) => {
  try {
    const empid = req.params.empid;
    const result = await attendanceService.deleteAttendance(empid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: getByDate
exports.getByDate = async (req, res) => {
  try {
    const { date, page = 1, limit = 10 } = req.query;
    const result = await attendanceService.getByDate(date, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: getByRange
exports.getByRange = async (req, res) => {
  try {
    const { start, end, page = 1, limit = 10 } = req.query;
    const result = await attendanceService.getByRange(start, end, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: getAttendanceSummary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { date, start, end, month, year, page = 1, limit = 10 } = req.query;
    const result = await attendanceService.getAttendanceSummary({ date, start, end, month, year, page, limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: getAttendanceRangeSummary
exports.getAttendanceRangeSummary = async (req, res) => {
  try {
    const { date, start, end, month, year, page = 1, limit = 10 } = req.query;
    const result = await attendanceService.getAttendanceRangeSummary({ date, start, end, month, year, page, limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: getFilteredAttendance
exports.getFilteredAttendance = async (req, res) => {
  try {
    const { shift, status, empid, department, page = 1, limit = 10 } = req.query;
    const result = await attendanceService.getFilteredAttendance({ shift, status, empid, department, page, limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Example: updateAttendanceWithAudit
exports.updateAttendanceWithAudit = async (req, res) => {
  try {
    const empid = req.params.empid;
    const updaterId = req.user ? req.user.id : null;
    const result = await attendanceService.updateAttendanceWithAudit(empid, req.body, updaterId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

