const attendanceService = require('../services/attendance.service');

// 1. Get all attendance (paginated, empid optional)
exports.getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, empid, date } = req.query;
    const result = await attendanceService.getAllAttendance({ page, limit, empid, date });
    res.json(result);
  } catch (error) {
    console.error('Error in getAllAttendance:', error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Update attendance by employee ID and date
exports.updateAttendance = async (req, res) => {
  try {
    const { empid } = req.params;
    const result = await attendanceService.updateAttendance(empid, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in updateAttendance:', error);
    res.status(500).json({ error: error.message });
  }
};

// 3. Delete all attendance for an employee
exports.deleteAttendance = async (req, res) => {
  try {
    const { empid } = req.params;
    const result = await attendanceService.deleteAttendance(empid);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteAttendance:', error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Get attendance by specific date
exports.getByDate = async (req, res) => {
  try {
    const { date, page = 1, limit = 10 } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    const result = await attendanceService.getByDate(date, { page, limit });
    res.json(result);
  } catch (error) {
    console.error('Error in getByDate:', error);
    res.status(500).json({ error: error.message });
  }
};

// 5. Get attendance by date range
exports.getByRange = async (req, res) => {
  try {
    const { start, end, page = 1, limit = 10 } = req.query;
    const result = await attendanceService.getByRange({ start, end, page, limit });
    res.json(result);
  } catch (error) {
    console.error('Error in getByRange:', error);
    res.status(500).json({ error: error.message });
  }
};

// 6. Bulk update attendance by date
exports.bulkUpdateAttendance = async (req, res) => {
  const { date, records } = req.body;

  try {
    console.log('bulkUpdateAttendance req.body:', JSON.stringify(req.body, null, 2));
    const result = await attendanceService.bulkUpdateAttendance(date, records);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 7. Get attendance summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const result = await attendanceService.getAttendanceSummary(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error in getAttendanceSummary:', error);
    res.status(500).json({ error: error.message });
  }
};

// 8. Get attendance range summary
exports.getAttendanceRangeSummary = async (req, res) => {
  try {
    // Map startDate/endDate to start/end for compatibility
    const query = { ...req.query };
    if (query.startDate && !query.start) query.start = query.startDate;
    if (query.endDate && !query.end) query.end = query.endDate;
    const result = await attendanceService.getAttendanceRangeSummary(query);
    res.json(result);
  } catch (error) {
    console.error('Error in getAttendanceRangeSummary:', error);
    res.status(500).json({ error: error.message });
  }
};

// 9. Get filtered attendance
exports.getFilteredAttendance = async (req, res) => {
  try {
    const result = await attendanceService.getFilteredAttendance(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error in getFilteredAttendance:', error);
    res.status(500).json({ error: error.message });
  }
};

// 10. Update attendance with audit trail
exports.updateAttendanceWithAudit = async (req, res) => {
  try {
    const { empid } = req.params;
    const updaterId = req.user?.id; // Get from auth middleware
    const result = await attendanceService.updateAttendanceWithAudit(empid, req.body, updaterId);
    res.json(result);
  } catch (error) {
    console.error('Error in updateAttendanceWithAudit:', error);
    res.status(500).json({ error: error.message });
  }
};

// 11. Bulk mark attendance (new API)
exports.markBulkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    
    // Validate required fields
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required and must not be empty' });
    }

    // Validate each record has required fields
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record.employeeId) {
        return res.status(400).json({ 
          error: `Record ${i + 1}: employeeId is required`,
          recordIndex: i 
        });
      }
      if (!record.status || !['PRESENT', 'ABSENT', 'HALF_DAY'].includes(record.status)) {
        return res.status(400).json({ 
          error: `Record ${i + 1}: status must be PRESENT, ABSENT, or HALF_DAY`,
          recordIndex: i 
        });
      }
    }

    // Call the service to upsert all records
    const processedRecords = await attendanceService.markBulkAttendance(date, records);

    // Check for any errors in processed records
    const errorRecords = processedRecords.filter(rec => rec.status === 'ERROR');
    if (errorRecords.length > 0) {
      return res.status(400).json({ 
        error: 'Some records failed to process',
        failedRecords: errorRecords,
        successfulRecords: processedRecords.filter(rec => rec.status !== 'ERROR')
      });
    }

    // Prepare bulk attendance report response with your rules
    const allowedShifts = ['SHIFT_1', 'SHIFT_2', 'SHIFT_3'];
    const report = processedRecords.map(rec => {
      // If status is ABSENT, omit shift in response
      if (rec.status === 'ABSENT') {
        const { shift, ...rest } = rec;
        return rest;
      }
      // If shift is not one of the three, set shift to null
      if (!allowedShifts.includes(rec.shift)) {
        return { ...rec, shift: null };
      }
      return rec;
    });

    res.json({ 
      date, 
      records: report,
      message: `Successfully processed ${processedRecords.length} attendance records`
    });
  } catch (error) {
    console.error('Error in markBulkAttendance:', error);
    res.status(500).json({ error: error.message });
  }
};

