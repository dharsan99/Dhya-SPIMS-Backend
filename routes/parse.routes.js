const express = require('express');
const router = express.Router();
const parseController = require('../controllers/parse.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
router.use(verifyTokenAndTenant);
router.post('/', parseController.parsePurchaseOrderText);

module.exports = router;