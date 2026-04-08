'use strict';

const ical = require('node-ical');
const db   = require('./db');
// Lazy-loaded to avoid circular deps at startup
let push;
function getPush() { return push || (push = require('./pushService')); }

const DEFAULT_CHECKIN_TIME  = '15:00';
const DEFAULT_CHECKOUT_TIME = '11:00';

const FEEDS = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    url: 'https://www.airbnb.com/calendar/ical/1247145883530356043.ics?t=e527e406ab6549d7afc07f46931673fc',
    color: '#FF5A5F',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    url: 'https://ical.booking.com/v1/export/t/a3113ade-e7ed-4d52-b1f5-dc4cb501ca91.ics',
    color: '#003580',
  },
  {
    id: 'official',
    name: 'Official Website',
    url: 'https://seasky-apartments.com/ical-feed/?ical=ad085dba28450c4942034dc5f4440753',
    color: '#2C7BE5',
  },
];

// In-memory cache of raw ICS events (before time overrides applied)
let rawEvents  = [];
let lastSync   = null;
let syncStatus = FEEDS.map((f) => ({ id: f.id, name: f.name, status: 'pending', lastChecked: null, error: null }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAllDay(start) {
  if (!start) return false;
  return start.dateOnly === true ||
    (start.toISOString && start.toISOString().endsWith('T00:00:00.000Z'));
}

/**
 * Given a Date and a "HH:MM" string, return a local datetime string like "2026-04-07T15:00".
 * Uses the local date of `dateObj`, not UTC.
 */
function localDateWithTime(dateObj, timeStr) {
  const d = new Date(dateObj);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${timeStr}`;
}

/**
 * Apply default 15:00 / 11:00 times to a raw event, then overlay any DB override.
 * Returns the final { start, end, allDay } strings for FullCalendar.
 */
function applyTimes(eventId, rawStart, rawEnd) {
  // Build defaults
  let startDt = localDateWithTime(rawStart, DEFAULT_CHECKIN_TIME);
  let endDt   = localDateWithTime(rawEnd,   DEFAULT_CHECKOUT_TIME);

  // Apply DB override if present
  const ov = db.getOverride(eventId);
  if (ov) {
    startDt = ov.start_dt;
    endDt   = ov.end_dt;
  }

  return { start: startDt, end: endDt, allDay: false };
}

// ─── Feed fetching ────────────────────────────────────────────────────────────

async function fetchFeed(feed) {
  try {
    const events = await ical.async.fromURL(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SeaSkyBot/1.0)' },
    });
    const parsed = [];

    for (const key of Object.keys(events)) {
      const ev = events[key];
      if (ev.type !== 'VEVENT') continue;

      const start = ev.start ? new Date(ev.start) : null;
      const end   = ev.end   ? new Date(ev.end)   : null;
      if (!start) continue;

      const eventId = `${feed.id}_${key}`;

      let title = ev.summary ? String(ev.summary) : 'Booked';
      if (feed.id === 'booking' && title.trim().toLowerCase() === 'closed - not available') {
        title = 'Booking (Not Available)';
      }

      parsed.push({
        id:          eventId,
        title,
        description: ev.description ? String(ev.description) : '',
        source:      feed.id,
        sourceName:  feed.name,
        color:       feed.color,
        // Raw dates stored for re-applying times after override changes
        rawStart:    start.toISOString(),
        rawEnd:      (end || start).toISOString(),
      });
    }

    return { success: true, events: parsed };
  } catch (err) {
    return { success: false, events: [], error: err.message };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function syncAllFeeds() {
  console.log(`[${new Date().toISOString()}] Syncing calendar feeds…`);

  const results = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed)));
  const newRaw = [];
  const newStatus = [];

  results.forEach((result, i) => {
    const feed = FEEDS[i];
    if (result.status === 'fulfilled' && result.value.success) {
      newRaw.push(...result.value.events);
      newStatus.push({ id: feed.id, name: feed.name, status: 'ok', lastChecked: new Date().toISOString(), error: null, count: result.value.events.length });
      console.log(`  ✓ ${feed.name}: ${result.value.events.length} events`);
    } else {
      const errMsg = result.status === 'rejected' ? result.reason?.message : result.value?.error;
      newStatus.push({ id: feed.id, name: feed.name, status: 'error', lastChecked: new Date().toISOString(), error: errMsg, count: 0 });
      console.error(`  ✗ ${feed.name}: ${errMsg}`);
    }
  });

  // Detect new bookings and send push notifications
  const prevIds = new Set(rawEvents.map(e => e.id));
  const newBookings = newRaw.filter(e => !prevIds.has(e.id));

  rawEvents  = newRaw;
  syncStatus = newStatus;
  lastSync   = new Date().toISOString();

  if (newBookings.length > 0) {
    const label = newBookings.length === 1
      ? `New booking: ${newBookings[0].title}`
      : `${newBookings.length} new bookings detected`;
    getPush().sendToAll('SeaSky Penthouse', label, { url: '/' }).catch(() => {});
  }

  console.log(`[${new Date().toISOString()}] Sync complete. Total events: ${newRaw.length}`);
  return { events: getEvents(), status: newStatus, lastSync };
}

/** Returns events with default/overridden times applied — called on every /api/events request */
function getEvents() {
  return rawEvents.map((ev) => {
    const { start, end, allDay } = applyTimes(ev.id, new Date(ev.rawStart), new Date(ev.rawEnd));
    return {
      id:          ev.id,
      title:       ev.title,
      start,
      end,
      allDay,
      source:      ev.source,
      sourceName:  ev.sourceName,
      color:       ev.color,
      description: ev.description,
      rawStart:    ev.rawStart,
      rawEnd:      ev.rawEnd,
    };
  });
}

function getStatus() { return { lastSync, feeds: syncStatus }; }
function getFeeds()  { return FEEDS; }

module.exports = { syncAllFeeds, getEvents, getStatus, getFeeds };
