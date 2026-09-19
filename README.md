# eSebeLink Marketplace

A local business marketplace where customers can browse nearby vendors, see
their location on a map, and book appointments or place orders. Vendors
manage their branded profile, service catalog (with photos), location, and
incoming bookings/orders from a dedicated dashboard. A scheduling assistant
keeps two customers from ever booking the same vendor at the same time.

Payment happens directly between customer and vendor (in person, or by
whatever method they arrange) — the app does not process payments itself.

## Stack

- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT auth, Multer (image
  uploads)
- **Frontend:** React (Create React App), React Router, Tailwind CSS, Axios,
  Leaflet/React-Leaflet (maps, via free OpenStreetMap tiles — no API key
  needed)

## What's in this build

- **Branding:** the app is themed around the eSebeLink logo's blue/green
  palette (`frontend/tailwind.config.js`), with the logo used in the header,
  favicon, and login/register screens.
- **Vendor branding & catalog images:** vendors can upload a logo, a cover
  banner, and a brand accent color from their dashboard's "Business profile"
  tab, and a photo for each item in their catalog ("Catalog" tab). These show
  up on vendor cards while browsing and on each vendor's public profile page.
- **Location map:** vendors set their business location by tapping a map (or
  using "use my current location") on the "Business profile" tab. That
  location then shows as a live map right above the booking form on their
  public profile, so a customer can see exactly where they'd be going before
  they book — with a link to open it in a full maps app for directions.
- **Scheduling assistant (double-booking prevention):** when a customer picks
  a date, the booking form calls `GET /api/bookings/availability` to show
  which times are already taken for that vendor and which are free, and lets
  them tap a free slot directly. If two people race for the same slot, the
  server rejects the second one (`POST /api/bookings` returns `409` with
  `suggestedTimes`) and a database-level unique index
  (`uq_vendor_booking_slot`) makes that guarantee airtight even under
  concurrent requests. This is a deterministic rules-based scheduler, not a
  trained ML model — it's what actually solves "never double-book a vendor,"
  without the complexity or unpredictability of a model in the loop.

## Project structure

```
esebelink-marketplace/
├── backend/     Express API, PostgreSQL schema, image uploads
└── frontend/    React customer + vendor web app
```

## Getting started

### 1. Database

You'll need a running PostgreSQL instance and a `DATABASE_URL` pointing at
it. Two easy ways to get one:

- **Local install:** install PostgreSQL, then create a database named
  `esebelink_marketplace` (via `pgAdmin`'s GUI, or `createdb` if you installed
  the command-line tools and they're on your PATH).
- **Hosted, no install needed (recommended on Windows):** create a free
  Postgres database on something like [Neon](https://neon.tech) or
  [Supabase](https://supabase.com) and copy the connection string they give
  you — this skips local Postgres setup entirely.

Either way, migrations and seeding run through Node (via the `pg` package
already in `dependencies`), **not** the `psql` CLI — so nothing extra needs
to be on your PATH:

```bash
cd backend
cp .env.example .env        # then edit DATABASE_URL, JWT_SECRET
npm install
npm run migrate             # creates all tables, then applies every later migration
npm run seed                # optional: adds two sample vendors + a customer
```

`npm run migrate` runs every file in `backend/db/migrations/` in order (it'll
auto-create the database itself if it doesn't exist yet, for local Postgres
setups), so you only ever need to run this one command — including after
pulling future migrations.

### 2. Backend API

```bash
cd backend
npm run dev                 # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/health`

Uploaded images (vendor logos/banners, catalog photos) are saved to
`backend/uploads/` and served back at `http://localhost:5000/uploads/<file>`.
That folder is created automatically and is gitignored — back it up (or move
to S3/Cloudinary/etc.) before you rely on this in production.

### 3. Frontend

```bash
cd frontend
cp .env.example .env        # points REACT_APP_API_URL at the backend
npm install
npm start                   # starts on http://localhost:3000
```

## Core flows

- **Customers:** register → browse vendors (by logo/banner/photos) → open a
  vendor's profile, see them on the map → book a service (steered away from
  already-booked times by the scheduling assistant) or place a multi-item
  order → pay the vendor directly → track status from "My bookings & orders"
- **Vendors:** register as a vendor → set up a branded business profile
  (logo, banner, accent color, map location) → add services/products with
  photos to their catalog → manage incoming bookings and orders from status
  queues (pending → confirmed → completed, and received → preparing → ready
  → completed)

## Notes on this build

This is a working prototype, not a production deployment. Before going live
you'd want to add: email/SMS notifications, per-vendor configurable business
hours (the scheduler currently assumes 08:00–18:00 for every vendor), cloud
object storage for uploaded images instead of local disk, an actual payment
integration if you want the app to process payments itself, pagination on
list endpoints, automated tests, and rate limiting on auth routes.
