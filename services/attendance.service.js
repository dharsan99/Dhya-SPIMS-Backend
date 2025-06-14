const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AttendanceService {
  
  // Utility method to calculate total working hours
  calculateWorkingHours(inTime, outTime, overtimeHours = 0) {
    const workingHours = (new Date(outTime) - new Date(inTime)) / (1000 * 60 * 60);
    return parseFloat((workingHours + overtimeHours).toFixed(2));
  }

  // Validate date format
  validateDate(date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date format');
    }
    return parsedDate;
  }

  // Validate month and year
  validateMonthYear(month, year) {
    if (!month || !year) {
      throw new Error('Month and Year are required');
    }
    if (!/^(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error('Month must be between 01-12');
    }
    if (!/^\d{4}$/.test(year)) {
      throw new Error('Year must be a 4-digit number');
    }
    return { month, year };
  }

  // Mark attendance with bulk operations
  async markAttendance({ date, records }) {
    try {
      // Validate input like old code
      if (!date || !records || !Array.isArray(records)) {
        throw new Error('Date and records array are required');
      }

      // Validate each record like old code
      for (const rec of records) {
        if (!rec.employee_id) {
          throw new Error('Employee ID is required for all records');
        }
        if (!rec.shift) {
          throw new Error(`Missing shift for employee ${rec.employee_id}`);
        }
        if (!rec.in_time || !rec.out_time) {
          throw new Error(`Missing time data for employee ${rec.employee_id}`);
        }
      }

      // Process each record exactly like old code
      const txns = records.map((record) => {
        const shift = record.shift;
        const overtime = record.overtime_hours || 0;
        const inTime = new Date(record.in_time);
        const outTime = new Date(record.out_time);

        // Calculate working hours like old code
        const workingHours = (outTime - inTime) / (1000 * 60 * 60);
        const total = parseFloat((workingHours + overtime).toFixed(2));

        return prisma.attendance.upsert({
          where: {
            date_employee_id: {
              date: new Date(date),
              employee_id: record.employee_id,
            },
          },
          update: {
            shift,
            in_time: inTime,
            out_time: outTime,
            overtime_hours: overtime,
            total_hours: total,
            status: record.status,
          },
          create: {
            date: new Date(date),
            employee_id: record.employee_id,
            shift,
            in_time: inTime,
            out_time: outTime,
            overtime_hours: overtime,
            total_hours: total,
            status: record.status,
          },
        });
      });

      return await prisma.$transaction(txns);
    } catch (error) {
      console.error('Attendance marking service error:', error);
      throw error;
    }
  }


  // Get attendance by date with filters
  async getAttendanceByDate({ date, employee_id, shift, status }) {
    if (!date) {
      throw new Error('Date is required');
    }

    try {
      const targetDate = this.validateDate(date);
      const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

      const whereClause = {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };

      // Apply optional filters
      if (employee_id) whereClause.employee_id = employee_id;
      if (shift) whereClause.shift = shift;
      if (status) whereClause.status = status;

      return await prisma.attendance.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              name: true,
              department: true,
              token_no: true,
              shift_rate: true,
            },
          },
        },
        orderBy: {
          employee_id: 'asc',
        },
      });
    } catch (error) {
      console.error('Get attendance by date service error:', error);
      throw error;
    }
  }

  // Get attendance within date range
  async getAttendanceRange({ start, end }) {
    if (!start || !end) {
      throw new Error('Start and end dates are required');
    }

    try {
      const startDate = this.validateDate(start);
      const endDate = this.validateDate(end);

      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date');
      }

      return await prisma.attendance.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          employee: {
            select: {
              name: true,
              department: true,
              token_no: true,
              shift_rate: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
    } catch (error) {
      console.error('Get attendance range service error:', error);
      throw error;
    }
  }

  // Get all attendance with pagination
  async getAllAttendance({ page = '1', limit = '10' } = {}) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 per page
      const skip = (pageNum - 1) * limitNum;

      const [total, data] = await Promise.all([
        prisma.attendance.count(),
        prisma.attendance.findMany({
          skip,
          take: limitNum,
          include: {
            employee: {
              select: { 
                name: true,
                department: true,
                token_no: true,
                shift_rate: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        }),
      ]);

      // Format data for response
      const formattedData = data.map(record => ({
        employee_id: record.employee_id,
        name: record.employee?.name || '',
        department: record.employee?.department || '',
        token_no: record.employee?.token_no || '',
        shift_rate: record.employee?.shift_rate || 0,
        date: record.date,
        shift: record.shift,
        status: record.status,
        in_time: record.in_time,
        out_time: record.out_time,
        total_hours: record.total_hours,
        overtime_hours: record.overtime_hours,
      }));

      return {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        data: formattedData,
      };
    } catch (error) {
      console.error('Get all attendance service error:', error);
      throw error;
    }
  }

  // Create new attendance record
  async createAttendance(data) {
    try {
      const { employee_id, date, shift, in_time, out_time, overtime_hours = 0, status } = data;

      // Validate required fields
      if (!employee_id || !date || !shift || !in_time || !out_time || !status) {
        throw new Error('Missing required fields: employee_id, date, shift, in_time, out_time, status');
      }

      const validatedDate = this.validateDate(date);
      const inTime = new Date(in_time);
      const outTime = new Date(out_time);
      
      if (inTime >= outTime) {
        throw new Error('Out time must be after in time');
      }

      const totalHours = this.calculateWorkingHours(inTime, outTime, overtime_hours);

      return await prisma.attendance.create({
        data: {
          employee_id,
          date: validatedDate,
          shift,
          in_time: inTime,
          out_time: outTime,
          overtime_hours,
          total_hours: totalHours,
          status,
        },
        include: {
          employee: {
            select: {
              name: true,
              department: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Create attendance service error:', error);
      throw error;
    }
  }

  // Update attendance records
  async updateAttendance(employeeId, updateData) {
    try {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }

      // If time fields are being updated, recalculate total hours
      if (updateData.in_time && updateData.out_time) {
        const inTime = new Date(updateData.in_time);
        const outTime = new Date(updateData.out_time);
        const overtimeHours = updateData.overtime_hours || 0;
        updateData.total_hours = this.calculateWorkingHours(inTime, outTime, overtimeHours);
      }

      return await prisma.attendance.updateMany({
        where: { employee_id: employeeId },
        data: updateData,
      });
    } catch (error) {
      console.error('Update attendance service error:', error);
      throw error;
    }
  }

  // Delete attendance records
  async deleteAttendance(employeeId) {
    try {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }

      return await prisma.attendance.deleteMany({
        where: { employee_id: employeeId },
      });
    } catch (error) {
      console.error('Delete attendance service error:', error);
      throw error;
    }
  }

  // Get attendance summary for a month
  async getAttendanceSummary({ month, year }) {
    try {
      const { month: validMonth, year: validYear } = this.validateMonthYear(month, year);

      const startDate = new Date(`${validYear}-${validMonth}-01T00:00:00.000Z`);
      const nextMonth = validMonth === '12' ? '01' : String(Number(validMonth) + 1).padStart(2, '0');
      const nextYear = validMonth === '12' ? String(Number(validYear) + 1) : validYear;
      const endDate = new Date(`${nextYear}-${nextMonth}-01T00:00:00.000Z`);

      const records = await prisma.attendance.findMany({
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          employee: {
            select: {
              name: true,
              department: true,
            },
          },
        },
      });

      // Process summary data
      const summaryMap = new Map();

      records.forEach(record => {
        const employeeId = record.employee_id;
        
        if (!summaryMap.has(employeeId)) {
          summaryMap.set(employeeId, {
            employee_id: employeeId,
            employee_name: record.employee?.name || '',
            department: record.employee?.department || '',
            workingDays: 0,
            overtimeHours: 0,
            absents: 0,
            halfDays: 0,
            totalHours: 0,
          });
        }

        const summary = summaryMap.get(employeeId);
        
        switch (record.status) {
          case 'PRESENT':
            summary.workingDays += 1;
            break;
          case 'HALF_DAY':
            summary.workingDays += 0.5;
            summary.halfDays += 1;
            break;
          case 'ABSENT':
            summary.absents += 1;
            break;
        }

        summary.overtimeHours += record.overtime_hours || 0;
        summary.totalHours += record.total_hours || 0;
      });

      return {
        month: validMonth,
        year: validYear,
        attendanceSummary: Array.from(summaryMap.values()),
      };
    } catch (error) {
      console.error('Get attendance summary service error:', error);
      throw error;
    }
  }

  // Get filtered attendance
  async getFilteredAttendance({ employee_id, department, shift }) {
    try {
      const whereClause = {};

      if (employee_id) whereClause.employee_id = employee_id;
      if (shift) whereClause.shift = shift;
      if (department) {
        whereClause.employee = {
          department: department,
        };
      }

      return await prisma.attendance.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              name: true,
              department: true,
              token_no: true,
              shift_rate: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    } catch (error) {
      console.error('Get filtered attendance service error:', error);
      throw error;
    }
  }

  // Export monthly attendance
  async exportMonthlyAttendance({ month, year }) {
    try {
      const { month: validMonth, year: validYear } = this.validateMonthYear(month, year);

      const startDate = new Date(`${validYear}-${validMonth.padStart(2, '0')}-01T00:00:00Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const data = await prisma.attendance.findMany({
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          employee: {
            select: {
              name: true,
              department: true,
              token_no: true,
              shift_rate: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      const filename = `attendance-${validYear}-${validMonth}.json`;

      return { data, filename };
    } catch (error) {
      console.error('Export monthly attendance service error:', error);
      throw error;
    }
  }

  // Update attendance with audit trail
  async updateAttendanceWithAudit(employeeId, auditData) {
    try {
      if (!employeeId) {
        throw new Error('Employee ID is required');
      }

      // Process audit data
      const updateData = {
        ...auditData,
        updatedAt: new Date(),
      };

      // If time fields are being updated, recalculate total hours
      if (updateData.in_time && updateData.out_time) {
        const inTime = new Date(updateData.in_time);
        const outTime = new Date(updateData.out_time);
        const overtimeHours = updateData.overtime_hours || 0;
        updateData.total_hours = this.calculateWorkingHours(inTime, outTime, overtimeHours);
      }

      return await prisma.attendance.updateMany({
        where: { employee_id: employeeId },
        data: updateData,
      });
    } catch (error) {
      console.error('Update attendance with audit service error:', error);
      throw error;
    }
  }

  async getDailySummary(dateString) {
  try {
    const date = this.validateDate(dateString);

    // Start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get attendance records for the day
    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Total employees (from employee table)
    const totalEmployees = await prisma.employees.count();

    // Count status
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const absentCount = records.filter(r => r.status === 'ABSENT').length;
    const totalMarked = records.length;

    // Total overtime
    const totalOvertime = records.reduce((sum, rec) => sum + (rec.overtime_hours || 0), 0);

    // Average shift hours
    const totalShiftHours = records.reduce((sum, rec) => sum + (rec.total_hours || 0), 0);
    const averageShiftHours = totalMarked > 0
      ? parseFloat((totalShiftHours / totalMarked).toFixed(2))
      : 0;

    return {
      date: startOfDay.toISOString().split('T')[0],
      total_employees: totalEmployees,
      present: presentCount,
      absent: absentCount,
      total_overtime: parseFloat(totalOvertime.toFixed(2)),
      average_shift_hours: averageShiftHours,
    };
  } catch (error) {
    console.error('Error in getDailySummary:', error);
    throw new Error('Failed to get attendance summary');
  }
}

  // Get attendance summary based on type (daily, weekly, monthly)
  async getAttendanceSummary({ type = 'monthly', date, start, end, month, year }) {
    try {
      switch (type) {
        case 'daily':
          return await this.getDailyAttendanceSummary(date);
        case 'weekly':
          return await this.getWeeklyAttendanceSummary(start, end);
        case 'monthly':
          return await this.getMonthlyAttendanceSummary(month, year);
        default:
          throw new Error('Invalid summary type. Must be daily, weekly, or monthly');
      }
    } catch (error) {
      console.error('Get attendance summary service error:', error);
      throw error;
    }
  }

  // Get daily attendance summary
  async getDailyAttendanceSummary(date) {
    try {
      if (!date) {
        throw new Error('Date is required for daily summary');
      }

      const targetDate = this.validateDate(date);
      const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

      const records = await prisma.attendance.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          employee: {
            select: {
              name: true,
              department: true,
              token_no: true,
              shift_rate: true,
            },
          },
        },
      });

      // Process summary data
      const summaryMap = new Map();

      records.forEach(record => {
        const employeeId = record.employee_id;
        
        if (!summaryMap.has(employeeId)) {
          summaryMap.set(employeeId, {
            employee_id: employeeId,
            employee_name: record.employee?.name || '',
            department: record.employee?.department || '',
            token_no: record.employee?.token_no || '',
            shift_rate: record.employee?.shift_rate || 0,
            workingHours: 0,
            overtimeHours: 0,
            status: record.status,
            in_time: record.in_time,
            out_time: record.out_time,
          });
        }

        const summary = summaryMap.get(employeeId);
        summary.workingHours = record.total_hours || 0;
        summary.overtimeHours = record.overtime_hours || 0;
      });

      return {
        date: startOfDay.toISOString().split('T')[0],
        type: 'daily',
        attendanceSummary: Array.from(summaryMap.values()),
      };
    } catch (error) {
      console.error('Get daily attendance summary service error:', error);
      throw error;
    }
  }

  // Get weekly attendance summary
  async getWeeklyAttendanceSummary(start, end) {
    try {
      if (!start || !end) {
        throw new Error('Start and end dates are required for weekly summary');
      }

      const startDate = this.validateDate(start);
      const endDate = this.validateDate(end);

      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date');
      }

      const records = await prisma.attendance.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          employee: {
            select: {
              name: true,
              department: true,
              token_no: true,
              shift_rate: true,
            },
          },
        },
      });

      // Process summary data
      const summaryMap = new Map();

      records.forEach(record => {
        const employeeId = record.employee_id;
        
        if (!summaryMap.has(employeeId)) {
          summaryMap.set(employeeId, {
            employee_id: employeeId,
            employee_name: record.employee?.name || '',
            department: record.employee?.department || '',
            token_no: record.employee?.token_no || '',
            shift_rate: record.employee?.shift_rate || 0,
            workingDays: 0,
            overtimeHours: 0,
            totalHours: 0,
            absents: 0,
            halfDays: 0,
          });
        }

        const summary = summaryMap.get(employeeId);
        
        switch (record.status) {
          case 'PRESENT':
            summary.workingDays += 1;
            break;
          case 'HALF_DAY':
            summary.workingDays += 0.5;
            summary.halfDays += 1;
            break;
          case 'ABSENT':
            summary.absents += 1;
            break;
        }

        summary.overtimeHours += record.overtime_hours || 0;
        summary.totalHours += record.total_hours || 0;
      });

      return {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        type: 'weekly',
        attendanceSummary: Array.from(summaryMap.values()),
      };
    } catch (error) {
      console.error('Get weekly attendance summary service error:', error);
      throw error;
    }
  }

  // Get monthly attendance summary (renamed from getAttendanceSummary)
  async getMonthlyAttendanceSummary(month, year) {
    try {
      const { month: validMonth, year: validYear } = this.validateMonthYear(month, year);

      const startDate = new Date(`${validYear}-${validMonth}-01T00:00:00.000Z`);
      const nextMonth = validMonth === '12' ? '01' : String(Number(validMonth) + 1).padStart(2, '0');
      const nextYear = validMonth === '12' ? String(Number(validYear) + 1) : validYear;
      const endDate = new Date(`${nextYear}-${nextMonth}-01T00:00:00.000Z`);

      const records = await prisma.attendance.findMany({
        where: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          employee: {
            select: {
              name: true,
              department: true,
              token_no: true,
              shift_rate: true,
            },
          },
        },
      });

      // Process summary data
      const summaryMap = new Map();

      records.forEach(record => {
        const employeeId = record.employee_id;
        
        if (!summaryMap.has(employeeId)) {
          summaryMap.set(employeeId, {
            employee_id: employeeId,
            employee_name: record.employee?.name || '',
            department: record.employee?.department || '',
            token_no: record.employee?.token_no || '',
            shift_rate: record.employee?.shift_rate || 0,
            workingDays: 0,
            overtimeHours: 0,
            absents: 0,
            halfDays: 0,
            totalHours: 0,
          });
        }

        const summary = summaryMap.get(employeeId);
        
        switch (record.status) {
          case 'PRESENT':
            summary.workingDays += 1;
            break;
          case 'HALF_DAY':
            summary.workingDays += 0.5;
            summary.halfDays += 1;
            break;
          case 'ABSENT':
            summary.absents += 1;
            break;
        }

        summary.overtimeHours += record.overtime_hours || 0;
        summary.totalHours += record.total_hours || 0;
      });

      return {
        month: validMonth,
        year: validYear,
        type: 'monthly',
        attendanceSummary: Array.from(summaryMap.values()),
      };
    } catch (error) {
      console.error('Get monthly attendance summary service error:', error);
      throw error;
    }
  }

}

// Export service instance
module.exports = new AttendanceService();