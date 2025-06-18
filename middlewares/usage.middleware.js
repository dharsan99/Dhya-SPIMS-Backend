const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logUsage = (feature) => async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function (data) {
    res.send = originalSend;
    const result = res.send.call(this, data);
    
    // Log usage after response is sent
    if (res.statusCode >= 200 && res.statusCode < 300) {
      prisma.usage_logs.create({
        data: {
          tenant_id: req.tenant.id,
          feature: feature,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            userAgent: req.headers['user-agent'],
            ip: req.ip
          }
        }
      }).catch(err => {
        console.error('Error logging usage:', err);
      });
    }
    
    return result;
  };
  
  next();
};

module.exports = { logUsage }; 