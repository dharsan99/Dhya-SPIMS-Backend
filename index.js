const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 🔁 Swagger Docs
const setupSwagger = require('./swagger');
setupSwagger(app);

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('SPIMS API is running ✅');
});

// ✅ Import All Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const tenantRoutes = require('./routes/tenants.routes');
const brandRoutes = require('./routes/brands.routes');
const blendRoutes = require('./routes/blends.routes');
const shadeRoutes = require('./routes/shades.routes');
const yarnTypeRoutes = require('./routes/yarnTypes.routes');
const yarnRoutes = require('./routes/yarns.routes');
const fileRoutes = require('./routes/files.routes');
const orderRoutes = require('./routes/orders.routes');
const machineRoutes = require('./routes/machines.routes');
const productionRoutes = require('./routes/production.routes');
const supplierRoutes = require('./routes/suppliers.routes');

// ✅ Register Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tenants', tenantRoutes);
app.use('/brands', brandRoutes);
app.use('/blends', blendRoutes);
app.use('/shades', shadeRoutes);
app.use('/yarn-types', yarnTypeRoutes);
app.use('/yarns', yarnRoutes);
app.use('/files', fileRoutes);
app.use('/orders', orderRoutes);
app.use('/machines', machineRoutes);
app.use('/production', productionRoutes);
app.use('/suppliers', supplierRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 SPIMS API server running at: http://localhost:${PORT}`);
});