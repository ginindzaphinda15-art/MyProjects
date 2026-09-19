-- eSebeLink — branding fields + booking-conflict safety net
-- Run with: psql "$DATABASE_URL" -f db/migrations/002_branding_and_scheduling.sql

-- Vendor branding: logo + cover banner shown on their public profile and on
-- vendor cards while customers are browsing.
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7); -- e.g. #0B63C9, accents the vendor's public page

-- Catalog images: every service/product a vendor lists can carry a photo.
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Scheduling assistant safety net: a vendor can never hold two live bookings
-- (anything other than 'cancelled') for the same date + time. The app layer
-- already checks this and offers alternative slots before it gets here, but
-- this index makes it impossible to slip through as a race condition too.
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_booking_slot
  ON bookings (vendor_id, booking_date, booking_time)
  WHERE status != 'cancelled';
