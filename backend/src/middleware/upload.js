const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// Everything lands in backend/uploads and is served back out at /uploads/<file>
// (see app.js). Keeping this outside src/ means a redeploy that only ships
// src/ won't accidentally wipe images vendors have already uploaded.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP or GIF images are allowed.'));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES } });

module.exports = { upload, UPLOAD_DIR };
