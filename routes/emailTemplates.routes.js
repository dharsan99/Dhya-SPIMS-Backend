const express = require('express');
const router = express.Router();
const controller = require('../controllers/emailTemplates.controller');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');
// Protect all routes with authentication
router.use(verifyTokenAndTenant);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;