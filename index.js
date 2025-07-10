const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { verifyTokenAndTenant } = require('./middlewares/auth.middleware');
const loadRoutes = require('./loadRoutes');


dotenv.config();
const app = express();
const prisma = new PrismaClient();

// ✅ Middleware
app.use(
  cors({
    origin: true, // Allow all origins for development
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.options('*', cors()); // handle preflight requests
// ✅ Swagger Docs
const setupSwagger = require('./swagger');
setupSwagger(app);

// ✅ Health Check
app.get('/', (req, res) => res.send('SPIMS API is running ✅'));
loadRoutes(app);
// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SPIMS API server running at: http://localhost:${PORT}`);
  console.log(`SPIMS API server running at: http://<your-ip>:${PORT}`);
  console.log(`SPIMS SWAGGER API running at: http://localhost:5001/docs/`);
});