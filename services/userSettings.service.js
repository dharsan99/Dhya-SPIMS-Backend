const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserSettings = async (userId) => {
  return prisma.userSetting.findUnique({
    where: { userId: userId },
  });
};

exports.updateUserSettings = async (userId, data) => {
  return prisma.userSetting.upsert({
    where: { userId: userId },
    update: data,
    create: { userId: userId, ...data },
  });
};