const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.updateRole = async (id, data) => {
  return await prisma.roles.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      updated_at: new Date()
    }
  });
};

exports.deleteRole = async (id) => {
  return prisma.roles.delete({
    where: { id }
  });
};