// services/user.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

class UserService {
  async createUser(userData) {
    const { tenant_id, name, email, password, is_active, role_id, is_verified } = userData;

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // 1. Create user
    const user = await prisma.users.create({
      data: {
        tenant_id,
        name,
        email,
        password_hash,
        is_active: is_active !== undefined ? is_active : true,
        is_verified: is_verified !== undefined ? is_verified : false,
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
      is_verified: user.is_verified,
    };
  }

  async getUserById(userId) {
    const user = await prisma.users.findUnique({
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
    if (!user) return null;
    const roleObj = user.user_roles && user.user_roles.length > 0 ? user.user_roles[0].role : null;
    const { user_roles, ...rest } = user;
    return {
      ...rest,
      role: roleObj,
      is_verified: user.is_verified,
    };
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

    // Transform users: add top-level 'role' and remove 'user_roles'
    const transformedUsers = users.map(user => {
      const roleObj = user.user_roles && user.user_roles.length > 0
        ? user.user_roles[0].role
        : null;
      const { user_roles, ...rest } = user;
      return {
        ...rest,
        role: roleObj,
        is_verified: user.is_verified,
      };
    });

    return {
      data: transformedUsers,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async updateUser(userId, updateData) {
    // If role_id is present, update user_roles and user's role column
    if (updateData.role_id) {
      // Remove all existing user_roles for this user
      await prisma.user_roles.deleteMany({ where: { user_id: userId } });

      // Assign the new role
      await prisma.user_roles.create({
        data: {
          user_id: userId,
          role_id: updateData.role_id,
        },
      });

      // Get the new role's name and permissions
      const role = await prisma.roles.findUnique({
        where: { id: updateData.role_id },
        select: { id: true, name: true, permissions: true, tenant_id: true },
      });

      // Update the user's role column
      await prisma.users.update({
        where: { id: userId },
        data: { role: role.name },
      });
    }

    // Update other user fields (excluding role_id)
    const { role_id, ...otherFields } = updateData;
    await prisma.users.update({
      where: { id: userId },
      data: {
        ...otherFields,
        is_active: updateData.is_active !== undefined ? updateData.is_active : undefined,
      },
    });

    // Return the updated user with the new role object (not user_roles array)
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    // Get the assigned role object
    const userRole = await prisma.user_roles.findFirst({
      where: { user_id: userId },
      include: { role: true },
    });
    return {
      ...user,
      role: userRole ? {
        id: userRole.role.id,
        name: userRole.role.name,
        permissions: userRole.role.permissions,
        tenant_id: userRole.role.tenant_id,
      } : null,
      is_verified: user.is_verified,
    };
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
