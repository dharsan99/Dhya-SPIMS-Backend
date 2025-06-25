const express = require('express');
const router = express.Router();
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
const subscriptionsController = require('../controllers/subscriptions.controller');
router.use(verifyTokenAndTenant);

// Get all subscriptions
router.get('/', verifyTokenAndTenant, subscriptionsController.getSubscriptions);

// Create subscription
router.post('/', verifyTokenAndTenant, subscriptionsController.createSubscription);

// Update subscription
router.put('/:id', verifyTokenAndTenant, subscriptionsController.updateSubscription);

// Delete subscription
router.delete('/:id', verifyTokenAndTenant, subscriptionsController.deleteSubscription);

module.exports = router;
