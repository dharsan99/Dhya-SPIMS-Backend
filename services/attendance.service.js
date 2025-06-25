//pullable request
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


class AttendanceService {
  
  // Utility method to calculate total working hours
  calculateWorkingHours(status, overtimeHours = 0) {
    let workingHours = 0;
    if (status === 'PRESENT') {
      workingHours = 8;
    } else if (status === 'HALF_DAY') {
      workingHours = 4;
    }
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
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
   
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

        let workingHours = 0;
        if (record.status === 'PRESENT') {
          workingHours = 8;
        } else if (record.status === 'HALF_DAY') {
          workingHours = 4;
        } else {
          workingHours = 0;
        }
        const totalHours = this.calculateWorkingHours(record.status, overtime);

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
            total_hours: totalHours,
            status: record.status,
          },
          create: {
            date: new Date(date),
            employee_id: record.employee_id,
            shift,
            in_time: inTime,
            out_time: outTime,
            overtime_hours: overtime,
            total_hours: totalHours,
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
  async getAttendanceByDate({ date, employee_id, shift, status, page = 1, limit = 10 }) {
    if (!date) throw new Error('Date is required');

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // 1. Get all employees (with optional filters)
    const employeeWhere = {};
    if (employee_id) employeeWhere.id = employee_id;
    // Note: shift filter only if you have shift in employee table
    // if (shift) employeeWhere.shift = shift;

    const allEmployees = await prisma.employees.findMany({
      where: employeeWhere,
      select: {
        id: true,
        name: true,
        department: true,
        token_no: true,
        shift_rate: true,
      },
      skip,
      take: limit,
    });

    // 2. Get all attendance records for the date
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 3. Map attendance by employee_id
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.employee_id] = record;
    });

    // 4. Build response: if no record, treat as ABSENT
    const data = allEmployees.map(emp => {
      const att = attendanceMap[emp.id];
      if (att) {
        return {
          employee_id: emp.id,
          name: emp.name,
          department: emp.department,
          token_no: emp.token_no,
          shift_rate: emp.shift_rate,
          date: att.date,
          shift: att.shift,
          status: att.status,
          in_time: att.in_time,
          out_time: att.out_time,
          overtime_hours: att.overtime_hours,
          total_hours: att.total_hours,
        };
      } else {
        return {
          employee_id: emp.id,
          name: emp.name,
          department: emp.department,
          token_no: emp.token_no,
          shift_rate: emp.shift_rate,
          date: startOfDay,
          shift: null,
          status: 'ABSENT',
          in_time: null,
          out_time: null,
          overtime_hours: 0,
          total_hours: 0,
        };
      }
    });

    // 5. Optionally filter by status
    const filteredData = status ? data.filter(d => d.status === status) : data;

    return {
      data: filteredData,
      total: allEmployees.length,
      page,
      limit,
      totalPages: Math.ceil(allEmployees.length / limit),
    };
  }

  async getAttendanceRange({ start, end, page = 1, limit = 10 }) {
    if (!start || !end) {
      throw new Error('Start and end dates are required');
    }

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const startDate = this.validateDate(start);
    const endDate = this.validateDate(end);

    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    // Get all employees
    const allEmployees = await prisma.employees.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        token_no: true,
        shift_rate: true,
      },
    });

    // Get all dates in the range (inclusive)
    const dateList = [];
    let d = new Date(startDate);
    d.setUTCHours(0, 0, 0, 0);
    const endUTC = new Date(endDate);
    endUTC.setUTCHours(0, 0, 0, 0);
    while (d <= endUTC) {
      dateList.push(new Date(d)); // Always push a new Date object
      d.setDate(d.getDate() + 1);
    }

    // Get all attendance records in the range
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Map: { employee_id: { dateString: record } }
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      if (!attendanceMap[record.employee_id]) attendanceMap[record.employee_id] = {};
      const dateKey = record.date.toISOString().split('T')[0];
      attendanceMap[record.employee_id][dateKey] = record;
    });

    // Build grouped data
    const grouped = allEmployees.map(emp => {
      const attendance = {};
      dateList.forEach(dateObj => {
        const dateKey = dateObj.toISOString().split('T')[0];
        const att = attendanceMap[emp.id]?.[dateKey];
        if (att) {
          attendance[dateKey] = {
            status: att.status,
            in_time: att.in_time ? att.in_time.toISOString() : null,
            out_time: att.out_time ? att.out_time.toISOString() : null,
            total_hours: att.total_hours,
            overtime_hours: att.overtime_hours,
            shift: att.shift,
          };
        } else {
          attendance[dateKey] = {
            status: 'ABSENT',
            in_time: null,
            out_time: null,
            total_hours: 0,
            overtime_hours: 0,
            shift: null,
          };
        }
      });
      return {
        employee_id: emp.id,
        employee: {
          name: emp.name,
          department: emp.department,
          token_no: emp.token_no,
          shift_rate: emp.shift_rate,
        },
        attendance,
      };
    });

    // Pagination
    const total = allEmployees.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = grouped.slice(skip, skip + limit);

    return {
      page,
      limit,
      total,
      total_pages: totalPages,
      data: paginated,
    };
  }

  // Get all attendance with pagination
  async getAllAttendance({ page = '1', limit = '10' } = {}) {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Get all employees
    const allEmployees = await prisma.employees.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        token_no: true,
        shift_rate: true,
      },
    });

    // Get all unique dates in attendance table
    const dates = await prisma.attendance.findMany({
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
    });
    const dateList = dates.map(d => d.date);

    // Get all attendance records
    const attendanceRecords = await prisma.attendance.findMany();
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      if (!attendanceMap[record.employee_id]) attendanceMap[record.employee_id] = {};
      const dateKey = record.date.toISOString().split('T')[0];
      attendanceMap[record.employee_id][dateKey] = record;
    });

    // Build data: for each employee, for each date, show attendance or ABSENT
    const data = [];
    allEmployees.forEach(emp => {
      dateList.forEach(dateObj => {
        const dateKey = dateObj.toISOString().split('T')[0];
        const att = attendanceMap[emp.id]?.[dateKey];
        if (att) {
          data.push({
            employee_id: emp.id,
            name: emp.name,
            department: emp.department,
            token_no: emp.token_no,
            shift_rate: emp.shift_rate,
            date: att.date,
            shift: att.shift,
            status: att.status,
            in_time: att.in_time,
            out_time: att.out_time,
            total_hours: att.total_hours,
            overtime_hours: att.overtime_hours,
          });
        } else {
          data.push({
            employee_id: emp.id,
            name: emp.name,
            department: emp.department,
            token_no: emp.token_no,
            shift_rate: emp.shift_rate,
            date: dateObj,
            shift: null,
            status: 'ABSENT',
            in_time: null,
            out_time: null,
            total_hours: 0,
            overtime_hours: 0,
          });
        }
      });
    });

    // Pagination
    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = data.slice(skip, skip + limit);

    return {
      page,
      limit,
      total,
      totalPages,
      data: paginated,
    };
  }

  // Create new attendance record
  async createAttendance(data) {
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
    try {
      const { employee_id, date, status } = data;
  
      if (!employee_id || !date || !status) {
        throw new Error('Missing required fields: employee_id, date, and status');
      }
  
      const validatedDate = this.validateDate(date);
  
      let attendanceData = {
        employee_id,
        date: validatedDate,
        status,
      };
  
      if (status === 'PRESENT' || status === 'HALF_DAY') {
        const { shift, in_time, out_time, overtime_hours = 0 } = data;
  
        if (!shift || !in_time || !out_time) {
          throw new Error('Missing required fields: shift, in_time, or out_time for PRESENT/HALF_DAY');
        }
  
        const inTime = new Date(in_time);
        const outTime = new Date(out_time);
  
        if (inTime >= outTime) {
          throw new Error('Out time must be after in time');
        }
  
        const totalHours = this.calculateWorkingHours(status, overtime_hours);
  
        attendanceData = {
          ...attendanceData,
          shift,
          in_time: inTime,
          out_time: outTime,
          overtime_hours,
          total_hours: totalHours,
        };
      } else if (status === 'ABSENT') {
        // Force default values for required fields even if empty/missing in input
        const defaultTime = new Date(`${validatedDate.toISOString().split('T')[0]}T00:00:00.000Z`);
  
        attendanceData = {
          ...attendanceData,
          shift: 'N/A',
          in_time: defaultTime,
          out_time: defaultTime,
          overtime_hours: 0,
          total_hours: 0,
        };
      }
  
      return await prisma.attendance.create({
        data: attendanceData,
        include: {
          employee: {
            select: {
              name: true,
              department: true,
              shift_rate: true,
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
  
      if (!updateData.date) {
        throw new Error('Date is required in updateData');
      }
  
      const parsedDate = new Date(updateData.date);
      parsedDate.setHours(0, 0, 0, 0);
  
      await this.ensureAbsentEntriesForToday(parsedDate);
  
      // Recalculate total hours if in/out time is provided
      if (updateData.in_time && updateData.out_time) {
        const inTime = new Date(updateData.in_time);
        const outTime = new Date(updateData.out_time);
        const overtimeHours = updateData.overtime_hours || 0;
        updateData.total_hours = this.calculateWorkingHours(updateData.status, overtimeHours);
      }
  
      // Fix: convert `updateData.date` to a proper Date object
      updateData.date = parsedDate;
  
      return await prisma.attendance.updateMany({
        where: {
          employee_id: employeeId,
          date: parsedDate,
        },
        data: updateData,
      });
    } catch (error) {
      console.error('Update attendance service error:', error);
      throw error;
    }
  }
  
  
  // Delete attendance records
  async deleteAttendance(employeeId) {
    await this.ensureAbsentEntriesForToday();
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

  // Get filtered attendance
  async getFilteredAttendance({ employee_id, department, shift }) {
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
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
              shift_rate: true, // This comes from employees table
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
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
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
              shift_rate: true, // This comes from employees table
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
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
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
        updateData.total_hours = this.calculateWorkingHours(updateData.status, overtimeHours);
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

  async getAttendanceRangeSummary({ date, startDate, endDate, month, year }) {
    let parsedDate;
    if (date) {
      parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        parsedDate.setHours(0, 0, 0, 0);
        await this.ensureAbsentEntriesForToday(parsedDate);
      }
    }
    try {
      let start, end;
      let summaryType = 'daily';

      if (startDate && endDate) {
        const s = this.validateDate(startDate);
        const e = this.validateDate(endDate);
        if (s > e) throw new Error('startDate cannot be after endDate');

        start = new Date(s);
        start.setHours(0, 0, 0, 0);
        end = new Date(e);
        end.setHours(23, 59, 59, 999);
        summaryType = 'custom_range';
      } else if (month && year) {
        const m = parseInt(month) - 1;
        const y = parseInt(year);

        start = new Date(Date.UTC(y, m, 1));
        end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
        summaryType = 'monthly';
      } else if (date) {
        const d = this.validateDate(date);
        start = new Date(d);
        start.setHours(0, 0, 0, 0);
        end = new Date(d);
        end.setHours(23, 59, 59, 999);
        summaryType = 'daily';
      } else {
        throw new Error('Provide date or startDate & endDate or month & year');
      }

      const records = await prisma.attendance.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      });

      const totalEmployees = await prisma.employees.count();

      // Calculate total days in the range (inclusive)
      const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // For range/monthly, present = total PRESENT records, absent = total slots - present
      const present = records.filter(r => r.status === 'PRESENT').length;
      const absent = (totalDays * totalEmployees) - present;

      const totalMarked = records.length;

      const totalOvertime = records.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
      const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0);
      const avgHours = totalMarked > 0 ? parseFloat((totalHours / totalMarked).toFixed(2)) : 0;

      return {
        summary_type: summaryType,
        range: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
        total_employees: totalEmployees,
        present,
        absent,
        total_overtime: parseFloat(totalOvertime.toFixed(2)),
        average_shift_hours: avgHours,
      };
    } catch (error) {
      console.error('Error in getAttendanceRangeSummary service:', error);
      throw new Error('Failed to get attendance summary');
    }
  }

  // Get attendance summary based on type (daily, weekly, monthly)
  async getAttendanceSummary({ type = 'monthly', date, start, end, month, year }) {
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
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
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
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
              shift_rate: true, // This comes from employees table
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
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
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
              shift_rate: true, // This comes from employees table
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

  // Get monthly attendance summary
  async getMonthlyAttendanceSummary(month, year) {
    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);
    await this.ensureAbsentEntriesForToday(parsedDate);
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
              shift_rate: true, // This comes from employees table
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
  async ensureAbsentEntriesForToday(date) {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
  
    const employees = await prisma.employees.findMany();
  
    for (const emp of employees) {
      const existing = await prisma.attendance.findFirst({
        where: {
          employee_id: emp.id,
          date: today, // ✅ FIXED
        },
      });
  
      if (!existing) {
        await prisma.attendance.create({
          data: {
            date: today, // ✅ FIXED
            employee_id: emp.id,
            status: 'ABSENT',
            shift: '',
            in_time: new Date(today),
            out_time: new Date(today),
            overtime_hours: 0,
            total_hours: 0,
          },
        });
      }
    }
  
    console.log(`✅ ABSENT entries ensured for all employees on ${today.toDateString()}`);
  }
   
}


// Export service instance
module.exports = new AttendanceService();

