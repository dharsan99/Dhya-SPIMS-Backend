const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getTenantSettings = async (tenantId) => {
  const settings = await prisma.setting.findFirst({
    where: { tenantId: tenantId },
  });
  
  // If no settings exist, return default settings
  if (!settings) {
    return {
      theme: "auto",
      locale: "en",
      emailNotifications: true,
      featureToggles: {},
      integrationAi: false,
      integrationTally: false,
      productionReminders: true,
      smsAlerts: false,
      tenantId: tenantId
    };
  }
  
  return settings;
};

exports.updateTenantSettings = async (tenantId, data) => {
  return prisma.setting.upsert({
    where: { tenantId: tenantId },
    update: data,
    create: { tenantId: tenantId, ...data },
  });
};