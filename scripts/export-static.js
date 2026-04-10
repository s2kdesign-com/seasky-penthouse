#!/usr/bin/env node
/**
 * Generates a static build in docs/ for GitHub Pages deployment.
 *
 * What it does:
 *  1. Fetches all 3 ICS calendar feeds
 *  2. Applies default check-in (15:00) / check-out (11:00) times
 *  3. Writes docs/data/events.json, status.json, feeds.json
 *  4. Copies src/public/ → docs/ (html, css, js, wasm, icon)
 *  5. Patches docs/index.html with data-static="true" + correct base URL
 */
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs   = require('fs');
const path = require('path');

// Reuse calendarService — it already handles fetching + default times
// We need to load db before calendarService (db sets up the SQLite file)
// In CI there is no DB, so we provide a stub
process.env.CI_STATIC = 'true';

// Minimal db stub so calendarService doesn't crash without a real DB
// Load the real db module to read config + overrides
const realDb = require('../src/db');

const dbStubPath = path.join(__dirname, 'db-stub.js');
fs.writeFileSync(dbStubPath, `
'use strict';
module.exports = {
  getOverride: () => null,
  getAllOverrides: () => [],
};
`);

// Temporarily patch require to use the stub for db (calendarService gets the stub)
const Module = require('module');
const _origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.endsWith('/db') || request.endsWith('\\db')) {
    return require(dbStubPath);
  }
  // pushService is not needed for static export — stub it out
  if (request.endsWith('/pushService') || request.endsWith('\\pushService')) {
    return { sendToAll: async () => {} };
  }
  return _origLoad.apply(this, arguments);
};

const { syncAllFeeds, getEvents, getStatus, getFeeds } = require('../src/calendarService');

const DOCS     = path.join(__dirname, '..', 'docs');
const DATA_DIR = path.join(DOCS, 'data');
const PUBLIC   = path.join(__dirname, '..', 'src', 'public');

// ─── Setup output directories ────────────────────────────────────────────────
fs.mkdirSync(DATA_DIR, { recursive: true });

(async () => {
  // ── 1. Fetch feeds ───────────────────────────────────────────────────────
  console.log('Fetching calendar feeds…');
  await syncAllFeeds();

  const events = getEvents();
  const status = getStatus();
  const feeds  = getFeeds().map(({ id, name, color }) => ({ id, name, color }));

  // ── 2. Write JSON data ───────────────────────────────────────────────────
  const publicConfig = realDb.getPublicConfig();

  // Pre-compute timezone list for fast settings page load
  const tzList = Intl.supportedValuesOf('timeZone').map(tz => {
    try {
      const off = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
        .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
      return { tz, label: `${tz.replace(/_/g, ' ')} (${off})`, off };
    } catch {
      return { tz, label: tz.replace(/_/g, ' '), off: '' };
    }
  }).sort((a, b) => a.off.localeCompare(b.off) || a.tz.localeCompare(b.tz));

  fs.writeFileSync(path.join(DATA_DIR, 'events.json'), JSON.stringify(events, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'status.json'), JSON.stringify(status, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'feeds.json'),  JSON.stringify(feeds,  null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'config.json'), JSON.stringify(publicConfig, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'timezones.json'), JSON.stringify(tzList));
  console.log(`✓ Wrote ${events.length} events + config + ${tzList.length} timezones to docs/data/`);

  // ── 3. Copy public assets ────────────────────────────────────────────────
  const COPY = ['app.js', 'style.css', 'sw.js', 'calendar.wasm', 'icon-192.png', 'favicon.ico'];
  for (const f of COPY) {
    const src = path.join(PUBLIC, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DOCS, f));
      console.log(`✓ Copied ${f}`);
    }
  }

  // ── 4. Build index.html with static-mode flag ────────────────────────────
  let html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');

  // Mark as static build
  html = html.replace('<html lang="en">', '<html lang="en" data-static="true">');

  // Add base-url meta tag so WASM fetch works relative to repo sub-path
  html = html.replace(
    '<meta charset="UTF-8" />',
    '<meta charset="UTF-8" />\n  <meta name="base-url" content="." />',
  );

  // Replace <base href="/"> with relative base for GitHub Pages
  html = html.replace('<base href="/" />', '<base href="./" />');


  // Remove login.html link (no auth in static mode)
  // Strip the Google Fonts / CDN links that require online access — keep FullCalendar CDN
  fs.writeFileSync(path.join(DOCS, 'index.html'), html);
  console.log('✓ Wrote docs/index.html (static mode)');

  // ── 5. Clean up stub ──────────────────────────────────────────────────────
  fs.unlinkSync(dbStubPath);

  console.log('\n✅ Static build complete → docs/');
  console.log(`   Events: ${events.length}`);
  console.log(`   Last sync: ${status.lastSync}`);
})().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
