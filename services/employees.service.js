const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate next token like EMP001, EMP002...
async function generateTokenNumber() {
  const count = await prisma.employees.count();
  const nextNum = count + 1;
  return `EMP${nextNum.toString().padStart(3, '0')}`;
}

exports.createEmployee = async (data) => {
  const existingEmployee = await prisma.employees.findUnique({
    where: { aadhar_no: data.aadhar_no },
  });

  if (existingEmployee) {
    throw new Error('Employee with this Aadhar number already exists.');
  }

  const token_no = await generateTokenNumber();

  const newEmployee = await prisma.employees.create({
    data: {
      name: data.name,
      token_no,
      shift_rate: parseFloat(data.shift_rate), // ✅ use from input
      aadhar_no: data.aadhar_no,
      bank_acc_1: data.bank_acc_1,
      bank_acc_2: data.bank_acc_2,
      department: data.department,
      join_date: data.join_date ? new Date(data.join_date) : undefined,
    },
  });

  return {
    id: newEmployee.id,
    token_no: newEmployee.token_no,
    name: newEmployee.name,
    shift_rate: newEmployee.shift_rate,
    join_date: newEmployee.join_date,
    created_at: newEmployee.created_at,
    updated_at: newEmployee.updated_at,
  };
};

exports.getAllEmployees = async () => {
  const employees = await prisma.employees.findMany();
  return employees.map((emp) => ({
    id: emp.id,
    token_no: emp.token_no,
    name: emp.name,
    shift_rate: emp.shift_rate,
    aadhar_no: emp.aadhar_no,
    bank_acc_1: emp.bank_acc_1,
    bank_acc_2: emp.bank_acc_2,
    department: emp.department,
    join_date: emp.join_date,
    created_at: emp.created_at,
    updated_at: emp.updated_at,
  }));
};

exports.getEmployeeById = async (id) => {
  const emp = await prisma.employees.findUnique({ where: { id } });
  if (!emp) return null;

  return {
    id: emp.id,
    token_no: emp.token_no,
    name: emp.name,
    shift_rate: emp.shift_rate,
    aadhar_no: emp.aadhar_no,
    bank_acc_1: emp.bank_acc_1,
    bank_acc_2: emp.bank_acc_2,
    department: emp.department,
    join_date: emp.join_date,
    created_at: emp.created_at,
    updated_at: emp.updated_at,
  };
};

exports.updateEmployee = async (id, data) => {
  return await prisma.employees.update({
    where: { id },
    data,
  });
};

exports.deleteEmployee = async (id) => {
  return await prisma.employees.delete({ where: { id } });
};
