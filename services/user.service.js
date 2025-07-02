// services/user.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UserService {
  async createUser(userData) {
    const { tenant_id, name, email, password_hash, is_active, role_id } = userData;

    // 1. Create user
    const user = await prisma.users.create({
      data: {
        tenant_id,
        name,
        email,
        password_hash,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    // 2. Assign role if role_id is provided
    let roleDetails = null;
    if (role_id) {
      await prisma.user_roles.create({
        data: {
          user_id: user.id,
          role_id,
        },
      });

      // Get role details for response
      roleDetails = await prisma.roles.findUnique({
        where: { id: role_id },
        select: {
          name: true,
          permissions: true,
        },
      });

      // Update the user's role column in the users table
      if (roleDetails) {
        await prisma.users.update({
          where: { id: user.id },
          data: { role: roleDetails.name },
        });
      }
    }

    // 3. Return created user + assigned role
    return {
      ...user,
      role: roleDetails ? roleDetails.name : null,
    };
  }

  async getUserById(userId) {
    return prisma.users.findUnique({
      where: { id: userId },
      include: {
        tenants: true,
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async getAllUsers(query) {
    const { tenant_id, page = 1, limit = 10, search = '' } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(tenant_id && { tenant_id }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, count] = await prisma.$transaction([
      prisma.users.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          tenants: true,
          user_roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.users.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async updateUser(userId, updateData) {
    return prisma.users.update({
      where: { id: userId },
      data: {
        ...updateData,
        is_active: updateData.is_active !== undefined ? updateData.is_active : undefined,
      },
    });
  }

  async deleteUser(userId) {
    return prisma.users.delete({
      where: { id: userId },
    });
  }

  async getAllUsersRoles({ tenant_id }) {
    const roles = await prisma.roles.findMany({
      where: {
        tenant_id,
      },
      include: {
        permissions: true, // assumes permissions is a JSON or relation field
      },
    });
  
    return {
      data: roles,
      meta: {
        total: roles.length,
        tenant_id,
      },
    };
  }
  
  
}


module.exports = new UserService();
