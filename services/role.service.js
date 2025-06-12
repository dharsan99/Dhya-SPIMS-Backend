const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getRolesByTenant = async (tenantId) => {
  return prisma.roles.findMany({
    where: { tenant_id: tenantId },
    include: {
      user_roles: true,
      role_permissions: true,
    },
    orderBy: { created_at: 'desc' },
  });
};

exports.createRole = async (roleData) => {
  return prisma.roles.create({
    data: {
      tenant_id: roleData.tenant_id,
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions,
    },
  });
};
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