const db = require('../config/database');
const momoService = require('../services/momoService');

/** Customer: kick off a MoMo "request to pay" for a booking or order. */
async function initiate(req, res) {
  try {
    const { amount, phone, bookingId, orderId } = req.body;

    if (!bookingId && !orderId) {
      return res.status(422).json({ error: 'Provide either a bookingId or an orderId to pay for.' });
    }

    const description = bookingId ? `Booking #${bookingId}` : `Order #${orderId}`;
    const { referenceId } = await momoService.requestToPay({ amount, phone, description });

    const result = await db.query(
      `INSERT INTO payments (customer_id, booking_id, order_id, amount, phone, provider, provider_reference, status)
       VALUES ($1, $2, $3, $4, $5, 'mtn_momo', $6, 'pending')
       RETURNING *`,
      [req.user.id, bookingId || null, orderId || null, amount, phone, referenceId]
    );

    res.status(202).json({
      payment: result.rows[0],
      message: 'Payment request sent. Approve it on your phone to complete the transaction.',
    });
  } catch (err) {
    console.error('payment initiate error', err.response?.data || err);
    res.status(502).json({ error: 'Could not reach the mobile money provider. Please try again.' });
  }
}

/** Customer/vendor: poll the current status of a payment and sync it with MoMo. */
async function checkStatus(req, res) {
  try {
    const { id } = req.params;
    const paymentResult = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (!paymentResult.rows.length) return res.status(404).json({ error: 'Payment not found.' });

    const payment = paymentResult.rows[0];
    const momoStatus = await momoService.getPaymentStatus(payment.provider_reference);
    const normalizedStatus = momoStatus.status.toLowerCase(); // successful | failed | pending

    if (normalizedStatus !== payment.status) {
      await db.query('UPDATE payments SET status = $1, updated_at = now() WHERE id = $2', [normalizedStatus, id]);

      if (normalizedStatus === 'successful') {
        if (payment.booking_id) {
          await db.query(`UPDATE bookings SET status = 'confirmed' WHERE id = $1`, [payment.booking_id]);
        }
        if (payment.order_id) {
          await db.query(`UPDATE orders SET status = 'preparing' WHERE id = $1`, [payment.order_id]);
        }
      }
    }

    res.json({ payment: { ...payment, status: normalizedStatus }, providerDetail: momoStatus });
  } catch (err) {
    console.error('payment checkStatus error', err.response?.data || err);
    res.status(502).json({ error: 'Could not confirm payment status. Please try again shortly.' });
  }
}

/** MTN MoMo calls this webhook when a payment resolves (configured via MOMO_CALLBACK_URL). */
async function momoCallback(req, res) {
  try {
    const { referenceId, status } = req.body;
    if (referenceId && status) {
      await db.query(
        'UPDATE payments SET status = $1, updated_at = now() WHERE provider_reference = $2',
        [String(status).toLowerCase(), referenceId]
      );
    }
    res.status(200).send();
  } catch (err) {
    console.error('momoCallback error', err);
    res.status(200).send(); // Ack anyway so the provider doesn't retry indefinitely.
  }
}

module.exports = { initiate, checkStatus, momoCallback };
