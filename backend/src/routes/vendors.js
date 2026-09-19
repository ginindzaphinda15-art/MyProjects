const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticate, authorize } = require('../middleware/auth');
const { vendorProfileRules, handleValidation } = require('../utils/validators');

// Public browsing
router.get('/', vendorController.listVendors);
router.get('/me', authenticate, authorize('vendor'), vendorController.getMyProfile);
router.get('/:id', vendorController.getVendor);

// Vendor-only profile management
router.put('/me', authenticate, authorize('vendor'), vendorProfileRules, handleValidation, vendorController.upsertMyProfile);

module.exports = router;
