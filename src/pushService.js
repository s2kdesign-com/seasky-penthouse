'use strict';

const webpush = require('web-push');
const db = require('./db');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@localhost',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

/**
 * Send a push notification to all subscribers.
 * Dead/expired subscriptions are cleaned up automatically.
 */
async function sendToAll(title, body, data = {}) {
  const subs = db.getAllSubs();
  if (!subs.length) return;

  const payload = JSON.stringify({ title, body, ...data });

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
      } catch (err) {
        // 404 / 410 means the subscription is gone — remove it
        if (err.statusCode === 404 || err.statusCode === 410) {
          db.removeSub(s.endpoint);
        }
      }
    }),
  );
}

module.exports = { sendToAll };
