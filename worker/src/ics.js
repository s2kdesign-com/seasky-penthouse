/**
 * ICS feed parser and calendar sync — Workers-compatible (no node-ical).
 * Uses fetch() to retrieve ICS feeds and parses VEVENT blocks manually.
 */

import * as db from './db.js';

const DEFAULT_CHECKIN_TIME  = '15:00';
const DEFAULT_CHECKOUT_TIME = '11:00';

export const FEEDS = [
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

// ─── ICS parser ──────────────────────────────────────────────────────────────

function unfoldLines(lines) {
  const result = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && result.length > 0) {
      result[result.length - 1] += line.slice(1);
    } else {
      result.push(line);
    }
  }
  return result;
}

function parseICSDate(key, value) {
  const upper = key.toUpperCase();
  const isDateOnly = (upper.includes('VALUE=DATE') && !upper.includes('VALUE=DATE-TIME'))
    || (value.length === 8 && /^\d{8}$/.test(value));

  if (isDateOnly) {
    const y = value.slice(0, 4), m = value.slice(4, 6), d = value.slice(6, 8);
    return new Date(`${y}-${m}-${d}T00:00:00Z`);
  }

  // YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const y = value.slice(0, 4), m = value.slice(4, 6), d = value.slice(6, 8);
  const h = value.slice(9, 11) || '00';
  const mi = value.slice(11, 13) || '00';
  const s = value.slice(13, 15) || '00';
  const isUtc = value.endsWith('Z');
  return new Date(`${y}-${m}-${d}T${h}:${mi}:${s}${isUtc ? 'Z' : 'Z'}`);
}

function parseICS(text) {
  const events = [];
  const lines = unfoldLines(text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n'));
  let inEvent = false;
  let event = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      event = {};
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      inEvent = false;
      if (event.uid && event.dtstart) {
        events.push(event);
      }
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx < 0) continue;
    const keyPart = trimmed.slice(0, colonIdx);
    const valuePart = trimmed.slice(colonIdx + 1);
    const prop = keyPart.split(';')[0].toUpperCase();

    switch (prop) {
      case 'UID':         event.uid = valuePart; break;
      case 'SUMMARY':     event.summary = valuePart; break;
      case 'DESCRIPTION': event.description = valuePart.replace(/\\n/g, '\n').replace(/\\,/g, ','); break;
      case 'DTSTART':     event.dtstart = parseICSDate(keyPart, valuePart); break;
      case 'DTEND':       event.dtend = parseICSDate(keyPart, valuePart); break;
    }
  }
  return events;
}

// ─── Feed fetching ───────────────────────────────────────────────────────────

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SeaSkyBot/1.0)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const vevents = parseICS(text);
    const parsed = [];

    for (const ev of vevents) {
      const start = ev.dtstart;
      const end = ev.dtend || ev.dtstart;
      if (!start) continue;

      const eventId = `${feed.id}_${ev.uid}`;
      let title = ev.summary || 'Booked';
      if (feed.id === 'booking' && title.trim().toLowerCase() === 'closed - not available') {
        title = 'Booking (Not Available)';
      }

      parsed.push({
        id: eventId,
        title,
        description: ev.description || '',
        source: feed.id,
        sourceName: feed.name,
        color: feed.color,
        rawStart: start.toISOString(),
        rawEnd: end.toISOString(),
      });
    }
    return { success: true, events: parsed };
  } catch (err) {
    return { success: false, events: [], error: err.message };
  }
}

// ─── Time helpers ────────────────────────────────────────────────────────────

function localDateWithTime(dateObj, timeStr) {
  const d = new Date(dateObj);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${timeStr}`;
}

function applyTimes(rawStart, rawEnd, override) {
  let startDt = localDateWithTime(new Date(rawStart), DEFAULT_CHECKIN_TIME);
  let endDt = localDateWithTime(new Date(rawEnd), DEFAULT_CHECKOUT_TIME);
  if (override) {
    startDt = override.start_dt;
    endDt = override.end_dt;
  }
  return { start: startDt, end: endDt, allDay: false };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function syncAllFeeds(d1) {
  console.log(`[${new Date().toISOString()}] Syncing calendar feeds...`);

  const results = await Promise.allSettled(FEEDS.map(feed => fetchFeed(feed)));
  const allEvents = [];

  for (let i = 0; i < results.length; i++) {
    const feed = FEEDS[i];
    const result = results[i];
    if (result.status === 'fulfilled' && result.value.success) {
      allEvents.push(...result.value.events);
      await db.updateSyncStatus(d1, feed.id, feed.name, 'ok', null, result.value.events.length);
      console.log(`  > ${feed.name}: ${result.value.events.length} events`);
    } else {
      const errMsg = result.status === 'rejected' ? result.reason?.message : result.value?.error;
      await db.updateSyncStatus(d1, feed.id, feed.name, 'error', errMsg, 0);
      console.error(`  x ${feed.name}: ${errMsg}`);
    }
  }

  await db.cacheEvents(d1, allEvents);
  const lastSync = new Date().toISOString();
  await db.setLastSync(d1, lastSync);

  console.log(`[${lastSync}] Sync complete. Total events: ${allEvents.length}`);
  return { totalEvents: allEvents.length, lastSync };
}

export async function getEvents(d1) {
  const cached = await db.getCachedEvents(d1);
  const overrides = await db.getAllOverrides(d1);
  const overrideMap = Object.fromEntries(overrides.map(o => [o.event_id, o]));

  return cached.map(ev => {
    const { start, end, allDay } = applyTimes(ev.raw_start, ev.raw_end, overrideMap[ev.id]);
    return {
      id: ev.id,
      title: ev.title,
      start, end, allDay,
      source: ev.source,
      sourceName: ev.source_name,
      color: ev.color,
      description: ev.description,
      rawStart: ev.raw_start,
      rawEnd: ev.raw_end,
    };
  });
}

export async function generateICS(d1) {
  const events = await getEvents(d1);
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SeaSky Apartments//Booking Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SeaSky Penthouse Bookings',
    'X-WR-TIMEZONE:Europe/Sofia',
  ];

  for (const ev of events) {
    const uid = ev.id.replace(/[^a-zA-Z0-9_-]/g, '_') + '@seasky-penthouse';
    const dtstart = toICSDate(ev.start || ev.rawStart);
    const dtend = toICSDate(ev.end || ev.rawEnd);
    const summary = (ev.title || 'Booked').replace(/[,;\\]/g, '\\$&');
    const desc = (ev.description || '').replace(/\n/g, '\\n').replace(/[,;\\]/g, '\\$&');
    const source = ev.sourceName || ev.source || '';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:${summary}`);
    if (desc) lines.push(`DESCRIPTION:${desc}`);
    if (source) lines.push(`CATEGORIES:${source}`);
    lines.push(`STATUS:CONFIRMED`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function toICSDate(dateStr) {
  if (!dateStr) return '';
  // Handle both ISO strings and local datetime strings
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const iso = d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return iso; // e.g. 20260409T150000Z
}

export async function getStatus(d1) {
  const lastSync = await db.getLastSync(d1);
  const feeds = await db.getSyncStatus(d1);
  return {
    lastSync,
    feeds: feeds.map(f => ({
      id: f.feed_id,
      name: f.feed_name,
      status: f.status,
      lastChecked: f.last_checked,
      error: f.error,
      count: f.event_count,
    })),
  };
}
