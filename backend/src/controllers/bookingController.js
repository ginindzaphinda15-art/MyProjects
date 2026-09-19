const db = require('../config/database');

// --- Scheduling assistant -------------------------------------------------
// A lightweight, deterministic engine that keeps a vendor from ever double
// booking a slot: it knows the vendor's live bookings for a day and can
// answer "is this free?" and "what's free nearby?". Business hours and slot
// size are intentionally simple defaults — easy to make configurable per
// vendor later without changing the API shape.
const BUSINESS_OPEN_MINUTES = 8 * 60; // 08:00
const BUSINESS_CLOSE_MINUTES = 18 * 60; // 18:00
const DEFAULT_SLOT_MINUTES = 30;

function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** All candidate slot start-times (HH:MM) for a day, given a step size in minutes. */
function generateDaySlots(stepMinutes) {
  const slots = [];
  for (let t = BUSINESS_OPEN_MINUTES; t + stepMinutes <= BUSINESS_CLOSE_MINUTES; t += stepMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

/**
 * Computes which times are already taken and which are free for a vendor on
 * a given day, based on their existing (non-cancelled) bookings.
 */
async function checkAvailability(vendorId, date, durationMinutes) {
  const step = durationMinutes && durationMinutes >= 5 ? durationMinutes : DEFAULT_SLOT_MINUTES;

  const existing = await db.query(
    `SELECT booking_time FROM bookings
     WHERE vendor_id = $1 AND booking_date = $2 AND status != 'cancelled'`,
    [vendorId, date]
  );
  const takenTimes = new Set(existing.rows.map((r) => r.booking_time.slice(0, 5)));

  const allSlots = generateDaySlots(step);
  const freeSlots = allSlots.filter((t) => !takenTimes.has(t));

  return { takenTimes: [...takenTimes].sort(), freeSlots };
}

/** Public: suggested/free slots for a vendor on a given date, ahead of booking. */
async function getAvailability(req, res) {
  try {
    const { vendorId, date, serviceId } = req.query;
    if (!vendorId || !date) {
      return res.status(422).json({ error: 'vendorId and date are required.' });
    }

    let durationMinutes = null;
    if (serviceId) {
      const service = await db.query('SELECT duration_minutes FROM services WHERE id = $1 AND vendor_id = $2', [
        serviceId,
        vendorId,
      ]);
      durationMinutes = service.rows[0]?.duration_minutes || null;
    }

    const { takenTimes, freeSlots } = await checkAvailability(vendorId, date, durationMinutes);
    res.json({ takenTimes, freeSlots: freeSlots.slice(0, 12) });
  } catch (err) {
    console.error('getAvailability error', err);
    res.status(500).json({ error: 'Could not check availability.' });
  }
}

/** Customer: create a booking with a vendor for a given service, date and time. */
async function createBooking(req, res) {
  try {
    const { vendorId, serviceId, bookingDate, bookingTime, notes } = req.body;

    const service = await db.query(
      'SELECT * FROM services WHERE id = $1 AND vendor_id = $2 AND is_active = true',
      [serviceId, vendorId]
    );
    if (!service.rows.length) {
      return res.status(404).json({ error: 'That service is not available from this vendor.' });
    }

    // Scheduling assistant: refuse a slot the vendor already has a live
    // booking in, and hand back the nearest free alternatives so the
    // customer doesn't have to guess-and-check.
    const conflict = await db.query(
      `SELECT id FROM bookings
       WHERE vendor_id = $1 AND booking_date = $2 AND booking_time = $3 AND status != 'cancelled'`,
      [vendorId, bookingDate, bookingTime]
    );
    if (conflict.rows.length) {
      const { freeSlots } = await checkAvailability(vendorId, bookingDate, service.rows[0].duration_minutes);
      return res.status(409).json({
        error: 'That time is already booked with this vendor.',
        suggestedTimes: freeSlots.slice(0, 6),
      });
    }

    let result;
    try {
      result = await db.query(
        `INSERT INTO bookings (customer_id, vendor_id, service_id, booking_date, booking_time, price, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [req.user.id, vendorId, serviceId, bookingDate, bookingTime, service.rows[0].price, notes || null]
      );
    } catch (dbErr) {
      // 23505 = unique_violation — someone else grabbed this exact slot a moment ago.
      if (dbErr.code === '23505') {
        const { freeSlots } = await checkAvailability(vendorId, bookingDate, service.rows[0].duration_minutes);
        return res.status(409).json({
          error: 'That time was just booked by someone else.',
          suggestedTimes: freeSlots.slice(0, 6),
        });
      }
      throw dbErr;
    }

    res.status(201).json({ booking: result.rows[0] });
  } catch (err) {
    console.error('createBooking error', err);
    res.status(500).json({ error: 'Could not create booking.' });
  }
}

/** Customer: their own booking history. */
async function listMyBookings(req, res) {
  try {
    const result = await db.query(
      `SELECT b.*, s.name AS service_name, v.business_name AS vendor_name
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN vendors v ON v.id = b.vendor_id
       WHERE b.customer_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [req.user.id]
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('listMyBookings error', err);
    res.status(500).json({ error: 'Could not fetch bookings.' });
  }
}

/** Vendor: the booking queue for their business, optionally filtered by status/date. */
async function listVendorBookings(req, res) {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Create a vendor profile first.' });

    const { status, date } = req.query;
    const conditions = ['b.vendor_id = $1'];
    const params = [vendor.rows[0].id];

    if (status) { params.push(status); conditions.push(`b.status = $${params.length}`); }
    if (date) { params.push(date); conditions.push(`b.booking_date = $${params.length}`); }

    const result = await db.query(
      `SELECT b.*, s.name AS service_name, u.name AS customer_name, u.phone AS customer_phone
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.customer_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.booking_date ASC, b.booking_time ASC`,
      params
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('listVendorBookings error', err);
    res.status(500).json({ error: 'Could not fetch bookings.' });
  }
}

const ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

/** Vendor: advance/change the status of one of their bookings. */
async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(422).json({ error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const result = await db.query(
      `UPDATE bookings b SET status = $1, updated_at = now()
       FROM vendors v
       WHERE b.id = $2 AND b.vendor_id = v.id AND v.user_id = $3
       RETURNING b.*`,
      [status, id, req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found.' });
    res.json({ booking: result.rows[0] });
  } catch (err) {
    console.error('updateBookingStatus error', err);
    res.status(500).json({ error: 'Could not update booking.' });
  }
}

/** Customer: cancel their own booking, as long as it hasn't already been completed. */
async function cancelMyBooking(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = now()
       WHERE id = $1 AND customer_id = $2 AND status != 'completed'
       RETURNING *`,
      [id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found or cannot be cancelled.' });
    res.json({ booking: result.rows[0] });
  } catch (err) {
    console.error('cancelMyBooking error', err);
    res.status(500).json({ error: 'Could not cancel booking.' });
  }
}

module.exports = {
  createBooking,
  listMyBookings,
  listVendorBookings,
  updateBookingStatus,
  cancelMyBooking,
  getAvailability,
};
