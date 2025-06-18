const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const auditLog = (entityType) => async (req, res, next) => {
  const originalSend = res.send;
  const originalBody = { ...req.body };
  
  res.send = function (data) {
    res.send = originalSend;
    const result = res.send.call(this, data);
    
    // Log audit after response is sent
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const action = req.method === 'POST' ? 'CREATE' :
                    req.method === 'PUT' ? 'UPDATE' :
                    req.method === 'DELETE' ? 'DELETE' :
                    'VIEW';
                    
      const entityId = req.params.id || 
                      (data && data.id) || 
                      (data && data.data && data.data.id);
      
      if (entityId) {
        prisma.audit_logs.create({
          data: {
            tenant_id: req.tenant.id,
            user_id: req.user.id,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            changes: {
              before: req.method === 'PUT' ? originalBody : null,
              after: req.method === 'PUT' ? req.body : null,
              metadata: {
                method: req.method,
                path: req.path,
                userAgent: req.headers['user-agent'],
                ip: req.ip
              }
            }
          }
        }).catch(err => {
          console.error('Error logging audit:', err);
        });
      }
    }
    
    return result;
  };
  
  next();
};

module.exports = { auditLog }; 