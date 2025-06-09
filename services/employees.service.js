// services/employees.service.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// Get next token number like EMP001, EMP002...
async function generateTokenNumber() {
  const count = await prisma.employees.count();
  const nextNum = count + 1;
  return `EMP${nextNum.toString().padStart(3, '0')}`;
}

exports.createEmployee = async (data) => {
  // Check if Aadhar number already exists
  const existingEmployee = await prisma.employees.findUnique({
    where: { aadhar_no: data.aadhar_no },
  });

  if (existingEmployee) {
    throw new Error('Employee with this Aadhar number already exists.');
  }

  const token_no = await generateTokenNumber();
  const shift_rate = 200.00;

  const newEmployee = await prisma.employees.create({
    data: {
      ...data,
      join_date: new Date(data.join_date),
      token_no,
      shift_rate,
    },
  });

  return {
    id: newEmployee.id,
    token_no: newEmployee.token_no,
    name: newEmployee.name,
    join_date: newEmployee.join_date,
    created_at: newEmployee.created_at,
    updated_at: newEmployee.updated_at,
  };
};


exports.getAllEmployees = async () => {
  return await prisma.employees.findMany();
};

exports.getEmployeeById = async (id) => {
  return await prisma.employees.findUnique({ where: { id } });
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
