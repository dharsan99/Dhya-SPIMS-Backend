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
    tokenNo: newEmployee.tokenNo,
    name: newEmployee.name,
    shiftRate: newEmployee.shiftRate,
    aadharNo: newEmployee.aadharNo,
    bankAcc1: newEmployee.bankAcc1,
    bankAcc2: newEmployee.bankAcc2,
    department: newEmployee.department,
    joinDate: newEmployee.joinDate,
    createdAt: newEmployee.createdAt,
    updatedAt: newEmployee.updatedAt,
  };
};

exports.getAllEmployees = async () => {
  const employees = await prisma.employee.findMany();
  return employees.map((emp) => ({
    id: emp.id,
    tokenNo: emp.tokenNo,
    name: emp.name,
    shiftRate: emp.shiftRate,
    aadharNo: emp.aadharNo,
    bankAcc1: emp.bankAcc1,
    bankAcc2: emp.bankAcc2,
    department: emp.department,
    joinDate: emp.joinDate,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  }));
};

exports.getEmployeeById = async (id) => {
  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp) return null;

  return {
    id: emp.id,
    tokenNo: emp.tokenNo,
    name: emp.name,
    shiftRate: emp.shiftRate,
    aadharNo: emp.aadharNo,
    bankAcc1: emp.bankAcc1,
    bankAcc2: emp.bankAcc2,
    department: emp.department,
    joinDate: emp.joinDate,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  };
};

exports.updateEmployee = async (id, data) => {
  const updatedEmployee = await prisma.employee.update({
    where: { id },
    data: {
      name: data.name,
      shiftRate: data.shiftRate ? parseFloat(data.shiftRate) : undefined,
      aadharNo: data.aadharNo,
      bankAcc1: data.bankAcc1,
      bankAcc2: data.bankAcc2,
      department: data.department,
      joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
    },
  });

  return {
    id: updatedEmployee.id,
    tokenNo: updatedEmployee.tokenNo,
    name: updatedEmployee.name,
    shiftRate: updatedEmployee.shiftRate,
    aadharNo: updatedEmployee.aadharNo,
    bankAcc1: updatedEmployee.bankAcc1,
    bankAcc2: updatedEmployee.bankAcc2,
    department: updatedEmployee.department,
    joinDate: updatedEmployee.joinDate,
    createdAt: updatedEmployee.createdAt,
    updatedAt: updatedEmployee.updatedAt,
  };
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

