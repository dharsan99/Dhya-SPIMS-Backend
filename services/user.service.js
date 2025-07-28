const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const userService = {
  async createUser(data) {
    const { name, email, password, tenantId, roleId, isActive = true } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.users.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          tenantId,
          isActive,
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Assign the role to the user
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleId
        }
      });

      // Return the user with role information
      return await tx.users.findUnique({
        where: { id: user.id },
        include: {
          userRoles: {
            include: {
              role: true
            }
          },
          userSettings: true
        }
      });
    });
  },

  async getUserById(id) {
    return prisma.users.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        userSettings: true,
        tenant: true
      }
    });
  },

  async getAllUsers(query) {
    const { tenantId, page = 1, limit = 10, search } = query;
    const where = {};
    
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [users, count] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take,
        include: {
          userRoles: { 
            include: { 
              role: true 
            } 
          },
          userSettings: true,
          tenant: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.users.count({ where })
    ]);
    
    return {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / take),
        totalItems: count,
        itemsPerPage: take
      }
    };
  },

  async updateUser(id, data) {
    const updateData = { ...data };
    
    // Handle password update
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }
    
    // Handle role assignment
    if (data.roleId) {
      // First, remove existing role assignments
      await prisma.userRole.deleteMany({
        where: { userId: id }
      });
      
      // Then assign the new role
      await prisma.userRole.create({
        data: {
          userId: id,
          roleId: data.roleId
        }
      });
      
      delete updateData.roleId;
    }
    
    // Update timestamp
    updateData.updatedAt = new Date();

    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        userSettings: true,
        tenant: true
      }
    });

    return updatedUser;
  },

  async deleteUser(id) {
    // First delete user roles
    await prisma.userRole.deleteMany({
      where: { userId: id }
    });

    // Then delete user settings
    await prisma.userSetting.deleteMany({
      where: { userId: id }
    });

    // Finally delete the user
    return prisma.users.delete({
      where: { id }
    });
  },

  async assignRole(userId, roleId) {
    // First remove any existing role assignments for this user
    await prisma.userRole.deleteMany({
      where: { userId }
    });

    // Then assign the new role
    return prisma.userRole.create({
      data: {
        userId: userId,
        roleId: roleId
      }
    });
  },

  async getAllUsersRoles({ tenantId }) {
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
};

module.exports = userService;
