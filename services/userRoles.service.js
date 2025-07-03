const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validate: isUuid } = require('uuid');
class UserRolesService {
  async createRole(roleData) {
    return prisma.roles.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        is_active: roleData.is_active !== undefined ? roleData.is_active : true,
      },
    });
  }

  async getRoleById(roleId) {
    return prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        user_roles: true,
      },
    });
  }
  async getAllRoles(query) {
    const { page = 1, limit = 10, search = '', tenantId } = query;
  
    const skip = (page - 1) * limit;
  
    const where = {
      tenantId, // Ensure this is part of your roles schema
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
  
    const [roles, count] = await prisma.$transaction([
      prisma.roles.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          permissions: true,
        },
      }),
      prisma.roles.count({ where }),
    ]);
  
    return {
      data: roles,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
  

  async updateRole(roleId, updateData) {
    return prisma.roles.update({
      where: { id: roleId },
      data: {
        ...updateData,
        is_active: updateData.is_active !== undefined ? updateData.is_active : undefined,
      },
    });
  }

  async deleteRole(roleId) {
    return prisma.roles.delete({
      where: { id: roleId },
    });
  }

  

  async getUsersWithRolesByTenant({ tenant_id }) {
    // ✅ UUID validation to prevent Prisma error
    if (!isUuid(tenant_id)) {
      throw new Error('Invalid tenant_id format');
    }
  
    // ✅ Fetch users with their roles for the given tenant
    const users = await prisma.users.findMany({
      where: {
        user_roles: {
          some: {
            role: {
              tenant_id: tenant_id,
            },
          },
        },
      },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });
  
    // ✅ Format the response
    return users.map((user) => {
      const primaryRole = user.user_roles[0]?.role;
  
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: primaryRole
          ? {
              id: primaryRole.id,
              name: primaryRole.name,
              permissions:
                typeof primaryRole.permissions === 'string'
                  ? JSON.parse(primaryRole.permissions)
                  : primaryRole.permissions,
              tenant_id: primaryRole.tenant_id,
            }
          : null,
      };
    });
  }
  
}



module.exports = new UserRolesService();