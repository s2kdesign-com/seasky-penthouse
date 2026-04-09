/**
 * Authentication — Google OAuth 2.0 + HMAC-signed cookie sessions.
 * Replaces Passport.js + express-session for Cloudflare Workers.
 */

import * as db from './db.js';

const SESSION_COOKIE = 'seasky_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ─── HMAC session signing ────────────────────────────────────────────────────

async function getSigningKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signSession(userId, secret) {
  const key = await getSigningKey(secret);
  const data = `${userId}`;
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${userId}.${sigB64}`;
}

async function verifySession(cookie, secret) {
  if (!cookie) return null;
  const dotIdx = cookie.indexOf('.');
  if (dotIdx < 0) return null;

  const userId = cookie.slice(0, dotIdx);
  const sigB64 = cookie.slice(dotIdx + 1);

  const key = await getSigningKey(secret);
  const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(userId));
  return valid ? parseInt(userId, 10) : null;
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(v.join('='));
  });
  return cookies;
}

function sessionCookieHeader(value, maxAge) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

// ─── Session middleware ──────────────────────────────────────────────────────

export async function getSessionUser(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const sessionCookie = cookies[SESSION_COOKIE];
  if (!sessionCookie) return null;

  const secret = await db.getConfig(env.DB, 'SESSION_SECRET') || 'fallback-secret';
  const userId = await verifySession(sessionCookie, secret);
  if (!userId) return null;

  return db.getUserById(env.DB, userId);
}

// ─── Google OAuth routes ─────────────────────────────────────────────────────

export async function handleGoogleRedirect(request, env) {
  const clientId = await db.getConfig(env.DB, 'GOOGLE_CLIENT_ID');
  const baseUrl = env.BASE_URL || 'https://seasky-calendar.coingardenworld.workers.dev';
  const redirectUri = `${baseUrl}/auth/google/callback`;

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  });

  return new Response(null, {
    status: 302,
    headers: {
      'Location': `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    },
  });
}

export async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return new Response(null, { status: 302, headers: { 'Location': '/?login_error=1' } });
  }

  const clientId = await db.getConfig(env.DB, 'GOOGLE_CLIENT_ID');
  const clientSecret = await db.getConfig(env.DB, 'GOOGLE_CLIENT_SECRET');
  const baseUrl = env.BASE_URL || 'https://seasky-calendar.coingardenworld.workers.dev';
  const redirectUri = `${baseUrl}/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return new Response(null, { status: 302, headers: { 'Location': '/?login_error=1' } });
  }

  const tokens = await tokenRes.json();

  // Get user info
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` },
  });

  if (!userInfoRes.ok) {
    return new Response(null, { status: 302, headers: { 'Location': '/?login_error=1' } });
  }

  const userInfo = await userInfoRes.json();

  // Upsert user in DB
  const user = await db.upsertUser(
    env.DB,
    userInfo.sub,                        // Google ID
    userInfo.name || 'Unknown',
    userInfo.email || null,
    userInfo.picture || null
  );

  // Create session cookie
  const secret = await db.getConfig(env.DB, 'SESSION_SECRET') || 'fallback-secret';
  const sessionValue = await signSession(user.id, secret);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': sessionCookieHeader(sessionValue, SESSION_MAX_AGE),
    },
  });
}

export async function handleLogout() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': sessionCookieHeader('', 0),
    },
  });
}
