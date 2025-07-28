const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate next token like EMP001, EMP002...
async function generateTokenNumber() {
  const count = await prisma.employee.count();
  const nextNum = count + 1;
  return `EMP${nextNum.toString().padStart(3, '0')}`;
}

exports.createEmployee = async (data) => {
  const existingEmployee = await prisma.employee.findUnique({
    where: { aadharNo: data.aadharNo },
  });

  if (existingEmployee) {
    throw new Error('Employee with this Aadhar number already exists.');
  }

  const tokenNo = await generateTokenNumber();

  const newEmployee = await prisma.employee.create({
    data: {
      name: data.name,
      tokenNo,
      shiftRate: parseFloat(data.shiftRate), // ✅ use from input
      aadharNo: data.aadharNo,
      bankAcc1: data.bankAcc1,
      bankAcc2: data.bankAcc2,
      department: data.department,
      joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
    },
  });

  return {
    id: newEmployee.id,
    token_no: newEmployee.tokenNo,
    name: newEmployee.name,
    shift_rate: newEmployee.shiftRate,
    join_date: newEmployee.joinDate,
    created_at: newEmployee.createdAt,
    updated_at: newEmployee.updatedAt,
  };
};

exports.getAllEmployees = async () => {
  const employees = await prisma.employee.findMany();
  return employees.map((emp) => ({
    id: emp.id,
    token_no: emp.tokenNo,
    name: emp.name,
    shift_rate: emp.shiftRate,
    aadhar_no: emp.aadharNo,
    bank_acc_1: emp.bankAcc1,
    bank_acc_2: emp.bankAcc2,
    department: emp.department,
    join_date: emp.joinDate,
    created_at: emp.createdAt,
    updated_at: emp.updatedAt,
  }));
};

exports.getEmployeeById = async (id) => {
  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp) return null;

  return {
    id: emp.id,
    token_no: emp.tokenNo,
    name: emp.name,
    shift_rate: emp.shiftRate,
    aadhar_no: emp.aadharNo,
    bank_acc_1: emp.bankAcc1,
    bank_acc_2: emp.bankAcc2,
    department: emp.department,
    join_date: emp.joinDate,
    created_at: emp.createdAt,
    updated_at: emp.updatedAt,
  };
};

exports.updateEmployee = async (id, data) => {
  return await prisma.employee.update({
    where: { id },
    data,
  });
};

exports.deleteEmployee = async (id) => {
  return await prisma.$transaction([
    prisma.attendance.deleteMany({
      where: { employeeId: id },
    }),
    prisma.employee.delete({
      where: { id },
    }),
  ]);
};

exports.getAllDepartments = async () => {
  const departments = await prisma.employee.findMany({
    where: { department: { not: null } },
    select: { department: true },
    distinct: ['department'],
  });
  // Return as a flat array of strings
  return departments.map(d => d.department);
};

