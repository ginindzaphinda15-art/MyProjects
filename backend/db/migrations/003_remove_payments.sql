-- eSebeLink — remove MoMo payments
-- Bookings/orders no longer go through a payment step before the vendor
-- confirms them (vendors just update status manually from their dashboard),
-- so the payments table and its data are no longer used by the app.
DROP TABLE IF EXISTS payments;
