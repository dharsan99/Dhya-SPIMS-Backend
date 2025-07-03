const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UserRolesAssignmentsService {
  async assignRoleToUser(data) {
    const { user_id, role_id } = data;
    
    // Check if user exists
    const user = await prisma.users.findUnique({ where: { id: user_id } });
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if role exists
    const role = await prisma.roles.findUnique({ where: { id: role_id } });
    if (!role) {
      throw new Error('Role not found');
    }
    
    // Check if assignment already exists
    const existingAssignment = await prisma.user_roles.findFirst({
      where: { user_id, role_id }
    });
    
    if (existingAssignment) {
      throw new Error('User already has this role');
    }
    
    return prisma.user_roles.create({
      data: {
        user_id,
        role_id,
      },
      include: {
        user: true,
        role: true,
      },
    });
  }

  async removeRoleFromUser(assignmentId) {
    return prisma.user_roles.delete({
      where: { id: assignmentId },
    });
  }

  async getUserRoles(userId) {
    return prisma.user_roles.findMany({
      where: { user_id: userId },
      include: {
        role: true,
      },
    });
  }
}

module.exports = new UserRolesAssignmentsService();