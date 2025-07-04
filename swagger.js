const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SPIMS API Docs',
      version: '1.0.0',
      description: 'Spinning Mills Intelligent Management System API documentation',
    },
    servers: [
      { url: 'http://localhost:5001' },
      { url: 'http://192.168.0.2:5001' }, // LAN IP for network access
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        tenantId: {
          type: 'apiKey',
          in: 'header',
          name: 'x-tenant-id',
          description: 'Tenant ID required for tenant-based authorization',
        },
      },
      schemas: {
        Settings: {
          type: 'object',
          properties: {
            theme: { type: 'string', example: 'auto' },
            locale: { type: 'string', example: 'en' },
            email_notifications: { type: 'boolean', example: true },
            sms_alerts: { type: 'boolean', example: false },
            production_reminders: { type: 'boolean', example: true },
            plan_type: { type: 'string', example: 'premium' },
            billing_start_date: { type: 'string', format: 'date-time' },
            billing_end_date: { type: 'string', format: 'date-time' },
            integration_ai: { type: 'boolean', example: true },
            integration_tally: { type: 'boolean', example: false },
            feature_toggles: {
              type: 'object',
              additionalProperties: true,
              example: { fiberStockChart: true, advancedReports: false },
            },
          },
        },
        UserSettings: {
          type: 'object',
          properties: {
            theme: { type: 'string', example: 'light' },
            locale: { type: 'string', example: 'en' },
            email_notifications: { type: 'boolean', example: true },
            sms_alerts: { type: 'boolean', example: false },
            feature_toggles: {
              type: 'object',
              additionalProperties: true,
              example: { showDashboardTips: true, compactMode: false },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        tenantId: [],
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "SPIMS API Documentation"
  }));
};

module.exports = setupSwagger;
