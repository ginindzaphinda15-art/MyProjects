const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticate, authorize } = require('../middleware/auth');
const { serviceRules, handleValidation } = require('../utils/validators');

// All service-management routes are vendor-only and scoped to req.user's own vendor profile.
router.get('/mine', authenticate, authorize('vendor'), vendorController.listMyServices);
router.post('/', authenticate, authorize('vendor'), serviceRules, handleValidation, vendorController.createService);
router.put('/:id', authenticate, authorize('vendor'), vendorController.updateService);
router.delete('/:id', authenticate, authorize('vendor'), vendorController.deleteService);

module.exports = router;
