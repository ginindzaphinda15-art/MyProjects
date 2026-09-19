const db = require('../config/database');

/** Public: browse/search all vendors, optionally filtered by category or text search. */
async function listVendors(req, res) {
  try {
    const { category, search } = req.query;
    const conditions = [];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`v.category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(v.business_name ILIKE $${params.length} OR v.description ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.query(
      `SELECT v.id, v.business_name, v.category, v.description, v.address, v.phone,
              v.logo_url, v.banner_url, v.brand_color, v.latitude, v.longitude,
              v.avg_rating, v.created_at, u.name AS owner_name
       FROM vendors v
       JOIN users u ON u.id = v.user_id
       ${where}
       ORDER BY v.created_at DESC`,
      params
    );
    res.json({ vendors: result.rows });
  } catch (err) {
    console.error('listVendors error', err);
    res.status(500).json({ error: 'Could not fetch vendors.' });
  }
}

/** Public: a single vendor's profile plus their active services. */
async function getVendor(req, res) {
  try {
    const { id } = req.params;
    const vendorResult = await db.query(
      `SELECT v.*, u.name AS owner_name, u.email AS owner_email
       FROM vendors v JOIN users u ON u.id = v.user_id
       WHERE v.id = $1`,
      [id]
    );
    if (!vendorResult.rows.length) return res.status(404).json({ error: 'Vendor not found.' });

    const servicesResult = await db.query(
      'SELECT * FROM services WHERE vendor_id = $1 AND is_active = true ORDER BY name',
      [id]
    );

    res.json({ vendor: vendorResult.rows[0], services: servicesResult.rows });
  } catch (err) {
    console.error('getVendor error', err);
    res.status(500).json({ error: 'Could not fetch vendor.' });
  }
}

/** Vendor: create or update their own business profile (including branding). */
async function upsertMyProfile(req, res) {
  try {
    const { businessName, category, description, address, phone, logoUrl, bannerUrl, brandColor, latitude, longitude } = req.body;

    const existing = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);

    let result;
    if (existing.rows.length) {
      result = await db.query(
        `UPDATE vendors
         SET business_name = $1, category = $2, description = $3, address = $4, phone = $5,
             logo_url = COALESCE($6, logo_url),
             banner_url = COALESCE($7, banner_url),
             brand_color = COALESCE($8, brand_color),
             latitude = COALESCE($9, latitude),
             longitude = COALESCE($10, longitude),
             updated_at = now()
         WHERE user_id = $11
         RETURNING *`,
        [businessName, category, description || null, address || null, phone,
          logoUrl || null, bannerUrl || null, brandColor || null,
          latitude ?? null, longitude ?? null, req.user.id]
      );
    } else {
      result = await db.query(
        `INSERT INTO vendors (user_id, business_name, category, description, address, phone, logo_url, banner_url, brand_color, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [req.user.id, businessName, category, description || null, address || null, phone,
          logoUrl || null, bannerUrl || null, brandColor || null, latitude ?? null, longitude ?? null]
      );
    }

    res.status(existing.rows.length ? 200 : 201).json({ vendor: result.rows[0] });
  } catch (err) {
    console.error('upsertMyProfile error', err);
    res.status(500).json({ error: 'Could not save vendor profile.' });
  }
}

/** Vendor: fetch their own profile (used to populate dashboard/settings). */
async function getMyProfile(req, res) {
  try {
    const result = await db.query('SELECT * FROM vendors WHERE user_id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'No vendor profile yet.' });
    res.json({ vendor: result.rows[0] });
  } catch (err) {
    console.error('getMyProfile error', err);
    res.status(500).json({ error: 'Could not fetch vendor profile.' });
  }
}

/** Vendor: list their own services (including inactive ones, for management). */
async function listMyServices(req, res) {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Create a vendor profile first.' });

    const result = await db.query(
      'SELECT * FROM services WHERE vendor_id = $1 ORDER BY created_at DESC',
      [vendor.rows[0].id]
    );
    res.json({ services: result.rows });
  } catch (err) {
    console.error('listMyServices error', err);
    res.status(500).json({ error: 'Could not fetch services.' });
  }
}

/** Vendor: add a new service/product they offer, optionally with a catalog photo. */
async function createService(req, res) {
  try {
    const vendor = await db.query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Create a vendor profile first.' });

    const { name, description, price, durationMinutes, imageUrl } = req.body;
    const result = await db.query(
      `INSERT INTO services (vendor_id, name, description, price, duration_minutes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vendor.rows[0].id, name, description || null, price, durationMinutes || null, imageUrl || null]
    );
    res.status(201).json({ service: result.rows[0] });
  } catch (err) {
    console.error('createService error', err);
    res.status(500).json({ error: 'Could not create service.' });
  }
}

/** Vendor: update one of their own services (including its catalog photo). */
async function updateService(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price, durationMinutes, isActive, imageUrl } = req.body;

    const result = await db.query(
      `UPDATE services s SET
         name = COALESCE($1, s.name),
         description = COALESCE($2, s.description),
         price = COALESCE($3, s.price),
         duration_minutes = COALESCE($4, s.duration_minutes),
         is_active = COALESCE($5, s.is_active),
         image_url = COALESCE($6, s.image_url),
         updated_at = now()
       FROM vendors v
       WHERE s.id = $7 AND s.vendor_id = v.id AND v.user_id = $8
       RETURNING s.*`,
      [name, description, price, durationMinutes, isActive, imageUrl, id, req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Service not found.' });
    res.json({ service: result.rows[0] });
  } catch (err) {
    console.error('updateService error', err);
    res.status(500).json({ error: 'Could not update service.' });
  }
}

/** Vendor: remove one of their own services. */
async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM services s
       USING vendors v
       WHERE s.id = $1 AND s.vendor_id = v.id AND v.user_id = $2
       RETURNING s.id`,
      [id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Service not found.' });
    res.status(204).send();
  } catch (err) {
    console.error('deleteService error', err);
    res.status(500).json({ error: 'Could not delete service.' });
  }
}

module.exports = {
  listVendors,
  getVendor,
  upsertMyProfile,
  getMyProfile,
  listMyServices,
  createService,
  updateService,
  deleteService,
};
