'use strict';

let calendar;
let feedMeta    = [];
let currentUser = null;

// ─── i18n ─────────────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  en: {
    'header.subtitle':       'Booking Dashboard',
    'nav.dashboard':         'Dashboard',
    'nav.users':             'Users',
    'nav.logs':              'Logs',
    'nav.settings':          'Settings',
    'btn.syncNow':           'Sync now',
    'btn.refresh':           'Refresh',
    'status.loading':        'Loading…',
    'status.denied':         'Access denied.',
    'settings.appearance':   'Appearance',
    'settings.theme':        'Theme',
    'settings.themeDesc':    'Choose how the dashboard looks',
    'settings.dark':         'Dark',
    'settings.light':        'Light',
    'settings.regional':     'Regional',
    'settings.timezone':     'Time zone',
    'settings.timezoneDesc': 'Times displayed throughout the dashboard',
    'settings.tzAuto':       'Auto (browser)',
    'settings.notifications':'Notifications',
    'settings.push':         'Push notifications',
    'settings.pushDesc':     'Get notified when new bookings are detected',
    'stats.total':           'Total Bookings',
    'stats.acrossAll':       'across all sources',
    'stats.upcoming':        'Upcoming',
    'stats.occupancy':       'Occupancy',
    'stats.thisMonth':       'this month',
    'stats.nights':          'nights',
    'stats.synced':          'Synced',
    'stats.error':           'Error:',
    'stats.lastSync':        'Last sync:',
    'auth.signIn':           'Sign in with Google',
    'auth.signOut':          'Sign out',
    'users.noUsers':         'No users yet.',
    'users.colName':         'Name',
    'users.colEmail':        'Email',
    'users.colRole':         'Role',
    'users.colLastLogin':    'Last login',
    'users.colJoined':       'Joined',
    'users.you':             'you',
    'users.remove':          '✕ Remove',
    'users.confirmRemove':   'Remove this user?',
    'logs.noActivity':       'No activity yet.',
    'logs.colTime':          'Time',
    'logs.colType':          'Type',
    'logs.colUser':          'User',
    'logs.colAction':        'Action',
    'logs.colDetails':       'Details',
    'logs.title':            'Activity Logs',
    'modal.checkIn':         'Check-in',
    'modal.checkOut':        'Check-out',
    'modal.nights':          'Nights',
    'modal.notes':           'Notes',
    'modal.save':            'Save changes',
    'modal.saving':          'Saving…',
    'modal.saved':           'Saved!',
    'modal.saveError':       'Error saving.',
    'push.notSupported':     'Not supported in this browser',
    'push.enabled':          'Enabled',
    'push.disabled':         'Disabled',
    'push.permDenied':       'Permission denied',
    'cal.locale':            'en',
    'legend.past':           'Past',
    'legend.today':          'Today',
    'legend.booked':         'Booked',
    'legend.available':      'Available',
    'legend.checkin':        'Check-in',
    'legend.checkout':       'Check-out',
    'nav.links':             'Links',
    'links.social':          'Like us & Leave a comment',
    'links.rent':            'Rent the apartment',
    'links.facebookDesc':    'Follow us on Facebook',
    'links.instagramDesc':   'See our photos',
    'links.googleDesc':      'Rate us on Google',
    'links.officialSite':    'Official Website',
    'links.bookingDesc':     'Book on Booking.com',
    'links.airbnbDesc':      'Book on Airbnb',
    'btn.subscribe':         'Subscribe',
    'nav.subscribe':         'Subscribe',
    'subscribe.title':       'Subscribe to Calendar',
    'subscribe.desc':        'Add SeaSky Penthouse bookings to your personal calendar. Events sync automatically.',
    'subscribe.heroTitle':   'Stay Updated with Our Availability',
    'subscribe.heroDesc':    'Subscribe to the SeaSky Penthouse calendar and see live booking availability directly in your personal calendar app. Events sync automatically every hour.',
    'subscribe.chooseApp':   'Choose your calendar app',
    'subscribe.orManual':    'Or add manually',
    'subscribe.icsUrlLabel': 'iCal feed URL',
    'subscribe.urlHint':     'Paste this URL into any calendar app that supports iCal subscriptions.',
    'subscribe.googleDesc':  'Add as subscription feed',
    'subscribe.outlookDesc': 'Open in Outlook calendar',
    'subscribe.appleDesc':   'Subscribe on iPhone / Mac',
    'subscribe.copyUrl':     'Copy iCal URL',
    'subscribe.copied':      'Copied!',
    'subscribe.download':    'Download .ics file',
    'nav.linkConfig':        'Link Settings',
    'linkConfig.social':     'Social & Review Links',
    'linkConfig.rental':     'Rental Platform Links',
    'linkConfig.facebookDesc':'Facebook page URL',
    'linkConfig.instagramDesc':'Instagram profile URL',
    'linkConfig.googleDesc': 'Google review / share URL',
    'linkConfig.officialDesc':'Your property website URL',
    'linkConfig.bookingDesc':'Booking.com listing URL',
    'linkConfig.airbnbDesc': 'Airbnb listing URL',
    'linkConfig.save':       'Save Links',
    'linkConfig.saving':     'Saving...',
    'linkConfig.saved':      'Links saved!',
    'linkConfig.error':      'Error saving links.',
    'nav.account':           'Account',
    'account.profile':       'Profile',
    'account.session':       'Session',
    'account.dangerZone':    'Danger Zone',
    'account.signOutTitle':  'Sign out of this device',
    'account.signOutDesc':   'You will need to sign in again with Google',
    'account.name':          'Name',
    'account.email':         'Email',
    'account.role':          'Role',
    'account.provider':      'Sign-in provider',
    'account.google':        'Google',
    'account.joined':        'Member since',
    'account.lastLogin':     'Last login',
    'account.notSignedIn':   'You are not signed in.',
    'account.signInPrompt':  'Sign in with Google to view your account.',
  },
  bg: {
    'header.subtitle':       'Система за резервации',
    'nav.dashboard':         'Табло',
    'nav.users':             'Потребители',
    'nav.logs':              'Журнал',
    'nav.settings':          'Настройки',
    'btn.syncNow':           'Синхронизирай',
    'btn.refresh':           'Обнови',
    'status.loading':        'Зареждане…',
    'status.denied':         'Достъпът е отказан.',
    'settings.appearance':   'Изглед',
    'settings.theme':        'Тема',
    'settings.themeDesc':    'Изберете как изглежда таблото',
    'settings.dark':         'Тъмна',
    'settings.light':        'Светла',
    'settings.regional':     'Регионални',
    'settings.timezone':     'Часова зона',
    'settings.timezoneDesc': 'Часовете в таблото се показват в тази зона',
    'settings.tzAuto':       'Автоматично (браузър)',
    'settings.notifications':'Известия',
    'settings.push':         'Push известия',
    'settings.pushDesc':     'Известие при нова резервация',
    'stats.total':           'Общо резервации',
    'stats.acrossAll':       'от всички източници',
    'stats.upcoming':        'Предстоящи',
    'stats.occupancy':       'Заетост',
    'stats.thisMonth':       'този месец',
    'stats.nights':          'нощувки',
    'stats.synced':          'Синхронизирано',
    'stats.error':           'Грешка:',
    'stats.lastSync':        'Последна синхронизация:',
    'auth.signIn':           'Вход с Google',
    'auth.signOut':          'Изход',
    'users.noUsers':         'Няма потребители.',
    'users.colName':         'Име',
    'users.colEmail':        'Имейл',
    'users.colRole':         'Роля',
    'users.colLastLogin':    'Последен вход',
    'users.colJoined':       'Регистриран',
    'users.you':             'вие',
    'users.remove':          '✕ Премахни',
    'users.confirmRemove':   'Премахване на потребителя?',
    'logs.noActivity':       'Няма дейност.',
    'logs.colTime':          'Час',
    'logs.colType':          'Тип',
    'logs.colUser':          'Потребител',
    'logs.colAction':        'Действие',
    'logs.colDetails':       'Детайли',
    'logs.title':            'Журнал на дейността',
    'modal.checkIn':         'Настаняване',
    'modal.checkOut':        'Напускане',
    'modal.nights':          'Нощувки',
    'modal.notes':           'Бележки',
    'modal.save':            'Запази промените',
    'modal.saving':          'Запазване…',
    'modal.saved':           'Запазено!',
    'modal.saveError':       'Грешка при запазване.',
    'push.notSupported':     'Не се поддържа в браузъра',
    'push.enabled':          'Активирано',
    'push.disabled':         'Деактивирано',
    'push.permDenied':       'Разрешението е отказано',
    'cal.locale':            'bg',
    'legend.past':           'Минали',
    'legend.today':          'Днес',
    'nav.links':             'Връзки',
    'links.social':          'Харесайте ни и оставете коментар',
    'links.rent':            'Наемете апартамента',
    'links.facebookDesc':    'Последвайте ни във Facebook',
    'links.instagramDesc':   'Вижте нашите снимки',
    'links.googleDesc':      'Оценете ни в Google',
    'links.officialSite':    'Официален сайт',
    'links.bookingDesc':     'Резервирайте в Booking.com',
    'links.airbnbDesc':      'Резервирайте в Airbnb',
    'btn.subscribe':         'Абониране',
    'nav.subscribe':         'Абониране',
    'subscribe.title':       'Абониране за календар',
    'subscribe.desc':        'Добавете резервациите на SeaSky Penthouse към личния си календар. Събитията се синхронизират автоматично.',
    'subscribe.heroTitle':   'Следете наличността ни',
    'subscribe.heroDesc':    'Абонирайте се за календара на SeaSky Penthouse и вижте наличността на резервациите директно в личния си календар. Събитията се синхронизират автоматично всеки час.',
    'subscribe.chooseApp':   'Изберете календарно приложение',
    'subscribe.orManual':    'Или добавете ръчно',
    'subscribe.icsUrlLabel': 'iCal абонаментен URL',
    'subscribe.urlHint':     'Поставете този URL във всяко календарно приложение, което поддържа iCal абонаменти.',
    'subscribe.googleDesc':  'Добави като абонамент',
    'subscribe.outlookDesc': 'Отвори в Outlook календар',
    'subscribe.appleDesc':   'Абонирай се на iPhone / Mac',
    'subscribe.copyUrl':     'Копирай iCal URL',
    'subscribe.copied':      'Копирано!',
    'subscribe.download':    'Изтегли .ics файл',
    'nav.linkConfig':        'Настройка на линкове',
    'linkConfig.social':     'Социални мрежи и отзиви',
    'linkConfig.rental':     'Платформи за наемане',
    'linkConfig.facebookDesc':'URL на Facebook страницата',
    'linkConfig.instagramDesc':'URL на Instagram профила',
    'linkConfig.googleDesc': 'URL за Google отзив / споделяне',
    'linkConfig.officialDesc':'URL на вашия уебсайт',
    'linkConfig.bookingDesc':'URL на обявата в Booking.com',
    'linkConfig.airbnbDesc': 'URL на обявата в Airbnb',
    'linkConfig.save':       'Запази линковете',
    'linkConfig.saving':     'Запазване...',
    'linkConfig.saved':      'Линковете са запазени!',
    'linkConfig.error':      'Грешка при запазване.',
    'nav.account':           'Акаунт',
    'account.profile':       'Профил',
    'account.session':       'Сесия',
    'account.dangerZone':    'Опасна зона',
    'account.signOutTitle':  'Изход от устройството',
    'account.signOutDesc':   'Ще трябва да влезете отново с Google',
    'account.name':          'Име',
    'account.email':         'Имейл',
    'account.role':          'Роля',
    'account.provider':      'Вход чрез',
    'account.google':        'Google',
    'account.joined':        'Член от',
    'account.lastLogin':     'Последен вход',
    'account.notSignedIn':   'Не сте влезли в профила си.',
    'account.signInPrompt':  'Влезте с Google, за да видите акаунта си.',
    'legend.booked':         'Заети',
    'legend.available':      'Свободни',
    'legend.checkin':        'Настаняване',
    'legend.checkout':       'Напускане',
  },
};

let currentLang = localStorage.getItem('lang') || 'en';
let userTimezone = localStorage.getItem('timezone') || '';  // '' = auto (browser default)

function getUserTZ() {
  return userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // Update active lang button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
  // Update html lang attribute
  document.documentElement.lang = currentLang;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
  // Update calendar locale if initialised
  if (calendar) {
    calendar.setOption('locale', t('cal.locale'));
  }
  // Re-render dynamic content
  renderAuth(currentUser);
  const statsRow = document.getElementById('stats-row');
  if (statsRow && statsRow.children.length) {
    loadAll();
  }
}

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
    timeZone: getUserTZ(),
  });
}

function fmtDateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    timeZone: getUserTZ(),
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

  if (page === 'users')       loadUsersPage();
  if (page === 'logs')        loadLogsPage();
  if (page === 'subscribe')   loadSubscribePage();
  if (page === 'link-config') loadLinkConfigPage();
  if (page === 'account')     loadAccountPage();
  if (page === 'settings')    { initTimezone(); initPush(); }
}

document.querySelectorAll('.nav-item').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(a.dataset.page);
  });
});

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
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
      el.innerHTML = `
        <button class="btn-google-login" id="static-google-btn">
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          ${t('auth.signIn')}
        </button>`;
      document.getElementById('static-google-btn').addEventListener('click', () => {
        if (_gisTokenClient) {
          _gisTokenClient.requestAccessToken({ prompt: 'select_account' });
        }
      });
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
        ${t('auth.signIn')}
      </a>`;
    return;
  }

  if (IS_STATIC) {
    el.innerHTML = `
      <div class="user-chip">
        ${user.avatar ? `<img class="user-avatar" src="${escHtml(user.avatar)}" alt="" />` : ''}
        <span class="user-name">${escHtml(user.name)}</span>
        <button class="btn-logout" id="static-signout">${t('auth.signOut')}</button>
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
      <a href="/auth/logout" class="btn-logout">${t('auth.signOut')}</a>
    </div>`;
}

let _gisTokenClient = null;
let _appConfig = null;

async function loadStaticGoogleAuth() {
  // Load public config from API / static JSON
  _appConfig = (await apiGet('/api/config')) || {};
  const clientId = _appConfig.GOOGLE_CLIENT_ID;
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

  renderAuth(null); // render button

  const onGisLoad = () => {
    // Use oauth2 token client — always opens a real popup on button click
    _gisTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (response) => {
        if (response.error) return;
        try {
          const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` },
          }).then(r => r.json());
          const user = { name: info.name, email: info.email, avatar: info.picture };
          localStorage.setItem('static_user', JSON.stringify(user));
          currentUser = user;
          renderAuth(user);
        } catch (e) { /* network error — ignore */ }
      },
    });
  };

  if (window.google?.accounts?.oauth2) {
    onGisLoad();
  } else {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = onGisLoad;
    document.head.appendChild(s);
  }
}

// ─── Booking Map & Cell Styling ──────────────────────────────────────────────

function buildBookingMap(events) {
  const map = new Map();
  for (const ev of events) {
    const props = ev.extendedProps || ev;
    const rawStart = ev.startStr || ev.start;
    const rawEnd   = ev.endStr   || ev.end;
    if (!rawStart || !rawEnd) continue;

    const startD = new Date(rawStart);
    const endD   = new Date(rawEnd);
    // Normalize to date-only strings (YYYY-MM-DD)
    const startDate = rawStart.slice(0, 10);
    const endDate   = rawEnd.slice(0, 10);

    // Iterate day by day from start to end (inclusive)
    const cur = new Date(startDate + 'T00:00:00Z');
    const last = new Date(endDate + 'T00:00:00Z');

    while (cur <= last) {
      const key = cur.toISOString().slice(0, 10);
      const entry = {
        source: props.source,
        sourceName: props.sourceName || ev.title,
        color: props.color || ev.backgroundColor || '#888',
        title: ev.title,
        isCheckIn: key === startDate,
        isCheckOut: key === endDate,
      };
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(entry);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  return map;
}

function refreshCellStyles() {
  if (!calendar) return;
  const events = calendar.getEvents();
  const bookingMap = buildBookingMap(events);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + 'T00:00:00Z');

  const cells = document.querySelectorAll('.fc-daygrid-day');
  const statusClasses = ['day-past', 'day-today', 'day-booked', 'day-checkin', 'day-checkout', 'day-transition', 'day-available'];

  for (const cell of cells) {
    const dateStr = cell.getAttribute('data-date');
    if (!dateStr) continue;

    // Remove old status classes
    statusClasses.forEach(c => cell.classList.remove(c));

    const cellDate = new Date(dateStr + 'T00:00:00Z');
    const bookings = bookingMap.get(dateStr);

    if (cellDate < todayDate) {
      cell.classList.add('day-past');
    } else if (dateStr === todayStr) {
      cell.classList.add('day-today');
    } else if (bookings && bookings.length > 0) {
      // Check if this day has both a check-in and check-out from different bookings
      const hasCheckIn  = bookings.some(b => b.isCheckIn);
      const hasCheckOut = bookings.some(b => b.isCheckOut);
      const allCheckIn  = bookings.every(b => b.isCheckIn);
      const allCheckOut = bookings.every(b => b.isCheckOut);

      if (hasCheckIn && hasCheckOut && !allCheckIn && !allCheckOut) {
        // Transition day: one booking checks out, another checks in
        cell.classList.add('day-transition');
      } else if (allCheckIn) {
        cell.classList.add('day-checkin');
      } else if (allCheckOut) {
        cell.classList.add('day-checkout');
      } else {
        cell.classList.add('day-booked');
      }

      // Set custom property for booking color
      const mainColor = bookings.find(b => !b.isCheckOut)?.color || bookings[0].color;
      cell.style.setProperty('--booking-color', mainColor);
    } else {
      cell.classList.add('day-available');
    }
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function renderLegend() {
  // Property-style status legend
  const statusLegend = `
    <div class="legend-item">
      <span class="legend-swatch legend-swatch-past"></span>
      ${escHtml(t('legend.past'))}
    </div>
    <div class="legend-item">
      <span class="legend-swatch legend-swatch-today"></span>
      ${escHtml(t('legend.today'))}
    </div>
    <div class="legend-item">
      <span class="legend-swatch legend-swatch-booked"></span>
      ${escHtml(t('legend.booked'))}
    </div>
    <div class="legend-item">
      <span class="legend-swatch legend-swatch-available"></span>
      ${escHtml(t('legend.available'))}
    </div>
    <div class="legend-item">
      <span class="legend-swatch legend-swatch-checkin"></span>
      ${escHtml(t('legend.checkin'))}
    </div>
    <div class="legend-item">
      <span class="legend-swatch legend-swatch-checkout"></span>
      ${escHtml(t('legend.checkout'))}
    </div>`;

  // Source legend (existing feed colors)
  const sourceLegend = feedMeta.map(f => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${f.color}"></span>
      ${escHtml(f.name)}
    </div>`).join('');

  const divider = feedMeta.length ? '<span class="legend-divider"></span>' : '';

  document.getElementById('legend').innerHTML = statusLegend + divider + sourceLegend;
}

function renderStats(statusData, events) {
  // Calculate upcoming bookings (future only)
  const now = new Date();
  const upcoming = events.filter(ev => {
    const start = new Date(ev.start || ev.startStr);
    return start > now;
  });

  // Calculate occupancy for current month
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd   = new Date(Date.UTC(year, month + 1, 0));

  const occupiedDays = new Set();
  for (const ev of events) {
    const rawStart = ev.start || ev.startStr;
    const rawEnd   = ev.end   || ev.endStr;
    if (!rawStart || !rawEnd) continue;

    const evStart = new Date(rawStart.slice(0, 10) + 'T00:00:00Z');
    const evEnd   = new Date(rawEnd.slice(0, 10) + 'T00:00:00Z');

    const rangeStart = evStart < monthStart ? monthStart : evStart;
    const rangeEnd   = evEnd > monthEnd ? monthEnd : evEnd;

    const cur = new Date(rangeStart);
    while (cur <= rangeEnd) {
      occupiedDays.add(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  const occupiedNights = occupiedDays.size;
  const occupancyPct = daysInMonth > 0 ? Math.round((occupiedNights / daysInMonth) * 100) : 0;

  const totalCard = `
    <div class="stat-card">
      <span class="stat-label">${t('stats.total')}</span>
      <span class="stat-value">${events.length}</span>
      <span class="stat-sub">${t('stats.acrossAll')}</span>
    </div>`;

  const upcomingCard = `
    <div class="stat-card">
      <span class="stat-label">${t('stats.upcoming')}</span>
      <span class="stat-value">${upcoming.length}</span>
      <span class="stat-sub">${t('stats.acrossAll')}</span>
    </div>`;

  const occupancyCard = `
    <div class="stat-card">
      <span class="stat-label">${t('stats.occupancy')}</span>
      <span class="stat-value occupancy-value">${occupancyPct}%</span>
      <span class="stat-sub">${occupiedNights} ${t('stats.nights')} ${t('stats.thisMonth')}</span>
      <div class="occupancy-bar-wrap">
        <div class="occupancy-bar" style="width:${occupancyPct}%"></div>
      </div>
    </div>`;

  const feedCards = statusData.feeds.map(f => {
    const meta = feedMeta.find(m => m.id === f.id) || {};
    return `
      <div class="stat-card status-${f.status}">
        <span class="stat-label" style="color:${meta.color}">${escHtml(f.name)}</span>
        <span class="stat-value">${f.count ?? 0}</span>
        <span class="stat-sub">
          <span class="stat-dot">${f.status === 'ok' ? '●' : '✕'}</span>
          ${f.status === 'ok' ? t('stats.synced') : t('stats.error') + ' ' + escHtml(f.error || 'unknown')}
        </span>
      </div>`;
  });

  document.getElementById('stats-row').innerHTML = totalCard + upcomingCard + occupancyCard + feedCards.join('');
}

async function loadAll() {
  const [events, status] = await Promise.all([
    apiGet('/api/events'),
    apiGet('/api/status'),
  ]);

  document.getElementById('last-sync-label').textContent =
    status.lastSync ? `${t('stats.lastSync')} ${fmtDate(status.lastSync)}` : `${t('stats.lastSync')} —`;

  renderStats(status, events);
  calendar.removeAllEvents();
  calendar.addEventSource(events);
  setTimeout(refreshCellStyles, 80);
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

// ─── Subscribe to Calendar ───────────────────────────────────────────────────

// ─── Subscribe page ──────────────────────────────────────────────────────────

function getIcsUrls() {
  const baseUrl = IS_STATIC
    ? 'https://seasky-penthouse.coingardenworld.workers.dev'
    : window.location.origin;
  const icsUrl = `${baseUrl}/api/calendar.ics`;
  const webcalUrl = icsUrl.replace(/^https?:/, 'webcal:');
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(icsUrl)}&name=SeaSky%20Penthouse`;
  return { icsUrl, webcalUrl, googleUrl, outlookUrl };
}

function loadSubscribePage() {
  const { icsUrl, webcalUrl, googleUrl, outlookUrl } = getIcsUrls();

  // Page options
  const gEl = document.getElementById('page-sub-google');
  const oEl = document.getElementById('page-sub-outlook');
  const aEl = document.getElementById('page-sub-apple');
  const urlInput = document.getElementById('page-sub-url');
  const dlEl = document.getElementById('page-sub-download');

  if (gEl) gEl.href = googleUrl;
  if (oEl) oEl.href = outlookUrl;
  if (aEl) aEl.href = webcalUrl;
  if (urlInput) urlInput.value = icsUrl;
  if (dlEl) dlEl.href = icsUrl;

  // Copy button
  const copyBtn = document.getElementById('page-sub-copy');
  if (copyBtn) {
    const newBtn = copyBtn.cloneNode(true);
    copyBtn.parentNode.replaceChild(newBtn, copyBtn);
    newBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(icsUrl);
        const orig = newBtn.textContent;
        newBtn.textContent = t('subscribe.copied');
        newBtn.classList.add('copied');
        setTimeout(() => { newBtn.textContent = orig; newBtn.classList.remove('copied'); }, 2000);
      } catch (e) { /* fallback */ }
    });
  }
}

function initSubscribeModal() {
  const modal = document.getElementById('subscribe-modal');
  const closeBtn = document.getElementById('subscribe-modal-close');
  const subscribeBtn = document.getElementById('subscribe-btn');

  const { icsUrl, webcalUrl, googleUrl, outlookUrl } = getIcsUrls();

  // Set the URLs on the modal options
  document.getElementById('sub-google').href = googleUrl;
  document.getElementById('sub-outlook').href = outlookUrl;
  document.getElementById('sub-apple').href = webcalUrl;
  document.getElementById('sub-ics-url').textContent = icsUrl;
  document.getElementById('sub-download').href = icsUrl;

  // Copy URL button
  document.getElementById('sub-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      const titleEl = document.getElementById('sub-copy').querySelector('.subscribe-option-title');
      const orig = titleEl.textContent;
      titleEl.textContent = t('subscribe.copied');
      setTimeout(() => { titleEl.textContent = orig; }, 2000);
    } catch (e) { /* fallback */ }
  });

  // Dashboard button navigates to subscribe page
  subscribeBtn.addEventListener('click', () => { navigateTo('subscribe'); });

  // Modal still works if opened programmatically
  closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
}

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
        <label>${t('modal.checkIn')}</label>
        <input type="datetime-local" name="start_dt" value="${toInputDt(ev.startStr)}" required />
      </div>
      <div class="edit-row">
        <label>${t('modal.checkOut')}</label>
        <input type="datetime-local" name="end_dt" value="${toInputDt(ev.endStr)}" required />
      </div>
      <div class="edit-actions">
        <button type="submit" class="btn-save">${t('modal.save')}</button>
        <span id="edit-status" class="edit-status"></span>
      </div>
    </form>` : '';

  document.getElementById('modal-body').innerHTML = `
    <span class="modal-source-badge" style="background:${meta.color || '#555'}">${escHtml(props.sourceName || props.source)}</span>
    <div class="modal-title">${escHtml(ev.title)}</div>
    <div class="modal-row"><strong>${t('modal.checkIn')}</strong>  ${fmtDate(ev.startStr)}</div>
    <div class="modal-row"><strong>${t('modal.checkOut')}</strong> ${fmtDate(ev.endStr)}</div>
    ${nights ? `<div class="modal-row"><strong>${t('modal.nights')}</strong> ${nights}</div>` : ''}
    ${props.description ? `<div class="modal-row"><strong>${t('modal.notes')}</strong> ${escHtml(props.description)}</div>` : ''}
    ${editSection}
  `;

  if (isAdmin) {
    document.getElementById('edit-times-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const statusEl = document.getElementById('edit-status');
      statusEl.textContent = t('modal.saving'); statusEl.className = 'edit-status';

      const res = await fetch(`/api/events/${encodeURIComponent(ev.id)}/override`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_dt: fd.get('start_dt'), end_dt: fd.get('end_dt'), title: ev.title }),
      });

      if (res.ok) {
        statusEl.textContent = t('modal.saved'); statusEl.classList.add('ok');
        await loadAll();
      } else {
        statusEl.textContent = t('modal.saveError'); statusEl.classList.add('err');
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
  container.innerHTML = `<p class="loading-text">${t('status.loading')}</p>`;

  const res = await fetch('/api/admin/users');
  if (!res.ok) { container.innerHTML = `<p class="loading-text">${t('status.denied')}</p>`; return; }
  const users = await res.json();

  if (!users.length) { container.innerHTML = `<p class="loading-text">${t('users.noUsers')}</p>`; return; }

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
          ? `<button class="btn-delete" data-uid="${u.id}">${t('users.remove')}</button>`
          : `<span style="color:var(--text-muted);font-size:0.75rem">${t('users.you')}</span>`}
      </td>
    </tr>`).join('');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>${t('users.colName')}</th>
          <th>${t('users.colEmail')}</th>
          <th>${t('users.colRole')}</th>
          <th>${t('users.colLastLogin')}</th>
          <th>${t('users.colJoined')}</th>
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
      if (!confirm(t('users.confirmRemove'))) return;
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
  container.innerHTML = `<p class="loading-text">${t('status.loading')}</p>`;

  const res = await fetch('/api/admin/logs');
  if (!res.ok) { container.innerHTML = `<p class="loading-text">${t('status.denied')}</p>`; return; }
  const logs = await res.json();

  if (!logs.length) { container.innerHTML = `<p class="loading-text">${t('logs.noActivity')}</p>`; return; }

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
          <th>${t('logs.colTime')}</th>
          <th>${t('logs.colType')}</th>
          <th>${t('logs.colUser')}</th>
          <th>${t('logs.colAction')}</th>
          <th>${t('logs.colDetails')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

document.getElementById('logs-refresh').addEventListener('click', loadLogsPage);

// ─── Account page ────────────────────────────────────────────────────────────

// ─── Link Config (admin) ─────────────────────────────────────────────────────

const LINK_KEYS = ['LINK_FACEBOOK', 'LINK_INSTAGRAM', 'LINK_GOOGLE', 'LINK_OFFICIAL', 'LINK_BOOKING', 'LINK_AIRBNB'];

async function loadLinkConfigPage() {
  if (!currentUser || currentUser.role !== 'admin') return;
  try {
    const res = await fetch('/api/admin/config');
    if (!res.ok) return;
    const allConfig = await res.json();
    const configMap = {};
    for (const row of allConfig) configMap[row.key] = row.value;
    for (const key of LINK_KEYS) {
      const input = document.getElementById(`cfg-${key}`);
      if (input) input.value = configMap[key] || '';
    }
  } catch (e) { console.error('Failed to load link config', e); }

  // Wire up save button
  const saveBtn = document.getElementById('link-config-save');
  const statusEl = document.getElementById('link-config-status');

  // Remove old listener by cloning
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);

  newBtn.addEventListener('click', async () => {
    newBtn.disabled = true;
    statusEl.textContent = t('linkConfig.saving');
    statusEl.className = 'link-config-status';
    try {
      for (const key of LINK_KEYS) {
        const input = document.getElementById(`cfg-${key}`);
        const value = input ? input.value.trim() : '';
        await fetch(`/api/admin/config/${encodeURIComponent(key)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, is_public: true }),
        });
      }
      statusEl.textContent = t('linkConfig.saved');
      statusEl.className = 'link-config-status link-config-success';
      // Refresh dynamic links on the page
      await applyDynamicLinks();
    } catch (e) {
      statusEl.textContent = t('linkConfig.error');
      statusEl.className = 'link-config-status link-config-error';
    }
    newBtn.disabled = false;
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  });
}

async function applyDynamicLinks() {
  try {
    const config = await apiGet('/api/config');
    if (!config) return;
    for (const key of LINK_KEYS) {
      if (!config[key]) continue;
      document.querySelectorAll(`[data-link-key="${key}"]`).forEach(el => {
        el.href = config[key];
      });
    }
  } catch (e) { /* silent */ }
}

// ─── Account ─────────────────────────────────────────────────────────────────

function loadAccountPage() {
  const avatarWrap = document.getElementById('account-avatar-wrap');
  const infoEl     = document.getElementById('account-info');
  const sessionEl  = document.getElementById('account-session');
  const logoutBtn  = document.getElementById('account-logout-btn');

  if (!currentUser) {
    avatarWrap.innerHTML = `
      <div class="account-avatar-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>`;
    infoEl.innerHTML = `
      <p class="account-not-signed">${t('account.notSignedIn')}</p>
      <p class="account-sign-prompt">${t('account.signInPrompt')}</p>
      <a href="/auth/google" class="btn-google-login" style="margin-top:12px">
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        ${t('auth.signIn')}
      </a>`;
    sessionEl.innerHTML = '';
    logoutBtn.style.display = 'none';
    return;
  }

  logoutBtn.style.display = '';

  // Avatar
  avatarWrap.innerHTML = currentUser.avatar
    ? `<img class="account-avatar-lg" src="${escHtml(currentUser.avatar)}" alt="${escHtml(currentUser.name)}" />`
    : `<div class="account-avatar-placeholder">
        <span class="account-avatar-initial">${escHtml((currentUser.name || '?')[0].toUpperCase())}</span>
      </div>`;

  // Profile info
  const roleCls = currentUser.role === 'admin' ? 'admin' : 'subscriber';
  infoEl.innerHTML = `
    <h2 class="account-name">${escHtml(currentUser.name)}</h2>
    <p class="account-email">${escHtml(currentUser.email || '—')}</p>
    <span class="role-badge ${roleCls}" style="margin-top:6px">${escHtml(currentUser.role)}</span>
  `;

  // Session details
  const details = [
    { label: t('account.provider'), value: `<svg width="14" height="14" viewBox="0 0 48 48" style="vertical-align:-2px;margin-right:4px"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> ${t('account.google')}` },
    { label: t('account.joined'),   value: escHtml(fmtDateShort(currentUser.created_at)) },
    { label: t('account.lastLogin'), value: escHtml(fmtDate(currentUser.last_login)) },
  ];

  sessionEl.innerHTML = details.map(d => `
    <div class="account-detail-row">
      <span class="account-detail-label">${d.label}</span>
      <span class="account-detail-value">${d.value}</span>
    </div>
  `).join('');
}

// ─── Push notifications ───────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const pad = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ─── Timezone selector ───────────────────────────────────────────────────────

const COMMON_TIMEZONES = [
  'Pacific/Midway', 'Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles',
  'America/Denver', 'America/Chicago', 'America/New_York', 'America/Caracas',
  'America/Sao_Paulo', 'Atlantic/Azores', 'Europe/London', 'Europe/Paris',
  'Europe/Sofia', 'Europe/Helsinki', 'Europe/Moscow', 'Asia/Dubai',
  'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
  'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];

function initTimezone() {
  const select = document.getElementById('tz-select');
  const currentEl = document.getElementById('tz-current');
  if (!select) return;

  // Build the full timezone list: auto + common + all Intl timezones
  const allZones = new Set(COMMON_TIMEZONES);
  try {
    // Intl.supportedValuesOf is available in modern browsers
    if (Intl.supportedValuesOf) {
      for (const tz of Intl.supportedValuesOf('timeZone')) allZones.add(tz);
    }
  } catch (e) { /* fallback to common list */ }

  const sorted = [...allZones].sort((a, b) => {
    // Sort by UTC offset then name
    try {
      const now = Date.now();
      const offA = new Date(now).toLocaleString('en', { timeZone: a, timeZoneName: 'shortOffset' });
      const offB = new Date(now).toLocaleString('en', { timeZone: b, timeZoneName: 'shortOffset' });
      return offA.localeCompare(offB) || a.localeCompare(b);
    } catch { return a.localeCompare(b); }
  });

  // Build options
  select.innerHTML = '';
  const autoOpt = document.createElement('option');
  autoOpt.value = '';
  autoOpt.textContent = `${t('settings.tzAuto')} — ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  select.appendChild(autoOpt);

  for (const tz of sorted) {
    const opt = document.createElement('option');
    opt.value = tz;
    // Show UTC offset
    try {
      const off = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
        .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
      opt.textContent = `${tz.replace(/_/g, ' ')} (${off})`;
    } catch {
      opt.textContent = tz.replace(/_/g, ' ');
    }
    select.appendChild(opt);
  }

  // Set current value
  select.value = userTimezone;

  // Show current time in selected zone
  function updateCurrentTime() {
    const tz = getUserTZ();
    const now = new Date().toLocaleString(undefined, {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: tz, timeZoneName: 'short',
    });
    currentEl.textContent = now;
  }
  updateCurrentTime();
  const tzInterval = setInterval(updateCurrentTime, 1000);
  // Clean up when navigating away (simple approach: clear on next navigateTo)
  select._tzInterval = tzInterval;

  // Handle change
  select.addEventListener('change', () => {
    userTimezone = select.value;
    localStorage.setItem('timezone', userTimezone);
    updateCurrentTime();
    // Update calendar timezone
    if (calendar) {
      calendar.setOption('timeZone', getUserTZ());
    }
  });
}

// ─── Push notifications ─────────────────────────────────────────────────────

async function initPush() {
  const toggle   = document.getElementById('push-toggle');
  const statusEl = document.getElementById('push-status');
  if (!toggle) return;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    statusEl.textContent = t('push.notSupported');
    toggle.disabled = true;
    return;
  }

  // Register service worker
  const reg = await navigator.serviceWorker.register('./sw.js');

  // Check current subscription state
  const existing = await reg.pushManager.getSubscription();
  toggle.checked = !!existing;
  if (existing) { statusEl.textContent = t('push.enabled'); statusEl.className = 'push-status ok'; }

  toggle.addEventListener('change', async () => {
    statusEl.textContent = '…';
    statusEl.className = 'push-status';

    if (toggle.checked) {
      // Request permission
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toggle.checked = false;
        statusEl.textContent = t('push.permDenied');
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
      statusEl.textContent = t('push.enabled'); statusEl.className = 'push-status ok';
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
      statusEl.textContent = t('push.disabled'); statusEl.className = 'push-status';
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
      '/api/config':  './data/config.json',
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
    await loadStaticGoogleAuth();
  } else {
    currentUser = await apiGet('/api/me');
    renderAuth(currentUser);
  }

  // Show auth-only nav items (visible to any signed-in user)
  if (currentUser) {
    document.querySelectorAll('.nav-auth-only').forEach(el => el.classList.add('visible'));
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

  // Apply dynamic links from config
  await applyDynamicLinks();

  const calEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    locale: t('cal.locale'),
    timeZone: getUserTZ(),
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,multiMonthYear',
    },
    height: 'auto',
    firstDay: 1,
    nowIndicator: true,
    fixedWeekCount: false,
    dayMaxEvents: 3,
    eventDisplay: 'block',
    eventClick: openModal,
    datesSet() { setTimeout(refreshCellStyles, 50); },
    eventDidMount(info) {
      info.el.title = info.event.title;
      setTimeout(refreshCellStyles, 50);
    },
    eventContent(arg) {
      const ev = arg.event;
      const props = ev.extendedProps;
      const n = nightCount(ev.startStr, ev.endStr);
      return {
        html: `<div class="booking-pill">
          <span class="booking-pill-dot" style="background:${escHtml(props.color || ev.backgroundColor || '#888')}"></span>
          <span class="booking-pill-label">${escHtml(props.sourceName || ev.title)}</span>
          ${n ? `<span class="booking-pill-nights">${n}n</span>` : ''}
        </div>`
      };
    },
  });
  calendar.render();

  applyTranslations();
  initSettings();
  initPush();

  initSubscribeModal();

  await loadAll();
  setInterval(loadAll, 60 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);
