function generateTenantStoragePath(tenantId) {
    return `tenants/${tenantId}/`;
  }
  
  module.exports = {
    generateTenantStoragePath
  };
  