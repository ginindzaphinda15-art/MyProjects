const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Vendor-only: upload a single image (used for a service/product photo, a
// business logo, or a profile banner) and get back a URL to store on the
// relevant record (services.image_url, vendors.logo_url, vendors.banner_url).
router.post('/image', authenticate, authorize('vendor'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(422).json({ error: 'No image file was received.' });
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  res.status(201).json({ url: `${base}/uploads/${req.file.filename}` });
});

// Multer errors (bad file type, too large) land here instead of the generic handler
// so the message stays specific to the upload.
router.use((err, req, res, next) => {
  if (err) return res.status(422).json({ error: err.message || 'Could not upload that image.' });
  next();
});

module.exports = router;
