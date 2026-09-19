// Loads db/seeds/*.sql (sample data for local development) the same way
// scripts/migrate.js loads migrations — no psql CLI required.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const SEEDS_DIR = path.join(__dirname, '..', 'db', 'seeds');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in first.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const files = fs
    .readdirSync(SEEDS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');
    process.stdout.write(`Seeding ${file} ... `);
    try {
      await pool.query(sql);
      console.log('done');
    } catch (err) {
      console.log('FAILED');
      console.error(err.message);
      await pool.end();
      process.exit(1);
    }
  }

  await pool.end();
  console.log('Seed data loaded. Every seeded user\'s password is: Password123!');
}

run();
