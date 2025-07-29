// attendance.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fixed shift timings
const SHIFT_TIMES = {
  SHIFT_1: { start: '06:00:00', end: '14:00:00' },
  SHIFT_2: { start: '14:00:00', end: '22:00:00' },
  SHIFT_3: { start: '22:00:00', end: '06:00:00' }
};

// Helper function to parse date as local midnight (IST)
const parseLocalDate = (dateString) => {
  // Parse the date string and create a local date object
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // month is 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format time as HH:MM:SS
const formatTime = (date) => {
  return date.toTimeString().split(' ')[0];
};

// Helper function to create shift times based on shift type and date
const createShiftTimes = (shift, date) => {
  const shiftTime = SHIFT_TIMES[shift];
  if (!shiftTime) {
    throw new Error(`Invalid shift: ${shift}`);
  }

  const baseDate = parseLocalDate(date);
  
  // Parse start time
  const [startHour, startMin, startSec] = shiftTime.start.split(':').map(Number);
  const inTime = new Date(baseDate);
  inTime.setHours(startHour, startMin, startSec, 0);

  // Parse end time
  const [endHour, endMin, endSec] = shiftTime.end.split(':').map(Number);
  const outTime = new Date(baseDate);
  
  // Handle SHIFT_3 which goes to next day
  if (shift === 'SHIFT_3') {
    outTime.setDate(outTime.getDate() + 1);
  }
  outTime.setHours(endHour, endMin, endSec, 0);

  return { inTime, outTime };
};

// Helper function to calculate total hours based on status
const calculateTotalHours = (status, overtimeHours = 0) => {
  switch (status) {
    case 'PRESENT':
      return 8 + overtimeHours;
    case 'HALF_DAY':
      return 4 + overtimeHours;
    case 'ABSENT':
      return 0;
    default:
      return 0;
  }
};

// Helper to check valid shift
const isValidShift = (shift) => ['SHIFT_1', 'SHIFT_2', 'SHIFT_3'].includes(shift);

exports.getAllAttendance = async ({ page = 1, limit = 10, empid, date } = {}) => {
  try {
    const skip = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    // Get all employees
    const employees = await prisma.employee.findMany({
      where: empid ? { id: empid } : {},
      orderBy: { name: 'asc' }
    });

    // If date is provided, get attendance for that specific date
    if (date) {
      const targetDate = parseLocalDate(date);
      
      // Get existing attendance records for the date
      const existingAttendance = await prisma.attendance.findMany({
        where: {
          date: targetDate,
          ...(empid ? { employeeId: empid } : {})
        },
        include: { employee: true }
      });

      // Create a map of existing attendance by employeeId
      const attendanceMap = new Map();
      existingAttendance.forEach(att => {
        attendanceMap.set(att.employeeId, att);
      });

      // Map employees with their attendance status
      const result = employees.map(emp => {
        const existingAtt = existingAttendance.find(att => att.employeeId === emp.id);
        
        if (existingAtt) {
          return {
            employeeId: emp.id,
            employee: {
              name: emp.name,
              tokenNo: emp.tokenNo,
              department: emp.department,
              shiftRate: emp.shiftRate,
            },
            attendance: {
              status: existingAtt.status,
              inTime: formatTime(existingAtt.inTime),
              outTime: formatTime(existingAtt.outTime),
              overtimeHours: existingAtt.overtimeHours,
              totalHours: existingAtt.totalHours,
            }
          };
        } else {
          return {
            employeeId: emp.id,
            employee: {
              name: emp.name,
              tokenNo: emp.tokenNo,
              department: emp.department,
              shiftRate: emp.shiftRate,
            },
            attendance: {
              status: 'ABSENT',
              inTime: '00:00:00',
              outTime: '00:00:00',
              overtimeHours: 0,
              totalHours: 0,
            }
          };
        }
      });

      // Apply pagination
      const total = result.length;
      const paginatedData = result.slice(skip, skip + parsedLimit);

      return {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
        data: paginatedData
      };
    } else {
      // Get all attendance records with pagination
      const where = empid ? { employeeId: empid } : {};
      
      const total = await prisma.attendance.count({ where });
      
      // First get attendance records without employee relation
      const records = await prisma.attendance.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy: { date: 'desc' }
      });

      // Then get employee data separately for valid employeeIds
      const employeeIds = records.map(rec => rec.employeeId).filter(id => id);
      const employees = await prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: {
          id: true,
          name: true,
          department: true,
          tokenNo: true,
          shiftRate: true
        }
      });

      // Create a map of employees by ID
      const employeeMap = new Map();
      employees.forEach(emp => employeeMap.set(emp.id, emp));

      const data = records.map(rec => {
        const employee = employeeMap.get(rec.employeeId);
        return {
          employeeId: rec.employeeId,
          name: employee?.name || 'Unknown Employee',
          department: employee?.department || 'Unknown',
          tokenNo: employee?.tokenNo || 'N/A',
          shiftRate: employee?.shiftRate || 0,
          date: rec.date.toISOString(), // ISO date format
          shift: rec.shift,
          inTime: formatTime(rec.inTime),
          outTime: formatTime(rec.outTime),
          overtimeHours: rec.overtimeHours,
          totalHours: rec.totalHours,
          status: rec.status,
          employee: {
            name: employee?.name || 'Unknown Employee',
            department: employee?.department || 'Unknown',
            tokenNo: employee?.tokenNo || 'N/A',
            shiftRate: employee?.shiftRate || 0
          }
        };
      });

      return {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
        data
      };
    }
  } catch (error) {
    throw new Error(`Error getting attendance: ${error.message}`);
  }
};

exports.updateAttendance = async (empid, body) => {
  try {
    let { date, shift, overtimeHours, status } = body;
    // If shift is not valid, treat as ABSENT
    if (!isValidShift(shift)) {
      status = 'ABSENT';
      shift = null;
      overtimeHours = 0;
    }
    
    // Validate required fields
    if (!date || status === undefined) {
      throw new Error('Date and status are required');
    }

    // Validate status
    if (!['PRESENT', 'ABSENT', 'HALF_DAY'].includes(status)) {
      throw new Error('Invalid status. Must be PRESENT, ABSENT, or HALF_DAY');
    }

    // Validate shift only if not ABSENT
    if (status !== 'ABSENT' && !isValidShift(shift)) {
      throw new Error('Invalid shift. Must be SHIFT_1, SHIFT_2, or SHIFT_3');
    }

    const targetDate = parseLocalDate(date);
    const parsedOvertimeHours = parseFloat(overtimeHours) || 0;
    const totalHours = calculateTotalHours(status, parsedOvertimeHours);

    // Create shift times based on shift type
    const { inTime, outTime } = createShiftTimes(shift, date);

    // Use upsert to create or update attendance record
    const result = await prisma.attendance.upsert({
      where: {
        date_employeeId: {
          date: targetDate,
          employeeId: empid
        }
      },
      update: {
        shift,
        inTime,
        outTime,
        overtimeHours: parsedOvertimeHours,
        totalHours,
        status,
        updatedAt: new Date()
      },
      create: {
        employeeId: empid,
        date: targetDate,
        shift,
        inTime,
        outTime,
        overtimeHours: parsedOvertimeHours,
        totalHours,
        status
      }
    });

    return {
      message: 'Attendance updated successfully',
      count: 1,
      data: {
        employeeId: result.employeeId,
        date: formatDate(result.date),
        shift: result.shift,
        inTime: formatTime(result.inTime),
        outTime: formatTime(result.outTime),
        overtimeHours: result.overtimeHours,
        totalHours: result.totalHours,
        status: result.status
      }
    };
  } catch (error) {
    throw new Error(`Error updating attendance: ${error.message}`);
  }
};

exports.deleteAttendance = async (empid) => {
  try {
    const result = await prisma.attendance.deleteMany({
      where: { employeeId: empid }
    });

    return {
      message: 'Attendance deleted successfully',
      count: result.count
    };
  } catch (error) {
    throw new Error(`Error deleting attendance: ${error.message}`);
  }
};

exports.getByDate = async (date, { page = 1, limit = 10 } = {}) => {
  try {
    console.log('Input date:', date);
    const targetDate = parseLocalDate(date);
    console.log('Parsed target date:', targetDate);
    console.log('Formatted target date:', formatDate(targetDate));
    
    const skip = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    // Get all employees
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });

    // Get existing attendance for the date
    const existingAttendance = await prisma.attendance.findMany({
      where: { date: targetDate },
      include: { employee: true }
    });

    // Create a map of existing attendance
    const attendanceMap = new Map();
    existingAttendance.forEach(att => {
      attendanceMap.set(att.employeeId, att);
    });

    // Build response with all employees (including absent and half-day)
    const allData = employees.map(emp => {
      const existingAtt = attendanceMap.get(emp.id);
      
      if (existingAtt) {
        return {
          employeeId: emp.id,
          name: emp.name,
          department: emp.department,
          tokenNo: emp.tokenNo,
          shiftRate: emp.shiftRate,
          date: formatDate(existingAtt.date), // <-- FIXED: always YYYY-MM-DD
          shift: existingAtt.shift,
          inTime: formatTime(existingAtt.inTime),
          outTime: formatTime(existingAtt.outTime),
          overtimeHours: existingAtt.overtimeHours,
          totalHours: existingAtt.totalHours,
          status: existingAtt.status,
          employee: {
            name: emp.name,
            department: emp.department,
            tokenNo: emp.tokenNo,
            shiftRate: emp.shiftRate
          }
        };
      } else {
        return {
          employeeId: emp.id,
          name: emp.name,
          department: emp.department,
          tokenNo: emp.tokenNo,
          shiftRate: emp.shiftRate,
          date: formatDate(targetDate), // <-- FIXED: always YYYY-MM-DD
          shift: 'NULL',
          inTime: '00:00:00',
          outTime: '00:00:00',
          overtimeHours: 0,
          totalHours: 0,
          status: 'ABSENT',
          employee: {
            name: emp.name,
            department: emp.department,
            tokenNo: emp.tokenNo,
            shiftRate: emp.shiftRate
          }
        };
      }
    });

    // Apply pagination
    const total = allData.length;
    const paginatedData = allData.slice(skip, skip + parsedLimit);

    return {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      data: paginatedData
    };
  } catch (error) {
    throw new Error(`Error getting attendance by date: ${error.message}`);
  }
};

exports.getByRange = async ({ start, end, page = 1, limit = 10 }) => {
  try {
    const skip = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);

    // Get all employees
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    });

    // Get all attendance records in the date range
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { employee: true },
      orderBy: { date: 'desc' }
    });

    // Create a map of existing attendance by employeeId and date
    const attendanceMap = new Map();
    existingAttendance.forEach(att => {
      const key = `${att.employeeId}_${formatDate(att.date)}`;
      attendanceMap.set(key, att);
    });

    // Build nested response structure for each employee
    const allRecords = employees.map(emp => {
      const attendanceRecord = {
        employeeId: emp.id,
        employee: {
          tokenNo: emp.tokenNo,
          name: emp.name,
          shiftRate: emp.shiftRate.toString(),
          department: emp.department
        },
        attendance: {}
      };

      // Generate attendance data for each date in the range
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const currentDateStr = formatDate(currentDate);
        const key = `${emp.id}_${currentDateStr}`;
        const existingAtt = attendanceMap.get(key);
        
        if (existingAtt) {
          // Employee has attendance record for this date
          attendanceRecord.attendance[currentDateStr] = {
            status: existingAtt.status,
            inTime: formatTime(existingAtt.inTime),
            outTime: formatTime(existingAtt.outTime),
            totalHours: existingAtt.totalHours,
            overtimeHours: existingAtt.overtimeHours
          };
        } else {
          // Employee is absent for this date (default)
          attendanceRecord.attendance[currentDateStr] = {
            status: 'ABSENT',
            inTime: '00:00:00',
            outTime: '00:00:00',
            totalHours: 0,
            overtimeHours: 0
          };
        }
        
        // Move to next date
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return attendanceRecord;
    });

    // Apply pagination
    const total = allRecords.length;
    const paginatedData = allRecords.slice(skip, skip + parsedLimit);

    return {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      data: paginatedData
    };
  } catch (error) {
    throw new Error(`Error getting attendance by range: ${error.message}`);
  }
};

exports.bulkUpdateAttendance = async (date, body) => {
  try {
    const targetDate = parseLocalDate(date);
    let successCount = 0;
    let errorCount = 0;

    for (const item of body) {
      try {
        let { employeeId, shift, overtimeHours, status } = item;
        
        // If shift is not valid, treat as ABSENT
        if (!isValidShift(shift)) {
          status = 'ABSENT';
          shift = null;
          overtimeHours = 0;
        }
        
        if (!employeeId || status === undefined) {
          errorCount++;
          continue;
        }

        const parsedOvertimeHours = parseFloat(overtimeHours) || 0;
        const totalHours = calculateTotalHours(status, parsedOvertimeHours);
        const { inTime, outTime } = createShiftTimes(shift, date);

        await prisma.attendance.upsert({
          where: {
            date_employeeId: {
              date: targetDate,
              employeeId: employeeId
            }
          },
          update: {
            shift,
            inTime,
            outTime,
            overtimeHours: parsedOvertimeHours,
            totalHours,
            status,
            updatedAt: new Date()
          },
          create: {
            employeeId: employeeId,
            date: targetDate,
            shift,
            inTime,
            outTime,
            overtimeHours: parsedOvertimeHours,
            totalHours,
            status
          }
        });

        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error updating attendance for employee ${item.employeeId}:`, error.message);
      }
    }

    return {
      message: 'Bulk attendance update completed',
      successCount,
      errorCount
    };
  } catch (error) {
    throw new Error(`Error in bulk update: ${error.message}`);
  }
};

exports.getAttendanceSummary = async ({ date, start, end, month, year, page = 1, limit = 10 }) => {
  try {
    const skip = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    let where = {};

    if (date) {
      where.date = parseLocalDate(date);
    } else if (start && end) {
      where.date = {
        gte: parseLocalDate(start),
        lte: parseLocalDate(end)
      };
    } else if (month && year) {
      const first = new Date(year, month - 1, 1);
      const last = new Date(year, month, 0);
      where.date = {
        gte: first,
        lte: last
      };
    }

    // Get all attendance records (including all statuses: PRESENT, ABSENT, HALF_DAY)
    const total = await prisma.attendance.count({ where });
    
    // First get attendance records without employee relation
    const records = await prisma.attendance.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy: { date: 'desc' }
    });

    // Then get employee data separately for valid employeeIds
    const employeeIds = records.map(rec => rec.employeeId).filter(id => id);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        name: true,
        department: true,
        tokenNo: true,
        shiftRate: true
      }
    });

    // Create a map of employees by ID
    const employeeMap = new Map();
    employees.forEach(emp => employeeMap.set(emp.id, emp));

    const data = records.map(rec => {
      const employee = employeeMap.get(rec.employeeId);
      return {
        employeeId: rec.employeeId,
        name: employee?.name || 'Unknown Employee',
        department: employee?.department || 'Unknown',
        tokenNo: employee?.tokenNo || 'N/A',
        shiftRate: employee?.shiftRate || 0,
        date: rec.date.toISOString(), // ISO date format
        shift: rec.shift,
        inTime: formatTime(rec.inTime),
        outTime: formatTime(rec.outTime),
        overtimeHours: rec.overtimeHours,
        totalHours: rec.totalHours,
        status: rec.status,
        employee: {
          name: employee?.name || 'Unknown Employee',
          department: employee?.department || 'Unknown',
          tokenNo: employee?.tokenNo || 'N/A',
          shiftRate: employee?.shiftRate || 0
        }
      };
    });

    return {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      data
    };
  } catch (error) {
    throw new Error(`Error getting attendance summary: ${error.message}`);
  }
};

exports.getAttendanceRangeSummary = async ({ date, start, end, month, year }) => {
  try {
    let where = {};
    let numberOfDays = 1;
    let rangeStart, rangeEnd;

    if (date) {
      const d = parseLocalDate(date);
      where.date = d;
      rangeStart = d;
      rangeEnd = d;
    } else if (start && end) {
      rangeStart = parseLocalDate(start);
      rangeEnd = parseLocalDate(end);
      where.date = {
        gte: rangeStart,
        lte: rangeEnd
      };
    } else if (month && year) {
      rangeStart = new Date(year, month - 1, 1);
      rangeEnd = new Date(year, month, 0);
      where.date = {
        gte: rangeStart,
        lte: rangeEnd
      };
    }

    // Calculate number of days in the range
    if (rangeStart && rangeEnd) {
      numberOfDays = Math.floor((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)) + 1;
    }

    const totalEmployees = await prisma.employee.count();
    const attendance = await prisma.attendance.findMany({ where });

    const present = attendance.filter(a => a.status === 'PRESENT').length;
    const halfDay = attendance.filter(a => a.status === 'HALF_DAY').length;
    // For range/month: absent = (totalEmployees * numberOfDays) - present - halfDay
    const absent = (totalEmployees * numberOfDays) - present - halfDay;
    const totalOvertime = attendance
      .filter(a => a.status === 'PRESENT')
      .reduce((sum, a) => sum + a.overtimeHours, 0);
    const totalHours = attendance
      .filter(a => a.status === 'PRESENT')
      .reduce((sum, a) => sum + a.totalHours, 0);

    const averageHours = attendance.length > 0 
      ? parseFloat((totalHours / attendance.length).toFixed(2))
      : 0;

    return {
      totalEmployees: totalEmployees,
      present,
      absent,
      halfDay: halfDay,
      totalOvertime: totalOvertime,
      totalHours: totalHours,
      averageHours: averageHours
    };
  } catch (error) {
    throw new Error(`Error getting attendance range summary: ${error.message}`);
  }
};

exports.getFilteredAttendance = async ({ page = 1, limit = 10, shift, status, empid, department }) => {
  try {
    const skip = (page - 1) * limit;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    const where = {};

    if (shift) where.shift = shift;
    if (status) where.status = status;
    if (empid) where.employeeId = empid;

    // Get all attendance records (including all statuses: PRESENT, ABSENT, HALF_DAY)
    const total = await prisma.attendance.count({ where });
    
    // First get attendance records without employee relation
    const records = await prisma.attendance.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy: { date: 'desc' }
    });

    // Then get employee data separately for valid employeeIds
    const employeeIds = records.map(rec => rec.employeeId).filter(id => id);
    const employees = await prisma.employee.findMany({
      where: { 
        id: { in: employeeIds },
        ...(department ? { department } : {})
      },
      select: {
        id: true,
        name: true,
        department: true,
        tokenNo: true,
        shiftRate: true
      }
    });

    // Create a map of employees by ID
    const employeeMap = new Map();
    employees.forEach(emp => employeeMap.set(emp.id, emp));

    const data = records
      .filter(rec => !department || employeeMap.get(rec.employeeId)?.department === department)
      .map(rec => {
        const employee = employeeMap.get(rec.employeeId);
        return {
          employeeId: rec.employeeId,
          name: employee?.name || 'Unknown Employee',
          department: employee?.department || 'Unknown',
          tokenNo: employee?.tokenNo || 'N/A',
          shiftRate: employee?.shiftRate || 0,
          date: rec.date.toISOString(), // ISO date format
          shift: rec.shift,
          inTime: formatTime(rec.inTime),
          outTime: formatTime(rec.outTime),
          overtimeHours: rec.overtimeHours,
          totalHours: rec.totalHours,
          status: rec.status,
          employee: {
            name: employee?.name || 'Unknown Employee',
            department: employee?.department || 'Unknown',
            tokenNo: employee?.tokenNo || 'N/A',
            shiftRate: employee?.shiftRate || 0
          }
        };
      });

    return {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      data
    };
  } catch (error) {
    throw new Error(`Error getting filtered attendance: ${error.message}`);
  }
};

exports.updateAttendanceWithAudit = async (empid, data, updaterId) => {
  try {
    let { shift, overtimeHours, status } = data;
    // If shift is not valid, treat as ABSENT
    if (!isValidShift(shift)) {
      status = 'ABSENT';
      shift = null;
      overtimeHours = 0;
    }
    const today = new Date();
    const targetDate = parseLocalDate(today);
    
    const parsedOvertimeHours = parseFloat(overtimeHours) || 0;
    const totalHours = calculateTotalHours(status, parsedOvertimeHours);
    const { inTime, outTime } = createShiftTimes(shift, today);

    const result = await prisma.attendance.upsert({
      where: {
        date_employeeId: {
          date: targetDate,
          employeeId: empid
        }
      },
      update: {
        shift,
        inTime,
        outTime,
        overtimeHours: parsedOvertimeHours,
        totalHours,
        status,
        lastUpdatedBy: updaterId,
        updatedAt: new Date()
      },
      create: {
        employeeId: empid,
        date: targetDate,
        shift,
        inTime,
        outTime,
        overtimeHours: parsedOvertimeHours,
        totalHours,
        status,
        lastUpdatedBy: updaterId
      }
    });

    return {
      message: 'Attendance updated with audit',
      data: {
        employeeId: result.employeeId,
        date: formatDate(result.date),
        shift: result.shift,
        inTime: formatTime(result.inTime),
        outTime: formatTime(result.outTime),
        overtimeHours: result.overtimeHours,
        totalHours: result.totalHours,
        status: result.status,
        lastUpdatedBy: result.lastUpdatedBy
      }
    };
  } catch (error) {
    throw new Error(`Error updating attendance with audit: ${error.message}`);
  }
};

exports.markBulkAttendance = async (date, records) => {
  const targetDate = parseLocalDate(date);
  const results = [];
  const allowedShifts = ['SHIFT_1', 'SHIFT_2', 'SHIFT_3'];

  for (const record of records) {
    let {
      employeeId,
      shift,
      status,
      overtimeHours = 0
    } = record;

    let finalShift = shift;
    let inTime = '00:00:00';
    let outTime = '00:00:00';
    let totalHours = 0;
    let parsedOvertime = parseFloat(overtimeHours) || 0;

    // If shift is not valid, treat as ABSENT
    if (!isValidShift(shift)) {
      status = 'ABSENT';
      finalShift = null;
      parsedOvertime = 0;
      totalHours = 0;
    } else if (status === 'ABSENT') {
      finalShift = null;
      parsedOvertime = 0;
      totalHours = 0;
    } else {
      // status is PRESENT or HALF_DAY, and shift is valid
      const { inTime: inDt, outTime: outDt } = createShiftTimes(finalShift, date);
      inTime = formatTime(inDt);
      outTime = formatTime(outDt);
      totalHours = calculateTotalHours(status, parsedOvertime);
    }

    try {
      await prisma.attendance.upsert({
        where: {
          date_employeeId: {
            date: targetDate,
            employeeId: employeeId
          }
        },
        update: {
          shift: finalShift,
          inTime: new Date(targetDate.toDateString() + ' ' + inTime),
          outTime: new Date(targetDate.toDateString() + ' ' + outTime),
          overtimeHours: parsedOvertime,
          totalHours,
          status,
          updatedAt: new Date()
        },
        create: {
          employeeId: employeeId,
          date: targetDate,
          shift: finalShift,
          inTime: new Date(targetDate.toDateString() + ' ' + inTime),
          outTime: new Date(targetDate.toDateString() + ' ' + outTime),
          overtimeHours: parsedOvertime,
          totalHours,
          status
        }
      });

      // Prepare the result for the controller
      if (status === 'ABSENT') {
        results.push({
          employeeId,
          status,
          overtimeHours: 0
        });
      } else {
        results.push({
          employeeId,
          shift: finalShift,
          status,
          overtimeHours: parsedOvertime
        });
      }
    } catch (error) {
      console.error(`Error processing attendance for employee ${employeeId}:`, error);
      // Add error record to results
      results.push({
        employeeId,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  return results;
};
