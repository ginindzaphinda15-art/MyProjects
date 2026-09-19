const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/uploads');
const { UPLOAD_DIR } = require('./middleware/upload');

const app = express();

// Vendor logos, banners, and catalog photos need cross-origin loading (the
// frontend runs on a different origin), so relax helmet's default resource
// policy just for the static file middleware below.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'esebelink-marketplace-api' }));

// Publicly served images: vendor logos/banners, service/product catalog photos.
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

module.exports = app;
