// loadRoutes.js
const fs = require('fs');
const path = require('path');

const loadRoutes = (app, dir = path.join(__dirname, 'routes')) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    // Skip if not a .js file or if file is empty
    if (!file.endsWith('.js') || fs.statSync(fullPath).size === 0) {
      return;
    }

    try {
      const routeName = file.replace('.routes.js', '').replace('.js', '');
      const router = require(fullPath);

      // Special case handling for route paths
      const mountPath = {
        auth: '/auth',
        users: '/users',
        tenants: '/tenants',
        register: '/register',
        subscriptions: '/subscriptions',
        blends: '/blends',
        blendFibres: '/blend-fibres',
        fibres: '/fibres',
        shades: '/shades',
        orders: '/orders',
        buyers: '/buyers',
        productions: '/productions',
        settings: '/settings',
        userSettings: '/user-settings',
        roles: '/roles',
        mailingLists: '/mailing-lists',
        plans: '/plans',
        suppliers: '/suppliers',
        fibreTransfers: '/fibre-transfers',
        employees: '/employees',
        emailTemplates: '/email-templates',
        marketing: '/marketing',
        attendance: '/attendance',
        potentialBuyers: '/potential-buyers',
        dashboard: '/dashboard',
        purchaseOrders: '/purchase-orders',
        parse: '/parse',
        verify: '/', // root-mount (e.g., /ping, /verify endpoints)
        userRoleAssignments: '/user-role-assignments',
        userRoles: '/user-roles',
        billing: '/billing', // <-- add this line
        //userRoleAssignments: '/user-role-assignments',
      }[routeName] || `/${routeName}`;

      // Only mount if router is a valid Express router
      if (router && typeof router === 'function') {
        //console.log(`Mounting route: ${mountPath} from ${file}`);
        app.use(mountPath, router);
      } else {
        console.warn(`Warning: Invalid router in ${file} - skipping`);
      }
    } catch (error) {
      console.error(`Error loading route ${file}:`, error.message);
    }
  });
};

module.exports = loadRoutes;