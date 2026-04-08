'use strict';

let calendar;
let feedMeta    = [];
let currentUser = null;

// ─── WASM calendar utilities ──────────────────────────────────────────────────

let wasmExports = null;

async function loadWasm() {
  try {
    const base = document.querySelector('meta[name="base-url"]')?.content || '';
    const res  = await WebAssembly.instantiateStreaming(fetch(`${base}/calendar.wasm`));
    wasmExports = res.instance.exports;
    console.log('[WASM] calendar.wasm loaded');
  } catch (e) {
    console.warn('[WASM] calendar.wasm unavailable, using JS fallback', e.message);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function nightCount(start, end) {
  if (!start || !end) return null;
  const ms = BigInt(new Date(end)) - BigInt(new Date(start));
  if (ms <= 0n) return null;
  // Use WASM if loaded, otherwise pure JS
  const nights = wasmExports
    ? wasmExports.nightCount(BigInt(new Date(start)), BigInt(new Date(end)))
    : Number(ms / 86400000n);
  return nights > 0 ? nights : null;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toInputDt(isoStr) {
  if (!isoStr) return '';
  return isoStr.slice(0, 16);
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  if (page === 'users')    loadUsersPage();
  if (page === 'logs')     loadLogsPage();
  if (page === 'settings') initPush();
}

document.querySelectorAll('.nav-item').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(a.dataset.page);
  });
});

// Sidebar toggle + mobile backdrop
const sidebarEl   = document.getElementById('sidebar');
const backdropEl  = document.createElement('div');
backdropEl.className = 'sidebar-backdrop';
document.body.appendChild(backdropEl);

function isMobile() { return window.innerWidth <= 768; }

function openSidebar()  { sidebarEl.classList.remove('collapsed'); if (isMobile()) backdropEl.classList.add('visible'); }
function closeSidebar() { sidebarEl.classList.add('collapsed');    backdropEl.classList.remove('visible'); }
function toggleSidebar() { sidebarEl.classList.contains('collapsed') ? openSidebar() : closeSidebar(); }

document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
backdropEl.addEventListener('click', closeSidebar);

// Close sidebar on nav click on mobile
document.querySelectorAll('.nav-item').forEach(a => {
  a.addEventListener('click', () => { if (isMobile()) closeSidebar(); });
});

// Init sidebar state based on screen size
if (isMobile()) closeSidebar();

// ─── Header auth ──────────────────────────────────────────────────────────────

function renderAuth(user) {
  const el = document.getElementById('header-auth');

  if (!user) {
    if (IS_STATIC) {
      el.innerHTML = '<div id="g_signin_btn"></div>';
      return;
    }
    el.innerHTML = `
      <a href="/auth/google" class="btn-google-login">
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Sign in with Google
      </a>`;
    return;
  }

  if (IS_STATIC) {
    el.innerHTML = `
      <div class="user-chip">
        ${user.avatar ? `<img class="user-avatar" src="${escHtml(user.avatar)}" alt="" />` : ''}
        <span class="user-name">${escHtml(user.name)}</span>
        <button class="btn-logout" id="static-signout">Sign out</button>
      </div>`;
    document.getElementById('static-signout').addEventListener('click', () => {
      localStorage.removeItem('static_user');
      currentUser = null;
      renderAuth(null);
      loadStaticGoogleAuth();
    });
    return;
  }

  el.innerHTML = `
    <div class="user-chip">
      ${user.avatar ? `<img class="user-avatar" src="${escHtml(user.avatar)}" alt="" />` : ''}
      <span class="user-name">${escHtml(user.name)}</span>
      <span class="role-badge ${escHtml(user.role)}">${escHtml(user.role)}</span>
      <a href="/auth/logout" class="btn-logout">Sign out</a>
    </div>`;
}

function loadStaticGoogleAuth() {
  const clientId = document.querySelector('meta[name="google-client-id"]')?.content;
  if (!clientId) return;

  // Check for a stored session first
  const stored = localStorage.getItem('static_user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      renderAuth(currentUser);
      return;
    } catch (e) {
      localStorage.removeItem('static_user');
    }
  }

  renderAuth(null); // render button container

  const onGisLoad = () => {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        // Decode JWT payload (display only — trust comes from Google's popup)
        const base64 = response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        const user = { name: payload.name, email: payload.email, avatar: payload.picture };
        localStorage.setItem('static_user', JSON.stringify(user));
        currentUser = user;
        renderAuth(user);
      },
    });
    google.accounts.id.renderButton(
      document.getElementById('g_signin_btn'),
      { theme: 'filled_black', size: 'medium', shape: 'pill' },
    );
  };

  if (window.google?.accounts) {
    onGisLoad();
  } else {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = onGisLoad;
    document.head.appendChild(s);
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function renderLegend() {
  document.getElementById('legend').innerHTML = feedMeta.map(f => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${f.color}"></span>
      ${escHtml(f.name)}
    </div>`).join('');
}

function renderStats(statusData, events) {
  const totalCard = `
    <div class="stat-card">
      <span class="stat-label">Total Bookings</span>
      <span class="stat-value">${events.length}</span>
      <span class="stat-sub">across all sources</span>
    </div>`;

  const feedCards = statusData.feeds.map(f => {
    const meta = feedMeta.find(m => m.id === f.id) || {};
    return `
      <div class="stat-card status-${f.status}">
        <span class="stat-label" style="color:${meta.color}">${escHtml(f.name)}</span>
        <span class="stat-value">${f.count ?? 0}</span>
        <span class="stat-sub">
          <span class="stat-dot">${f.status === 'ok' ? '●' : '✕'}</span>
          ${f.status === 'ok' ? 'Synced' : 'Error: ' + escHtml(f.error || 'unknown')}
        </span>
      </div>`;
  });

  document.getElementById('stats-row').innerHTML = totalCard + feedCards.join('');
}

async function loadAll() {
  const [events, status] = await Promise.all([
    apiGet('/api/events'),
    apiGet('/api/status'),
  ]);

  document.getElementById('last-sync-label').textContent =
    status.lastSync ? `Last sync: ${fmtDate(status.lastSync)}` : 'Last sync: —';

  renderStats(status, events);
  calendar.removeAllEvents();
  calendar.addEventSource(events);
}

document.getElementById('sync-btn').addEventListener('click', async () => {
  const btn = document.getElementById('sync-btn');
  btn.classList.add('loading');
  btn.textContent = '⏳ Syncing…';
  try {
    await fetch('/api/sync', { method: 'POST' });
    await loadAll();
  } finally {
    btn.classList.remove('loading');
    btn.innerHTML = '&#8635; Sync now';
  }
});

// ─── Event modal ──────────────────────────────────────────────────────────────

function openModal(info) {
  const ev = info.event;
  const props = ev.extendedProps;
  const meta = feedMeta.find(f => f.id === props.source) || {};
  const nights = nightCount(ev.startStr, ev.endStr);
  const isAdmin = currentUser?.role === 'admin';

  const editSection = isAdmin ? `
    <div class="edit-divider"></div>
    <form id="edit-times-form" class="edit-form">
      <div class="edit-row">
        <label>Check-in</label>
        <input type="datetime-local" name="start_dt" value="${toInputDt(ev.startStr)}" required />
      </div>
      <div class="edit-row">
        <label>Check-out</label>
        <input type="datetime-local" name="end_dt" value="${toInputDt(ev.endStr)}" required />
      </div>
      <div class="edit-actions">
        <button type="submit" class="btn-save">Save changes</button>
        <span id="edit-status" class="edit-status"></span>
      </div>
    </form>` : '';

  document.getElementById('modal-body').innerHTML = `
    <span class="modal-source-badge" style="background:${meta.color || '#555'}">${escHtml(props.sourceName || props.source)}</span>
    <div class="modal-title">${escHtml(ev.title)}</div>
    <div class="modal-row"><strong>Check-in</strong>  ${fmtDate(ev.startStr)}</div>
    <div class="modal-row"><strong>Check-out</strong> ${fmtDate(ev.endStr)}</div>
    ${nights ? `<div class="modal-row"><strong>Nights</strong> ${nights}</div>` : ''}
    ${props.description ? `<div class="modal-row"><strong>Notes</strong> ${escHtml(props.description)}</div>` : ''}
    ${editSection}
  `;

  if (isAdmin) {
    document.getElementById('edit-times-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const statusEl = document.getElementById('edit-status');
      statusEl.textContent = 'Saving…'; statusEl.className = 'edit-status';

      const res = await fetch(`/api/events/${encodeURIComponent(ev.id)}/override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_dt: fd.get('start_dt'), end_dt: fd.get('end_dt'), title: ev.title }),
      });

      if (res.ok) {
        statusEl.textContent = 'Saved!'; statusEl.classList.add('ok');
        await loadAll();
      } else {
        statusEl.textContent = 'Error saving.'; statusEl.classList.add('err');
      }
    });
  }

  document.getElementById('modal').classList.remove('hidden');
}

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
});

// ─── Users page ───────────────────────────────────────────────────────────────

async function loadUsersPage() {
  const container = document.getElementById('users-content');
  container.innerHTML = '<p class="loading-text">Loading…</p>';

  const res = await fetch('/api/admin/users');
  if (!res.ok) { container.innerHTML = '<p class="loading-text">Access denied.</p>'; return; }
  const users = await res.json();

  if (!users.length) { container.innerHTML = '<p class="loading-text">No users yet.</p>'; return; }

  const rows = users.map(u => `
    <tr data-id="${u.id}">
      <td>
        ${u.avatar ? `<img class="user-row-avatar" src="${escHtml(u.avatar)}" alt="" />` : ''}
        ${escHtml(u.name)}
      </td>
      <td>${escHtml(u.email || '—')}</td>
      <td>
        <select class="role-select" data-uid="${u.id}"
          ${u.id === currentUser?.id ? 'disabled title="Cannot change your own role"' : ''}>
          <option value="admin"      ${u.role === 'admin'      ? 'selected' : ''}>admin</option>
          <option value="subscriber" ${u.role === 'subscriber' ? 'selected' : ''}>subscriber</option>
        </select>
      </td>
      <td>${fmtDate(u.last_login) || '—'}</td>
      <td>${fmtDateShort(u.created_at) || '—'}</td>
      <td>
        ${u.id !== currentUser?.id
          ? `<button class="btn-delete" data-uid="${u.id}">&#x2715; Remove</button>`
          : '<span style="color:var(--text-muted);font-size:0.75rem">you</span>'}
      </td>
    </tr>`).join('');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Last login</th>
          <th>Joined</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  container.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      await fetch(`/api/admin/users/${sel.dataset.uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: sel.value }),
      });
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this user?')) return;
      const r = await fetch(`/api/admin/users/${btn.dataset.uid}`, { method: 'DELETE' });
      if (r.ok) btn.closest('tr').remove();
    });
  });
}

// ─── Logs page ────────────────────────────────────────────────────────────────

function logBadge(action) {
  const a = action.toLowerCase();
  if (a.includes('sync'))  return ['log-badge-sync',      'Sync'];
  if (a.includes('event')) return ['log-badge-event',     'Event'];
  if (a.includes('user') || a.includes('role') || a.includes('removed'))
                           return ['log-badge-user-mgmt', 'Users'];
  return ['log-badge-other', 'Other'];
}

async function loadLogsPage() {
  const container = document.getElementById('logs-content');
  container.innerHTML = '<p class="loading-text">Loading…</p>';

  const res = await fetch('/api/admin/logs');
  if (!res.ok) { container.innerHTML = '<p class="loading-text">Access denied.</p>'; return; }
  const logs = await res.json();

  if (!logs.length) { container.innerHTML = '<p class="loading-text">No activity yet.</p>'; return; }

  const rows = logs.map(l => {
    const [cls, label] = logBadge(l.action);
    return `
      <tr>
        <td class="log-time">${fmtDate(l.created_at)}</td>
        <td><span class="log-badge ${cls}">${label}</span></td>
        <td class="log-user">${escHtml(l.user_name || '—')}</td>
        <td class="log-action">${escHtml(l.action)}</td>
        <td class="log-details">${escHtml(l.details || '')}</td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Type</th>
          <th>User</th>
          <th>Action</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

document.getElementById('logs-refresh').addEventListener('click', loadLogsPage);

// ─── Push notifications ───────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const pad = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function initPush() {
  const toggle   = document.getElementById('push-toggle');
  const statusEl = document.getElementById('push-status');
  if (!toggle) return;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    statusEl.textContent = 'Not supported in this browser';
    toggle.disabled = true;
    return;
  }

  // Register service worker
  const reg = await navigator.serviceWorker.register('./sw.js');

  // Check current subscription state
  const existing = await reg.pushManager.getSubscription();
  toggle.checked = !!existing;
  if (existing) { statusEl.textContent = 'Enabled'; statusEl.className = 'push-status ok'; }

  toggle.addEventListener('change', async () => {
    statusEl.textContent = '…';
    statusEl.className = 'push-status';

    if (toggle.checked) {
      // Request permission
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toggle.checked = false;
        statusEl.textContent = 'Permission denied';
        statusEl.className = 'push-status err';
        return;
      }
      // Get VAPID public key
      const { key } = await (await fetch('/api/push/vapid-public-key')).json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      statusEl.textContent = 'Enabled'; statusEl.className = 'push-status ok';
    } else {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      statusEl.textContent = 'Disabled'; statusEl.className = 'push-status';
    }
  });
}

// ─── Settings page ────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function initSettings() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

// Detect static/GitHub Pages mode (no server API available)
const IS_STATIC = document.documentElement.dataset.static === 'true';

async function apiGet(path) {
  if (IS_STATIC) {
    // Map API paths to pre-generated JSON files
    const map = {
      '/api/events':  './data/events.json',
      '/api/status':  './data/status.json',
      '/api/feeds':   './data/feeds.json',
      '/api/me':      null,
    };
    const file = map[path];
    if (!file) return null;
    const r = await fetch(file);
    return r.ok ? r.json() : null;
  }
  const r = await fetch(path);
  return r.ok ? r.json() : null;
}

async function init() {
  await loadWasm();

  if (IS_STATIC) {
    loadStaticGoogleAuth();
  } else {
    currentUser = await apiGet('/api/me');
    renderAuth(currentUser);
  }

  // Show admin-only nav items
  if (currentUser?.role === 'admin') {
    document.querySelectorAll('.nav-admin-only').forEach(el => el.classList.add('visible'));
  }

  // Hide admin-only controls in static mode or for non-admins
  if (IS_STATIC || !currentUser || currentUser.role !== 'admin') {
    document.getElementById('sync-btn').style.display = 'none';
  }
  if (IS_STATIC) {
    document.querySelectorAll('.nav-admin-only').forEach(el => el.style.display = 'none');
  }

  feedMeta = (await apiGet('/api/feeds')) || [];
  renderLegend();

  const calEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'multiMonthYear,dayGridMonth,timeGridWeek,listMonth',
    },
    height: 'auto',
    firstDay: 1,
    nowIndicator: true,
    eventDisplay: 'block',
    eventClick: openModal,
    eventDidMount(info) { info.el.title = info.event.title; },
  });
  calendar.render();

  initSettings();
  initPush();

  await loadAll();
  setInterval(loadAll, 60 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);
