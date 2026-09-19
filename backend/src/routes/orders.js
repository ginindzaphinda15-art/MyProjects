const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { orderRules, handleValidation } = require('../utils/validators');

router.post('/', authenticate, authorize('customer'), orderRules, handleValidation, orderController.createOrder);
router.get('/mine', authenticate, authorize('customer'), orderController.listMyOrders);

router.get('/vendor', authenticate, authorize('vendor'), orderController.listVendorOrders);
router.patch('/:id/status', authenticate, authorize('vendor'), orderController.updateOrderStatus);

module.exports = router;
