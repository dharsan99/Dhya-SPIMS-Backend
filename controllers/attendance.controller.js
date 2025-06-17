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
  const { date } = req.query;
  console.log('[🛠️ LOG] GET /attendance/by-date', date);

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    const data = await attendanceService.getAttendanceByDate(date);
    
    // Set cache headers
    const cacheControl = 'public, max-age=300'; // Cache for 5 minutes
    res.set('Cache-Control', cacheControl);
    res.set('ETag', `"${Buffer.from(JSON.stringify(data)).toString('base64')}"`);
    
    // Check if client has cached version
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch === res.get('ETag')) {
      return res.status(304).end();
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    if (err.message === 'Invalid date format') {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }
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