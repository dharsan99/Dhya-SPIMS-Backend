const express = require('express');
const router = express.Router();
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
const aiController = require('../controllers/ai.controller');

// AI Insights routes
router.get('/insights', verifyTokenAndTenant, aiController.getAiInsights);
router.post('/insights/generate', verifyTokenAndTenant, aiController.generateInsights);

// Predictive Models routes
router.get('/predictive-models', verifyTokenAndTenant, aiController.getPredictiveModels);
router.post('/predictive-models/train', verifyTokenAndTenant, aiController.trainModel);
router.get('/predictive-models/:modelId', verifyTokenAndTenant, aiController.getModelDetails);

// Predictions routes
router.post('/predictions/generate', verifyTokenAndTenant, aiController.generatePrediction);
router.get('/predictions/:modelId/history', verifyTokenAndTenant, aiController.getPredictionHistory);

// Recommendations routes
router.get('/recommendations', verifyTokenAndTenant, aiController.getRecommendations);
router.post('/recommendations/:recommendationId/apply', verifyTokenAndTenant, aiController.applyRecommendation);
router.post('/recommendations/generate', verifyTokenAndTenant, aiController.generateRecommendations);

// Real-time AI data
router.get('/real-time', verifyTokenAndTenant, aiController.getRealTimeAiData);

module.exports = router; 