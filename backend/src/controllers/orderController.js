const db = require('../config/database');

/** Customer: place an order with one or more items from a single vendor. */
async function createOrder(req, res) {
  const client = await db.getClient();
  try {
    const { vendorId, items, notes } = req.body;

    await client.query('BEGIN');

    const serviceIds = items.map((i) => i.serviceId);
    const servicesResult = await client.query(
      `SELECT * FROM services WHERE vendor_id = $1 AND id = ANY($2::int[]) AND is_active = true`,
      [vendorId, serviceIds]
    );
    const serviceMap = new Map(servicesResult.rows.map((s) => [s.id, s]));

    if (serviceMap.size !== serviceIds.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'One or more items are not available from this vendor.' });
    }

    const total = items.reduce((sum, item) => {
      const service = serviceMap.get(item.serviceId);
      return sum + Number(service.price) * item.quantity;
    }, 0);

    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, vendor_id, total_amount, notes, status)
       VALUES ($1, $2, $3, $4, 'received') RETURNING *`,
      [req.user.id, vendorId, total, notes || null]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      const service = serviceMap.get(item.serviceId);
      await client.query(
        `INSERT INTO order_items (order_id, service_id, name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, service.id, service.name, item.quantity, service.price]
      );
    }

    await client.query('COMMIT');

    const fullItems = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    res.status(201).json({ order: { ...order, items: fullItems.rows } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createOrder error', err);
    res.status(500).json({ error: 'Could not place order.' });
  } finally {
    client.release();
  }
}

/** Customer: their own order history with line items. */
async function listMyOrders(req, res) {
  try {
    const orders = await db.query(
      `SELECT o.*, v.business_name AS vendor_name
       FROM orders o JOIN vendors v ON v.id = o.vendor_id
       WHERE o.customer_id = $1 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    const withItems = await attachItems(orders.rows);
    res.json({ orders: withItems });
  } catch (err) {
    console.error('listMyOrders error', err);
    res.status(500).json({ error: 'Could not fetch orders.' });
  }
}

/** Vendor: the order queue for their business, optionally filtered by status. */
async function listVendorOrders(req, res) {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Create a vendor profile first.' });

    const { status } = req.query;
    const params = [vendor.rows[0].id];
    let where = 'o.vendor_id = $1';
    if (status) { params.push(status); where += ` AND o.status = $2`; }

    const orders = await db.query(
      `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone
       FROM orders o JOIN users u ON u.id = o.customer_id
       WHERE ${where} ORDER BY o.created_at DESC`,
      params
    );
    const withItems = await attachItems(orders.rows);
    res.json({ orders: withItems });
  } catch (err) {
    console.error('listVendorOrders error', err);
    res.status(500).json({ error: 'Could not fetch orders.' });
  }
}

async function attachItems(orders) {
  if (!orders.length) return [];
  const ids = orders.map((o) => o.id);
  const items = await db.query('SELECT * FROM order_items WHERE order_id = ANY($1::int[])', [ids]);
  return orders.map((o) => ({
    ...o,
    items: items.rows.filter((i) => i.order_id === o.id),
  }));
}

const ALLOWED_STATUSES = ['received', 'preparing', 'ready', 'completed', 'cancelled'];

/** Vendor: advance/change the status of one of their orders. */
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(422).json({ error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const result = await db.query(
      `UPDATE orders o SET status = $1, updated_at = now()
       FROM vendors v
       WHERE o.id = $2 AND o.vendor_id = v.id AND v.user_id = $3
       RETURNING o.*`,
      [status, id, req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error('updateOrderStatus error', err);
    res.status(500).json({ error: 'Could not update order.' });
  }
}

module.exports = { createOrder, listMyOrders, listVendorOrders, updateOrderStatus };
