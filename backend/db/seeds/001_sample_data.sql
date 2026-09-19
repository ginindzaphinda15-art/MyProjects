-- Sample data for local development.
-- Password for every seeded user is: Password123!
-- (hash below corresponds to that password using bcrypt, cost 10)

INSERT INTO users (name, email, password_hash, role, phone) VALUES
  ('Nomsa Dlamini', 'nomsa@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Y4Q1FQ1u3W1z2yG2rQ8b8m1e1oQnG', 'vendor', '76112233'),
  ('Sipho Mkhonta', 'sipho@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Y4Q1FQ1u3W1z2yG2rQ8b8m1e1oQnG', 'vendor', '76445566'),
  ('Thandi Simelane', 'thandi@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Y4Q1FQ1u3W1z2yG2rQ8b8m1e1oQnG', 'customer', '76778899')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vendors (user_id, business_name, category, description, address, phone)
SELECT id, 'Nomsa''s Braids & Beauty', 'Salon & Spa', 'Braiding, natural hair care and spa treatments in the heart of Mbabane.', 'Allister Miller St, Mbabane', '76112233'
FROM users WHERE email = 'nomsa@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO vendors (user_id, business_name, category, description, address, phone)
SELECT id, 'Sipho''s Grill House', 'Cafe & Restaurant', 'Home-style grills, sides and drinks for pickup or dine-in.', 'Mbabane Market St', '76445566'
FROM users WHERE email = 'sipho@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO services (vendor_id, name, description, price, duration_minutes)
SELECT v.id, 'Box Braids', 'Medium box braids, shoulder length', 450.00, 180
FROM vendors v JOIN users u ON u.id = v.user_id WHERE u.email = 'nomsa@example.com';

INSERT INTO services (vendor_id, name, description, price, duration_minutes)
SELECT v.id, 'Silk Press', 'Wash, treat and silk press', 250.00, 90
FROM vendors v JOIN users u ON u.id = v.user_id WHERE u.email = 'nomsa@example.com';

INSERT INTO services (vendor_id, name, description, price, duration_minutes)
SELECT v.id, 'Quarter Chicken & Chips', 'Grilled quarter chicken with a side of chips', 65.00, NULL
FROM vendors v JOIN users u ON u.id = v.user_id WHERE u.email = 'sipho@example.com';

INSERT INTO services (vendor_id, name, description, price, duration_minutes)
SELECT v.id, 'Beef Burger', 'Beef patty, cheese, salad and chips', 55.00, NULL
FROM vendors v JOIN users u ON u.id = v.user_id WHERE u.email = 'sipho@example.com';
