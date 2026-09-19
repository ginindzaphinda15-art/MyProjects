const { validationResult, body } = require('express-validator');

/** Runs at the end of a validator chain; returns 422 with field errors if any failed. */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['customer', 'vendor']).withMessage('Role must be customer or vendor'),
  body('phone').optional().trim(),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const vendorProfileRules = [
  body('businessName').trim().notEmpty().withMessage('Business name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('address').optional().trim(),
  body('description').optional().trim(),
  body('logoUrl').optional({ checkFalsy: true }).isURL({ require_tld: false }).withMessage('logoUrl must be a valid URL'),
  body('bannerUrl').optional({ checkFalsy: true }).isURL({ require_tld: false }).withMessage('bannerUrl must be a valid URL'),
  body('brandColor').optional({ checkFalsy: true }).matches(/^#[0-9A-Fa-f]{6}$/).withMessage('brandColor must be a hex color like #0B63C9'),
  body('latitude').optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  body('longitude').optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180'),
];

const serviceRules = [
  body('name').trim().notEmpty().withMessage('Service name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('durationMinutes').optional().isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
  body('imageUrl').optional({ checkFalsy: true }).isURL({ require_tld: false }).withMessage('imageUrl must be a valid URL'),
];

const bookingRules = [
  body('vendorId').isInt().withMessage('vendorId is required'),
  body('serviceId').isInt().withMessage('serviceId is required'),
  body('bookingDate').isISO8601().withMessage('bookingDate must be a valid date (YYYY-MM-DD)'),
  body('bookingTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('bookingTime must be HH:MM'),
  body('notes').optional().trim(),
];

const orderRules = [
  body('vendorId').isInt().withMessage('vendorId is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.serviceId').isInt().withMessage('Each item needs a serviceId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  vendorProfileRules,
  serviceRules,
  bookingRules,
  orderRules,
};
