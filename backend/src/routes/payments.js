const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { paymentInitiateRules, handleValidation } = require('../utils/validators');

router.post('/momo/initiate', authenticate, paymentInitiateRules, handleValidation, paymentController.initiate);
router.get('/:id/status', authenticate, paymentController.checkStatus);

// Called by MTN MoMo directly — no auth header from them, so this stays outside `authenticate`.
router.post('/momo/callback', paymentController.momoCallback);

module.exports = router;
