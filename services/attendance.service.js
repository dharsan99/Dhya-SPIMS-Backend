const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateTotalHours(shift, overtimeHours) {
  return 8 + (overtimeHours || 0); // Each shift = 8 hours
}

exports.markAttendance = async ({ date, records }) => {
  try {
    for (const rec of records) {
      if (!rec.shift) {
        throw new Error(`Missing shift for employee ${rec.employee_id}`);
      }
    }

    const txns = records.map((record) => {
      const shift = record.shift;
      const overtime = record.overtime_hours || 0;
      const inTime = new Date(record.in_time);
      const outTime = new Date(record.out_time);

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
  } catch (err) {
    console.error('Attendance marking error:', err);
    throw new Error('Failed to mark attendance');
  }
};
// services/attendance.service.js
exports.getAttendanceByDate = async ({ date, employee_id, shift, status }) => {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1); // Next day for upper bound

  return await prisma.attendance.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
      ...(employee_id && { employee_id }),
      ...(shift && { shift }),
      ...(status && { status }),
    },
    include: {
      employee: {
        select: {
          name: true,
        },
      },
    },
  });
};


  
  exports.getAttendanceRange = async (startDate, endDate) => {
    return await prisma.Attendance.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        employee: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  };


exports.getAllAttendance = async ({ skip = 0, take = 10 } = {}) => {
  // Get total count and paginated data in parallel
  const [total, data] = await Promise.all([
    prisma.attendance.count(),
    prisma.attendance.findMany({
      skip,
      take,
      include: {
        employee: {
          select: { name: true },
        },
      },
      orderBy: {
        date: 'desc', // optional: order by recent first
      },
    }),
  ]);

  return { total, data };
};

exports.createAttendance = async (data) => {
  return await prisma.attendance.create({
    data
  });
};

exports.updateAttendance = async (employeeId, data) => {
  return await prisma.attendance.updateMany({
    where: { employee_id: employeeId },
    data
  });
};

exports.deleteAttendance = async (employeeId) => {
  return await prisma.attendance.deleteMany({
    where: { employee_id: employeeId }
  });
};

exports.getAttendanceSummary = async ({ month, year }) => {
  const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
  const nextMonth = month === '12' ? '01' : String(Number(month) + 1).padStart(2, '0');
  const nextYear = month === '12' ? String(Number(year) + 1) : year;
  const endDate = new Date(`${nextYear}-${nextMonth}-01T00:00:00.000Z`);

  // Fetch all attendance records for the month
  const records = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  const summaryMap = {};

  for (const record of records) {
    const id = record.employee_id;
    if (!summaryMap[id]) {
      summaryMap[id] = {
        employee_id: id,
        workingDays: 0,
        overtimeHours: 0,
        absents: 0,
      };
    }

    switch (record.status) {
      case 'PRESENT':
        summaryMap[id].workingDays += 1;
        break;
      case 'HALF_DAY':
        summaryMap[id].workingDays += 0.5;
        break;
      case 'ABSENT':
        summaryMap[id].absents += 1;
        break;
    }

    summaryMap[id].overtimeHours += record.overtime_hours || 0;
  }

  return {
    month,
    year,
    attendanceSummary: Object.values(summaryMap),
  };
};

exports.getFilteredAttendance = async ({ employee_id, department, shift }) => {
  const where = {
    ...(employee_id && { employee_id }),
    ...(shift && { shift }),
    ...(department && {
      employee: {
        department: department
      }
    }),
  };

  return await prisma.attendance.findMany({
    where,
    include: {
      employee: {
        select: {
          name: true,
          department: true,
        },
      },
    },
  });
};


exports.getAttendanceByMonthYear = async (month, year) => {
  const start = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1); // move to next month

  return await prisma.attendance.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
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
    orderBy: {
      date: 'asc',
    },
  });
};

exports.updateAttendanceWithAudit = async (employeeId, data) => {
  return await prisma.attendance.updateMany({
    where: { employee_id: employeeId },
    data,
  });
};
