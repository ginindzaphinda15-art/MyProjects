const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerRules, loginRules, handleValidation } = require('../utils/validators');

router.post('/register', registerRules, handleValidation, authController.register);
router.post('/login', loginRules, handleValidation, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
