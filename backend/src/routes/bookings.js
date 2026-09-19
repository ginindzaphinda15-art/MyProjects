const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');
const { bookingRules, handleValidation } = require('../utils/validators');

// Public: lets the booking form show which times are already taken (and
// suggest free ones) before the customer even submits.
router.get('/availability', bookingController.getAvailability);

router.post('/', authenticate, authorize('customer'), bookingRules, handleValidation, bookingController.createBooking);
router.get('/mine', authenticate, authorize('customer'), bookingController.listMyBookings);
router.patch('/:id/cancel', authenticate, authorize('customer'), bookingController.cancelMyBooking);

router.get('/vendor', authenticate, authorize('vendor'), bookingController.listVendorBookings);
router.patch('/:id/status', authenticate, authorize('vendor'), bookingController.updateBookingStatus);

module.exports = router;
