# SeaSky Penthouse — Booking Dashboard

A property booking calendar dashboard for **SeaSky Apartments** (Burgas, Bulgaria) that aggregates reservations from Airbnb, Booking.com, and the official website into a single unified view.

**Live:** [seasky-penthouse.coingardenworld.workers.dev](https://seasky-penthouse.coingardenworld.workers.dev)

## Features

- **Unified calendar** — FullCalendar-based availability view combining iCal feeds from Airbnb, Booking.com, and the official website
- **Property booking style** — day cell coloring (past/today/booked/available), check-in/check-out split indicators, booking pills with source colors and night counts
- **Occupancy stats** — total bookings, upcoming count, monthly occupancy percentage
- **Google OAuth** — sign in with Google, admin/subscriber roles
- **Admin panel** — user management, activity logs, manual calendar sync, event date overrides, link configuration
- **Dynamic links** — social media and rental platform URLs configurable by admins, stored in D1
- **Push notifications** — Web Push via VAPID keys for new booking alerts
- **WebAssembly** — `nightCount`, `daysOverlap`, `isToday` helper functions compiled from WAT
- **i18n** — English and Bulgarian translations
- **Dark/Light themes** — user preference saved in localStorage
- **Responsive** — mobile-friendly sidebar, stacked layouts on small screens

## Architecture

This repo contains **two runtimes** from one codebase:

| Runtime | Entry point | Database | Use case |
|---|---|---|---|
| **Express** (Node.js) | `src/server.js` | SQLite (`data/seasky.db`) | Local development |
| **Cloudflare Workers** | `worker/src/index.js` | D1 (serverless SQLite) | Production |

Both share the same frontend in `src/public/`.

### Directory Structure

```
src/
  server.js          Express app + routes + cron
  db.js              SQLite (better-sqlite3) data layer
  calendarService.js iCal feed sync (node-ical)
  pushService.js     Web Push notifications
  public/            Shared static frontend
    index.html       Main dashboard SPA
    login.html       Google OAuth login page
    app.js           Frontend JavaScript (calendar, auth, i18n, navigation)
    style.css        All styles (dark/light themes, responsive)
    calendar.wasm    Compiled WebAssembly helpers
    sw.js            Service worker for push notifications

worker/src/
  index.js           Workers fetch handler + scheduled trigger
  db.js              D1 database layer (async)
  auth.js            Google OAuth + HMAC-SHA256 cookie sessions
  ics.js             Custom iCal parser (no node-ical dependency)

wasm/
  calendar.wat       WebAssembly Text format source

scripts/
  build-wasm.js      Compiles WAT to WASM
  export-static.js   Generates static site in docs/

docs/                Static export for GitHub Pages
journal/             Daily project journal
schema.sql           D1 database schema reference
wrangler.jsonc       Cloudflare Workers configuration
```

## Setup

### Prerequisites

- Node.js 18+
- OpenSSL (for TLS certificates)
- Google OAuth credentials (Client ID + Secret)

### Local Development (Express)

```bash
# Install dependencies
npm install

# Generate TLS certificates
mkdir -p certs
openssl req -x509 -newkey rsa:2048 \
  -keyout certs/localhost+2-key.pem \
  -out certs/localhost+2.pem \
  -days 365 -nodes -subj "/CN=localhost"

# Create .env from template
cp .env.example .env
# Edit .env with your Google OAuth credentials and VAPID keys

# Generate VAPID keys
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"

# Build WASM
npm run build:wasm

# Start server
npm start
# Server runs on https://localhost:3443 with HTTP redirect on :3000
```

### Production (Cloudflare Workers)

The project auto-deploys via Cloudflare Git integration on push to `main`.

Manual deploy:
```bash
npx wrangler deploy
```

### Static Export (GitHub Pages)

```bash
npm run build
# Generates docs/ with pre-rendered data
```

## API Endpoints

### Public

| Endpoint | Method | Description |
|---|---|---|
| `/api/events` | GET | All calendar events |
| `/api/status` | GET | Sync status per feed |
| `/api/feeds` | GET | Feed list (id, name, color) |
| `/api/config` | GET | Public config (links, VAPID key, etc.) |
| `/api/me` | GET | Current user or null |
| `/api/push/vapid-public-key` | GET | VAPID public key |
| `/api/push/subscribe` | POST | Save push subscription |
| `/api/push/subscribe` | DELETE | Remove push subscription |

### Admin (requires Google OAuth + admin role)

| Endpoint | Method | Description |
|---|---|---|
| `/api/sync` | POST | Trigger manual calendar sync |
| `/api/events/:id/override` | PATCH | Override event check-in/check-out dates |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/:id/role` | PATCH | Change user role |
| `/api/admin/users/:id` | DELETE | Remove user |
| `/api/admin/logs` | GET | Activity logs |
| `/api/admin/config` | GET | All config entries |
| `/api/admin/config/:key` | PUT | Set config value |
| `/api/admin/config/:key` | DELETE | Delete config entry |

## Database Schema

7 tables in D1 (see `schema.sql`):

- **users** — Google OAuth users with roles
- **push_subscriptions** — Web Push endpoints
- **activity_logs** — Admin action audit trail
- **event_overrides** — Manual date corrections
- **config** — Key-value settings (public/private flag)
- **events_cache** — Cached calendar events from iCal feeds
- **sync_status** — Per-feed sync health tracking

### Config Keys

| Key | Public | Description |
|---|---|---|
| `BASE_URL` | Yes | Application base URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `VAPID_PUBLIC_KEY` | Yes | Push notification VAPID key |
| `LINK_FACEBOOK` | Yes | Facebook page URL |
| `LINK_INSTAGRAM` | Yes | Instagram profile URL |
| `LINK_GOOGLE` | Yes | Google review URL |
| `LINK_OFFICIAL` | Yes | Official website URL |
| `LINK_BOOKING` | Yes | Booking.com listing URL |
| `LINK_AIRBNB` | Yes | Airbnb listing URL |

## Tech Stack

- **Frontend:** FullCalendar 6, vanilla JS, CSS custom properties
- **Backend:** Express 4 (dev) / Cloudflare Workers (prod)
- **Database:** SQLite via better-sqlite3 (dev) / D1 (prod)
- **Auth:** Google OAuth 2.0, HMAC-SHA256 signed cookies
- **WASM:** WebAssembly Text format compiled with wabt
- **Push:** Web Push API with VAPID
- **i18n:** Custom translation system (EN/BG)

## License

Private project for SeaSky Apartments.
