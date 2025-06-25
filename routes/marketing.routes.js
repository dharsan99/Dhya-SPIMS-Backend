const express = require('express');
const router = express.Router();
const controller = require('../controllers/marketing.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
router.use(verifyTokenAndTenant);

router.post('/send', controller.sendBulkEmail);
router.get('/campaigns', controller.getCampaigns); // ✅ FIXED

module.exports = router;