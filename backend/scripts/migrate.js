// Runs every .sql file in db/migrations, in filename order, against
// DATABASE_URL. Uses the same 'pg' package the app already depends on, so
// there's nothing extra to install and no dependency on the psql CLI being
// on your PATH (a common snag on Windows).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

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
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // 001_..., 002_... etc

  if (!files.length) {
    console.log('No migration files found in', MIGRATIONS_DIR);
    await pool.end();
    return;
  }

  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    process.stdout.write(`Running ${file} ... `);
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
  console.log('All migrations applied.');
}

run();
