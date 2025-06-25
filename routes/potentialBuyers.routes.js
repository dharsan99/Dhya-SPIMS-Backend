const express = require('express');
const router = express.Router();
const controller = require('../controllers/potentialBuyers.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
router.use(verifyTokenAndTenant);
// GET all potential buyers
router.get('/', controller.getAllPotentialBuyers);

// POST bulk upload from Excel
router.post('/upload', controller.bulkUpload);

module.exports = router;