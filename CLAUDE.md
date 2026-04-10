# Claude Code Instructions

You are working on the **SeaSky Penthouse Booking Dashboard** — a property booking calendar that aggregates Airbnb, Booking.com, and official website reservations.

## Mandatory Workflow

### 1. Read the Journal First

Before starting ANY task, read the latest journal entry in `journal/` to understand what has already been done. The journal is the source of truth for project history.

```
journal/YYYY-MM-DD.md
```

This prevents duplicate work and ensures you understand the current state of the project.

### 2. Validate After Every Task

After completing any code change, you MUST validate that it works:

- **Frontend changes**: Start the local server (`npm start`) or use the preview tool to verify the UI renders correctly. Check both desktop and mobile layouts.
- **API changes**: Test affected endpoints with `curl` or `fetch` to confirm correct responses (200 for public, 403 for admin without auth).
- **Build changes**: Run `npm run build` and verify `docs/` output is generated without errors.
- **Worker changes**: Verify the worker code has valid syntax. If you have access to the Cloudflare MCP, query D1 to verify data changes.
- **CSS changes**: Verify styles apply correctly in both dark and light themes.
- **i18n changes**: Verify both EN and BG translations are added for any new UI text.

### 3. Update the Journal

After completing and validating a task, append a new section to today's journal file (`journal/YYYY-MM-DD.md`). If the file doesn't exist, create it. Include:

- What was done (feature name, summary)
- Key technical details (files changed, config keys, API endpoints)
- Validation results

### 4. Rebuild Static Export

If you changed any files in `src/public/`, run `npm run build` to regenerate the `docs/` directory for GitHub Pages.

### 5. Update the Changelog

Before committing, bump the version in `CHANGELOG.json` (and its copy in `src/public/CHANGELOG.json`). Both files must stay in sync. Use semantic versioning:
- **Patch** (1.7.1): bug fixes, small tweaks
- **Minor** (1.8.0): new features, new pages, new endpoints
- **Major** (2.0.0): breaking changes or major rewrites

Add a new entry at the **top** of the JSON array with:
- `version`: the new version string
- `date`: today's date (YYYY-MM-DD)
- `changes`: array of 1-3 short bullet points summarizing what changed

Also update the `version` field in `package.json` to match.

### 6. Commit and Push

After changes are done and verified, commit and push automatically — do not wait to be asked. Write clear commit messages explaining *why*, not just *what*. Always include both `src/public/` source files and `docs/` build output. Push to GitHub immediately after committing — Cloudflare Workers auto-deploys from `main` branch.

## Project Structure

Two runtimes, one codebase:

- `src/` — Express server for local development (`npm start`)
- `worker/src/` — Cloudflare Workers for production (auto-deploys on push)
- `src/public/` — Shared frontend (served by both runtimes)
- `docs/` — Static export for GitHub Pages (`npm run build`)

### Key Files

| File | Purpose |
|---|---|
| `src/public/index.html` | Main SPA — all pages, nav, modals, footer |
| `src/public/app.js` | Frontend logic — calendar, auth, i18n, navigation, page loaders |
| `src/public/style.css` | All styles — dark/light themes, responsive breakpoints |
| `worker/src/index.js` | Workers entry — all API routes |
| `worker/src/db.js` | D1 database queries |
| `worker/src/auth.js` | Google OAuth + cookie sessions |
| `worker/src/ics.js` | iCal feed parser |
| `wrangler.jsonc` | Cloudflare Workers config (D1 binding, cron) |
| `CHANGELOG.json` | Version history — bump on every commit |
| `src/public/CHANGELOG.json` | Copy of changelog served as static asset |
| `schema.sql` | Database schema reference |

### Frontend Patterns

- **Navigation**: `navigateTo(page)` dispatches to page loaders. New pages need: nav `<li>`, page `<div>`, loader function.
- **i18n**: `TRANSLATIONS.en` and `TRANSLATIONS.bg` objects in `app.js`. Use `data-i18n` attributes in HTML, `t(key)` in JS.
- **Visibility**: `.nav-admin-only` (admin only), `.nav-auth-only` (any signed-in user). Controlled by `init()` in `app.js`.
- **Static mode**: `IS_STATIC` flag. API calls map to JSON files in `docs/data/`. Google auth uses GIS popup instead of server redirect.
- **Config as KV store**: The `config` table stores key-value settings. Public config is readable via `/api/config`. Admin CRUD via `/api/admin/config/:key`.

### API Pattern

All admin endpoints use `requireAdmin(request, env)` which checks the session cookie and verifies `role === 'admin'`. Returns `null` if unauthorized, so routes return `403 Forbidden`.

### Dynamic Links

Social and rental links are stored in D1 config with `is_public: 1`. Keys: `LINK_FACEBOOK`, `LINK_INSTAGRAM`, `LINK_GOOGLE`, `LINK_OFFICIAL`, `LINK_BOOKING`, `LINK_AIRBNB`. HTML elements with `data-link-key="KEY"` get their `href` updated from config on page load via `applyDynamicLinks()`.

## Common Tasks

### Adding a New Page

1. Add nav `<li>` in `index.html` sidebar (use `nav-admin-only` or `nav-auth-only` if needed)
2. Add page `<div id="page-NAME" class="page">` in `index.html` main content area
3. Add `loadNAMEPage()` function in `app.js`
4. Add dispatch in `navigateTo()`: `if (page === 'NAME') loadNAMEPage();`
5. Add i18n keys in both `en` and `bg` translation objects
6. Add styles in `style.css` (check mobile breakpoint at `@media (max-width: 768px)`)

### Adding a New Config Key

1. Add to D1 via `INSERT INTO config (key, value, is_public) VALUES (...)` 
2. If public, it will be available via `GET /api/config`
3. Admin can manage via the existing `PUT /api/admin/config/:key` endpoint

### Adding a New API Endpoint

1. Add route handler in `worker/src/index.js` inside `handleRequest()`
2. Add corresponding DB function in `worker/src/db.js` if needed
3. For admin routes, use `requireAdmin(request, env)` guard
4. Log admin actions with `db.addLog()`

## Environment

- **Live URL**: `https://seasky-penthouse.coingardenworld.workers.dev`
- **D1 Database**: `seasky-calendar-db` (ID: `1a0bbe3f-3fe2-4b0f-b79e-94ae1210f1a1`)
- **Local**: HTTPS on port 3443, HTTP redirect on port 3000
- **GitHub**: `s2kdesign-com/seasky-penthouse`
- **Cloudflare**: auto-deploys from `main` branch via Git integration

## Validation Checklist

Use this checklist after any change:

- [ ] `npm run build` succeeds (WASM + static export)
- [ ] No console errors in browser
- [ ] New UI text has both EN and BG translations
- [ ] Admin-only features are hidden from non-admin users
- [ ] Mobile layout is not broken (check 768px breakpoint)
- [ ] `docs/` is regenerated if `src/public/` files changed
- [ ] Journal is updated with what was done
