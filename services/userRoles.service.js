const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validate: isUuid } = require('uuid');

class UserRolesService {
  async createRole(roleData) {
    const { name, description, permissions, tenantId } = roleData;
    
    if (!name || !tenantId) {
      throw new Error('Name and tenantId are required');
    }

    return prisma.role.create({
      data: {
        name,
        description,
        permissions,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        }
      }
    });
  }

  async getRoleById(roleId) {
    if (!isUuid(roleId)) {
      throw new Error('Invalid roleId format');
    }

    return prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        },
        tenant: true
      }
    });
  }

  async getAllRoles(query) {
    const { page = 1, limit = 10, search = '', tenantId } = query;
  
    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
  
    const where = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
  
    const [roles, count] = await prisma.$transaction([
      prisma.role.findMany({
        where,
        skip,
        take,
        include: {
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  isActive: true
                }
              }
            }
          },
          tenant: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.role.count({ where }),
    ]);
  
    return {
      data: roles,
      meta: {
        total: count,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(count / take),
      },
    };
  }

  async updateRole(roleId, updateData) {
    if (!isUuid(roleId)) {
      throw new Error('Invalid roleId format');
    }

    const { name, description, permissions } = updateData;
    
    return prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        description,
        permissions,
        updatedAt: new Date(),
      },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        },
        tenant: true
      }
    });
  }

  async deleteRole(roleId) {
    if (!isUuid(roleId)) {
      throw new Error('Invalid roleId format');
    }

    // Check if role has assigned users
    const roleWithUsers = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: true
      }
    });

    if (roleWithUsers && roleWithUsers.userRoles.length > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    return prisma.role.delete({
      where: { id: roleId },
    });
  }

  async assignRoleToUser(userId, roleId) {
    if (!isUuid(userId) || !isUuid(roleId)) {
      throw new Error('Invalid userId or roleId format');
    }

    // First remove any existing role assignments for this user
    await prisma.userRole.deleteMany({
      where: { userId }
    });

    // Then assign the new role
    return prisma.userRole.create({
      data: {
        userId,
        roleId
      },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      }
    });
  }

  async getUsersWithRolesByTenant({ tenantId }) {
    if (!isUuid(tenantId)) {
      throw new Error('Invalid tenantId format');
    }
  
    const users = await prisma.users.findMany({
      where: {
        tenantId,
        userRoles: {
          some: {
            role: {
              tenantId: tenantId,
            },
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  
    return users.map((user) => {
      const primaryRole = user.userRoles[0]?.role;
  
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        role: primaryRole
          ? {
              id: primaryRole.id,
              name: primaryRole.name,
              permissions: primaryRole.permissions,
              tenantId: primaryRole.tenantId,
            }
          : null,
      };
    });
  }

  async getRolesByTenant(tenantId) {
    if (!isUuid(tenantId)) {
      throw new Error('Invalid tenantId format');
    }

    return prisma.role.findMany({
      where: { tenantId },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

module.exports = new UserRolesService();