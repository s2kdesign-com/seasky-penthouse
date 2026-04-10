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
    'nav.feedConfig':        'ICS Feeds',
    'feedConfig.desc':       'Configure the iCal (ICS) feeds to sync bookings from external platforms.',
    'feedConfig.addFeed':    'Add Feed',
    'feedConfig.save':       'Save Feeds',
    'feedConfig.saving':     'Saving...',
    'feedConfig.saved':      'Feeds saved!',
    'feedConfig.error':      'Error saving feeds.',
    'feedConfig.syncNow':    'Sync Now',
    'feedConfig.syncing':    'Syncing...',
    'feedConfig.synced':     'Sync complete!',
    'feedConfig.syncError':  'Sync failed.',
    'feedConfig.id':         'Feed ID',
    'feedConfig.name':       'Display Name',
    'feedConfig.url':        'ICS Feed URL',
    'feedConfig.color':      'Color',
    'feedConfig.remove':     'Remove',
    'feedConfig.idPlaceholder':   'e.g. airbnb',
    'feedConfig.namePlaceholder': 'e.g. Airbnb',
    'feedConfig.urlPlaceholder':  'https://example.com/calendar.ics',
    'nav.cronJobs':           'Cron Jobs',
    'cronJobs.recentRuns':    'Recent Runs',
    'cronJobs.schedule':      'Schedule',
    'cronJobs.lastRun':       'Last Run',
    'cronJobs.nextRun':       'Next Run',
    'cronJobs.status':        'Status',
    'cronJobs.runNow':        'Run Now',
    'cronJobs.running':       'Running...',
    'cronJobs.success':       'Completed',
    'cronJobs.error':         'Failed',
    'cronJobs.never':         'Never',
    'cronJobs.noHistory':     'No recent runs.',
    'update.available':       'A new version is available.',
    'update.refresh':         'Refresh',
    'nav.reservations':       'Reservations',
    'reservations.noData':    'No reservations yet.',
    'reservations.checkIn':   'Check-in',
    'reservations.checkOut':  'Check-out',
    'reservations.guests':    'Guests',
    'reservations.contact':   'Contact',
    'reservations.comment':   'Comment',
    'reservations.status':    'Status',
    'reservations.date':      'Submitted',
    'reservations.pending':   'Pending',
    'reservations.confirmed': 'Confirmed',
    'reservations.declined':  'Declined',
    'reservations.sectionInquiries': 'Booking Inquiries',
    'reservations.sectionIcal':      'Calendar Feeds',
    'reservations.source':           'Source',
    'reservations.allReservations':  'All Reservations',
    'reservations.filterAll':        'All',
    'reservations.filterInquiries':  'Inquiries',
    'reservations.filterFeeds':      'Feeds',
    'reservations.now':              'Now',
    'reservations.reservation':      'reservation',
    'reservations.reservations':     'reservations',
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
    'inquiry.title':        'Book Your Stay',
    'inquiry.checkIn':      'Check-in',
    'inquiry.checkOut':     'Check-out',
    'inquiry.guests':       'Guests',
    'inquiry.name':         'Your Name',
    'inquiry.email':        'Email',
    'inquiry.phone':        'Phone Number',
    'inquiry.comment':      'Comments or special requests',
    'inquiry.submit':       'Send Inquiry',
    'inquiry.sending':      'Sending…',
    'inquiry.sent':         'Inquiry sent! We will contact you soon.',
    'inquiry.error':        'Error sending inquiry. Please try again.',
    'inquiry.orSignIn':     'Or sign in for faster booking',
    'inquiry.selectDates':  'Select dates on the calendar to make a booking inquiry',
    'account.phone':        'Phone Number',
    'account.phoneSave':    'Save',
    'account.phoneSaved':   'Saved!',
    'account.phoneDesc':    'Add your phone number for booking confirmations',
    'nav.exceptions':       'Exceptions',
    'exceptions.clear':     'Clear All',
    'exceptions.noErrors':  'No client errors recorded.',
    'exceptions.colTime':   'Time',
    'exceptions.colMessage':'Message',
    'exceptions.colSource': 'Source',
    'exceptions.colLine':   'Line',
    'exceptions.colUrl':    'Page',
    'exceptions.colUser':   'User',
    'exceptions.confirmClear': 'Clear all error logs?',
    'nav.changelog':        'Changelog',
    'changelog.noEntries':  'No changelog entries.',
    'changelog.version':    'Version',
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
    'nav.feedConfig':        'ICS Канали',
    'feedConfig.desc':       'Конфигурирайте iCal (ICS) каналите за синхронизиране на резервации от външни платформи.',
    'feedConfig.addFeed':    'Добави канал',
    'feedConfig.save':       'Запази каналите',
    'feedConfig.saving':     'Запазване...',
    'feedConfig.saved':      'Каналите са запазени!',
    'feedConfig.error':      'Грешка при запазване.',
    'feedConfig.syncNow':    'Синхронизирай',
    'feedConfig.syncing':    'Синхронизиране...',
    'feedConfig.synced':     'Синхронизацията завърши!',
    'feedConfig.syncError':  'Грешка при синхронизация.',
    'feedConfig.id':         'ID на канала',
    'feedConfig.name':       'Име за показване',
    'feedConfig.url':        'ICS URL адрес',
    'feedConfig.color':      'Цвят',
    'feedConfig.remove':     'Премахни',
    'feedConfig.idPlaceholder':   'напр. airbnb',
    'feedConfig.namePlaceholder': 'напр. Airbnb',
    'feedConfig.urlPlaceholder':  'https://example.com/calendar.ics',
    'nav.cronJobs':           'Планирани задачи',
    'cronJobs.recentRuns':    'Последни изпълнения',
    'cronJobs.schedule':      'Разписание',
    'cronJobs.lastRun':       'Последно изпълнение',
    'cronJobs.nextRun':       'Следващо изпълнение',
    'cronJobs.status':        'Статус',
    'cronJobs.runNow':        'Изпълни сега',
    'cronJobs.running':       'Изпълнява се...',
    'cronJobs.success':       'Завършено',
    'cronJobs.error':         'Грешка',
    'cronJobs.never':         'Никога',
    'cronJobs.noHistory':     'Няма скорошни изпълнения.',
    'update.available':       'Налична е нова версия.',
    'update.refresh':         'Обнови',
    'nav.reservations':       'Резервации',
    'reservations.noData':    'Няма резервации.',
    'reservations.checkIn':   'Настаняване',
    'reservations.checkOut':  'Напускане',
    'reservations.guests':    'Гости',
    'reservations.contact':   'Контакт',
    'reservations.comment':   'Коментар',
    'reservations.status':    'Статус',
    'reservations.date':      'Изпратено',
    'reservations.pending':   'Изчакване',
    'reservations.confirmed': 'Потвърдено',
    'reservations.declined':  'Отказано',
    'reservations.sectionInquiries': 'Запитвания за резервации',
    'reservations.sectionIcal':      'Календарни емисии',
    'reservations.source':           'Източник',
    'reservations.allReservations':  'Всички резервации',
    'reservations.filterAll':        'Всички',
    'reservations.filterInquiries':  'Запитвания',
    'reservations.filterFeeds':      'Емисии',
    'reservations.now':              'Сега',
    'reservations.reservation':      'резервация',
    'reservations.reservations':     'резервации',
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
    'inquiry.title':        'Резервирайте престоя си',
    'inquiry.checkIn':      'Настаняване',
    'inquiry.checkOut':     'Напускане',
    'inquiry.guests':       'Гости',
    'inquiry.name':         'Вашето име',
    'inquiry.email':        'Имейл',
    'inquiry.phone':        'Телефонен номер',
    'inquiry.comment':      'Коментари или специални заявки',
    'inquiry.submit':       'Изпрати запитване',
    'inquiry.sending':      'Изпращане…',
    'inquiry.sent':         'Запитването е изпратено! Ще се свържем с вас скоро.',
    'inquiry.error':        'Грешка при изпращане. Моля, опитайте отново.',
    'inquiry.orSignIn':     'Или влезте за по-бързо резервиране',
    'inquiry.selectDates':  'Изберете дати от календара за запитване за резервация',
    'account.phone':        'Телефонен номер',
    'account.phoneSave':    'Запази',
    'account.phoneSaved':   'Запазено!',
    'account.phoneDesc':    'Добавете телефонен номер за потвърждение на резервации',
    'nav.exceptions':       'Изключения',
    'exceptions.clear':     'Изчисти всички',
    'exceptions.noErrors':  'Няма записани грешки.',
    'exceptions.colTime':   'Час',
    'exceptions.colMessage':'Съобщение',
    'exceptions.colSource': 'Източник',
    'exceptions.colLine':   'Ред',
    'exceptions.colUrl':    'Страница',
    'exceptions.colUser':   'Потребител',
    'exceptions.confirmClear': 'Изчистване на всички грешки?',
    'nav.changelog':        'Промени',
    'changelog.noEntries':  'Няма записи за промени.',
    'changelog.version':    'Версия',
  },
};

let currentLang = localStorage.getItem('lang') || 'en';
let userTimezone = localStorage.getItem('timezone') || '';  // '' = auto (browser default)
let _pendingCheckIn = null;

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

function setLang(lang, { updateUrl = true } = {}) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
  updateNavHrefs();
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
  // Update URL to reflect new language
  if (updateUrl && !IS_STATIC) {
    const { page } = parseRoute(location.pathname);
    const currentPage = page || 'dashboard';
    history.pushState({ lang, page: currentPage }, '', pageToUrl(lang, currentPage));
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

// ─── Router ──────────────────────────────────────────────────────────────────

const VALID_LANGS = ['en', 'bg'];
const VALID_PAGES = ['dashboard','users','reservations','logs','link-config','feed-config','cron-jobs','exceptions','changelog','subscribe','links','account','settings'];

function parseRoute(pathname) {
  const path = pathname.replace(/\/$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  let lang = null, page = null;
  if (parts.length >= 1 && VALID_LANGS.includes(parts[0])) lang = parts[0];
  if (parts.length >= 2 && VALID_PAGES.includes(parts[1])) page = parts[1];
  // /{lang} with no page means dashboard
  if (lang && !page && parts.length <= 1) page = 'dashboard';
  return { lang, page };
}

function pageToUrl(lang, page) {
  return page === 'dashboard' ? `/${lang}` : `/${lang}/${page}`;
}

function updateNavHrefs() {
  document.querySelectorAll('.nav-item').forEach(a => {
    a.href = pageToUrl(currentLang, a.dataset.page);
  });
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function navigateTo(page, { pushState = true, langOverride = null } = {}) {
  const lang = langOverride || currentLang;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  if (!IS_STATIC && pushState) {
    history.pushState({ lang, page }, '', pageToUrl(lang, page));
  }

  if (lang !== currentLang) {
    setLang(lang, { updateUrl: false });
  }

  if (page === 'users')       loadUsersPage();
  if (page === 'logs')        loadLogsPage();
  if (page === 'subscribe')   loadSubscribePage();
  if (page === 'link-config') loadLinkConfigPage();
  if (page === 'feed-config') loadFeedConfigPage();
  if (page === 'cron-jobs')  loadCronJobsPage();
  if (page === 'exceptions') loadExceptionsPage();
  if (page === 'changelog') loadChangelogPage();
  if (page === 'reservations') loadReservationsPage();
  if (page === 'account')     loadAccountPage();
  if (page === 'settings')    { initTimezone(); initPush(); }
}

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.page) {
    navigateTo(e.state.page, { pushState: false, langOverride: e.state.lang });
  } else {
    const { lang, page } = parseRoute(location.pathname);
    navigateTo(page || 'dashboard', { pushState: false, langOverride: lang || currentLang });
  }
});

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

// ─── Inquiry modal (date selection) ──────────────────────────────────────────

function openInquiryModal(startStr, endStr) {
  const nights = nightCount(startStr, endStr);
  const isLoggedIn = !!currentUser;
  // Format dates for input[type=date] (YYYY-MM-DD)
  const startDate = startStr.slice(0, 10);
  const endDate = endStr.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const googleBtnSvg = `<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

  document.getElementById('modal-body').innerHTML = `
    <div class="inquiry-modal">
      <h2 class="inquiry-title">${t('inquiry.title')}</h2>
      <div class="inquiry-dates">
        <div class="inquiry-date-box">
          <span class="inquiry-date-label">${t('inquiry.checkIn')}</span>
          <input type="date" id="inquiry-check-in" class="inquiry-date-input" value="${startDate}" min="${today}" />
        </div>
        <span class="inquiry-arrow">→</span>
        <div class="inquiry-date-box">
          <span class="inquiry-date-label">${t('inquiry.checkOut')}</span>
          <input type="date" id="inquiry-check-out" class="inquiry-date-input" value="${endDate}" min="${startDate}" />
        </div>
        <div class="inquiry-nights" id="inquiry-nights">${nights || 0} ${t('modal.nights')}</div>
      </div>
      <form id="inquiry-form" class="inquiry-form">
        <input type="hidden" name="check_in" value="${startDate}" />
        <input type="hidden" name="check_out" value="${endDate}" />
        <div class="inquiry-field">
          <label>${t('inquiry.guests')}</label>
          <select name="guests">
            ${[1,2,3,4,5,6].map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        ${!isLoggedIn ? `
          <div class="inquiry-field">
            <label>${t('inquiry.name')}</label>
            <input type="text" name="name" required placeholder="${t('inquiry.name')}" />
          </div>
          <div class="inquiry-field">
            <label>${t('inquiry.email')}</label>
            <input type="email" name="email" required placeholder="${t('inquiry.email')}" />
          </div>
        ` : `
          <input type="hidden" name="name" value="${escHtml(currentUser.name)}" />
          <input type="hidden" name="email" value="${escHtml(currentUser.email)}" />
        `}
        <div class="inquiry-field">
          <label>${t('inquiry.phone')}</label>
          <input type="tel" name="phone" placeholder="${t('inquiry.phone')}" ${isLoggedIn && currentUser.phone ? `value="${escHtml(currentUser.phone)}"` : ''} />
        </div>
        <div class="inquiry-field">
          <label>${t('inquiry.comment')}</label>
          <textarea name="comment" rows="3" placeholder="${t('inquiry.comment')}"></textarea>
        </div>
        <button type="submit" class="btn-inquiry-submit">${t('inquiry.submit')}</button>
        <span id="inquiry-status" class="inquiry-status"></span>
      </form>
      ${!isLoggedIn ? `
        <div class="inquiry-divider">
          <span>${t('inquiry.orSignIn')}</span>
        </div>
        <a href="/auth/google" class="btn-google-login inquiry-google-btn">
          ${googleBtnSvg} ${t('auth.signIn')}
        </a>
      ` : ''}
    </div>
  `;

  // Handle form submit
  document.getElementById('inquiry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const statusEl = document.getElementById('inquiry-status');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    statusEl.textContent = t('inquiry.sending');
    statusEl.className = 'inquiry-status';

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in: fd.get('check_in'),
          check_out: fd.get('check_out'),
          guests: parseInt(fd.get('guests')),
          name: fd.get('name'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          comment: fd.get('comment'),
        }),
      });
      if (res.ok) {
        statusEl.textContent = t('inquiry.sent');
        statusEl.classList.add('ok');
        btn.disabled = true;
      } else {
        throw new Error('Failed');
      }
    } catch {
      statusEl.textContent = t('inquiry.error');
      statusEl.classList.add('err');
      btn.disabled = false;
    }
  });

  // Date editing — update nights and hidden fields when dates change
  const ciInput = document.getElementById('inquiry-check-in');
  const coInput = document.getElementById('inquiry-check-out');
  const nightsEl = document.getElementById('inquiry-nights');
  function updateInquiryDates() {
    const ci = ciInput.value;
    const co = coInput.value;
    // Ensure check-out is after check-in
    coInput.min = ci;
    if (co <= ci) {
      const next = new Date(ci);
      next.setDate(next.getDate() + 1);
      coInput.value = next.toISOString().slice(0, 10);
    }
    const n = nightCount(ciInput.value, coInput.value);
    nightsEl.textContent = `${n || 0} ${t('modal.nights')}`;
    // Update hidden form fields
    document.querySelector('#inquiry-form input[name="check_in"]').value = ciInput.value;
    document.querySelector('#inquiry-form input[name="check_out"]').value = coInput.value;
  }
  ciInput.addEventListener('change', updateInquiryDates);
  coInput.addEventListener('change', updateInquiryDates);

  document.getElementById('modal').classList.remove('hidden');
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
  _pendingCheckIn = null;
  document.querySelectorAll('.fc-day-pending-checkin').forEach(el => el.classList.remove('fc-day-pending-checkin'));
});
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.add('hidden');
    _pendingCheckIn = null;
    document.querySelectorAll('.fc-day-pending-checkin').forEach(el => el.classList.remove('fc-day-pending-checkin'));
  }
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

// ─── Cron Jobs page (admin) ─────────────────────────────────────────────────

function cronNextRun(schedule) {
  // Parse simple cron "0 * * * *" → next top-of-hour
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next.toISOString();
}

async function loadCronJobsPage() {
  if (!currentUser || currentUser.role !== 'admin') return;
  const listEl = document.getElementById('cron-jobs-list');
  const histEl = document.getElementById('cron-jobs-history');

  listEl.innerHTML = '<p style="color:var(--text-muted)">Loading...</p>';
  histEl.innerHTML = '';

  let data;
  try {
    const res = await fetch('/api/admin/cron-jobs');
    if (!res.ok) throw new Error('Failed to load');
    data = await res.json();
  } catch (e) {
    listEl.innerHTML = `<p style="color:var(--danger)">${escHtml(e.message)}</p>`;
    return;
  }

  // Render job cards
  listEl.innerHTML = data.jobs.map(job => `
    <div class="settings-card cron-job-card">
      <div class="cron-job-header">
        <div>
          <h3 class="cron-job-name">${escHtml(job.name)}</h3>
          <p class="cron-job-desc">${escHtml(job.description)}</p>
        </div>
        <button class="btn-sync cron-run-btn" data-job-id="${escHtml(job.id)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>${t('cronJobs.runNow')}</span>
        </button>
      </div>
      <div class="cron-job-meta">
        <div class="cron-meta-item">
          <span class="cron-meta-label">${t('cronJobs.schedule')}</span>
          <span class="cron-meta-value"><code>${escHtml(job.schedule)}</code> (${t('cronJobs.schedule') === 'Разписание' ? 'всеки час' : 'every hour'})</span>
        </div>
        <div class="cron-meta-item">
          <span class="cron-meta-label">${t('cronJobs.lastRun')}</span>
          <span class="cron-meta-value">${job.lastRun ? fmtDate(job.lastRun) : t('cronJobs.never')}</span>
        </div>
        <div class="cron-meta-item">
          <span class="cron-meta-label">${t('cronJobs.nextRun')}</span>
          <span class="cron-meta-value">${fmtDate(cronNextRun(job.schedule))}</span>
        </div>
      </div>
      ${job.feedStatus ? `
        <div class="cron-feed-status">
          ${job.feedStatus.map(f => `
            <span class="cron-feed-pill ${f.status === 'ok' ? 'cron-feed-ok' : f.status === 'error' ? 'cron-feed-error' : ''}"">
              ${escHtml(f.name)}: ${f.status === 'ok' ? '✓' : f.status === 'error' ? '✗' : '…'}
            </span>
          `).join('')}
        </div>
      ` : ''}
      <span class="cron-job-status" id="cron-status-${escHtml(job.id)}"></span>
    </div>
  `).join('');

  // Render history
  if (data.history && data.history.length > 0) {
    histEl.innerHTML = `<div class="settings-card"><table class="cron-history-table">
      <thead><tr>
        <th>${t('cronJobs.status')}</th>
        <th>Details</th>
        <th>Time</th>
      </tr></thead>
      <tbody>${data.history.map(h => `
        <tr>
          <td><span class="cron-status-badge cron-status-${h.status}">${h.status === 'success' ? '✓' : '✗'} ${h.status}</span></td>
          <td>${escHtml(h.details || '')}</td>
          <td>${fmtDate(h.run_at || h.runAt)}</td>
        </tr>
      `).join('')}</tbody>
    </table></div>`;
  } else {
    histEl.innerHTML = `<p style="color:var(--text-muted)">${t('cronJobs.noHistory')}</p>`;
  }

  // Wire up run buttons
  listEl.querySelectorAll('.cron-run-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const jobId = btn.dataset.jobId;
      const statusEl = document.getElementById(`cron-status-${jobId}`);
      btn.disabled = true;
      statusEl.textContent = t('cronJobs.running');
      statusEl.className = 'cron-job-status';
      try {
        const res = await fetch(`/api/admin/cron-jobs/${jobId}/run`, { method: 'POST' });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed');
        statusEl.textContent = `${t('cronJobs.success')} (${result.totalEvents} events)`;
        statusEl.className = 'cron-job-status cron-status-ok';
        setTimeout(() => loadCronJobsPage(), 2000);
      } catch (e) {
        statusEl.textContent = `${t('cronJobs.error')}: ${e.message}`;
        statusEl.className = 'cron-job-status cron-status-err';
      }
      btn.disabled = false;
    });
  });
}

// ─── Exceptions page (admin) ────────────────────────────────────────────────

async function loadExceptionsPage() {
  const container = document.getElementById('exceptions-content');
  container.innerHTML = `<p class="loading-text">${t('status.loading')}</p>`;

  const errors = await apiGet('/api/admin/errors');
  if (!errors || errors.length === 0) {
    container.innerHTML = `<p class="loading-text">${t('exceptions.noErrors')}</p>`;
  } else {
    let html = `<div class="card" style="overflow-x:auto"><table class="data-table"><thead><tr>
      <th>${t('exceptions.colTime')}</th>
      <th>${t('exceptions.colMessage')}</th>
      <th>${t('exceptions.colSource')}</th>
      <th>${t('exceptions.colLine')}</th>
      <th>${t('exceptions.colUrl')}</th>
    </tr></thead><tbody>`;
    for (const err of errors) {
      const time = err.created_at ? new Date(err.created_at + 'Z').toLocaleString() : '—';
      const msg = escHtml(err.message || '');
      const stack = err.stack ? `<details><summary>Stack</summary><pre style="white-space:pre-wrap;font-size:11px;max-height:200px;overflow:auto">${escHtml(err.stack)}</pre></details>` : '';
      const src = escHtml(err.source || '—');
      const line = err.lineno ? `${err.lineno}:${err.colno || 0}` : '—';
      const pageUrl = escHtml(err.url || '—');
      html += `<tr>
        <td style="white-space:nowrap">${time}</td>
        <td style="max-width:400px"><code style="word-break:break-all">${msg}</code>${stack}</td>
        <td style="max-width:200px;word-break:break-all;font-size:12px">${src}</td>
        <td>${line}</td>
        <td style="max-width:200px;word-break:break-all;font-size:12px">${pageUrl}</td>
      </tr>`;
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  // Clear button
  document.getElementById('exceptions-clear').onclick = async () => {
    if (!confirm(t('exceptions.confirmClear'))) return;
    await fetch('/api/admin/errors', { method: 'DELETE' });
    loadExceptionsPage();
  };
  document.getElementById('exceptions-refresh').onclick = () => loadExceptionsPage();
}

// ─── Changelog page (public) ────────────────────────────────────────────────

async function loadChangelogPage() {
  const container = document.getElementById('changelog-content');
  container.innerHTML = `<p class="loading-text">${t('status.loading')}</p>`;

  const data = await apiGet('/api/changelog');
  if (!data || data.length === 0) {
    container.innerHTML = `<p class="loading-text">${t('changelog.noEntries')}</p>`;
    return;
  }

  let html = '<div class="changelog-list">';
  for (const entry of data) {
    html += `<div class="changelog-entry">
      <div class="changelog-header">
        <span class="changelog-version">${escHtml(entry.version)}</span>
        <span class="changelog-date">${escHtml(entry.date)}</span>
      </div>
      <ul class="changelog-changes">`;
    for (const change of (entry.changes || [])) {
      html += `<li>${escHtml(change)}</li>`;
    }
    html += '</ul></div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

// ─── Reservations page (admin) ──────────────────────────────────────────────

async function loadReservationsPage() {
  const container = document.getElementById('reservations-content');
  container.innerHTML = `<p class="loading-text">${t('status.loading')}</p>`;
  const isAdmin = currentUser?.role === 'admin';

  // Fetch events (public) and inquiries (admin only) in parallel
  const fetches = [apiGet('/api/events')];
  if (isAdmin) fetches.push(fetch('/api/admin/inquiries').then(r => r.ok ? r.json() : []));
  const [eventsRes, inquiries = []] = await Promise.all(fetches);
  const events = eventsRes || [];

  // Build unified list
  const unified = [];
  for (const inq of inquiries) {
    unified.push({ type: 'inquiry', sortDate: inq.check_in, data: inq });
  }
  for (const ev of events) {
    unified.push({ type: 'ical', sortDate: ev.start || ev.rawStart, data: ev });
  }
  unified.sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));

  if (!unified.length) {
    container.innerHTML = `<p class="loading-text">${t('reservations.noData')}</p>`;
    return;
  }

  // Group by month
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthGroups = new Map();
  for (const item of unified) {
    const d = new Date(item.sortDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthGroups.has(key)) monthGroups.set(key, []);
    monthGroups.get(key).push(item);
  }

  // Order: current month first, then future ascending, then past descending
  const allKeys = [...monthGroups.keys()];
  const futureKeys = allKeys.filter(k => k >= currentMonthKey).sort();
  const pastKeys = allKeys.filter(k => k < currentMonthKey).sort().reverse();
  const orderedKeys = [...futureKeys, ...pastKeys];

  const fmtMonthLabel = (key) => {
    const [y, m] = key.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, 1)
      .toLocaleDateString(currentLang === 'bg' ? 'bg-BG' : 'en-US', { month: 'long', year: 'numeric' });
  };
  const monthRelation = (key) => key === currentMonthKey ? 'current' : key > currentMonthKey ? 'future' : 'past';

  // Filter pills
  const filterBar = `
    <div class="reservation-filters">
      <button class="reservation-filter active" data-filter="all">${t('reservations.filterAll')} (${unified.length})</button>
      <button class="reservation-filter" data-filter="inquiry">${t('reservations.filterInquiries')} (${inquiries.length})</button>
      <button class="reservation-filter" data-filter="ical">${t('reservations.filterFeeds')} (${events.length})</button>
    </div>
  `;

  // Render card
  const renderCard = (item) => {
    if (item.type === 'inquiry') {
      const inq = item.data;
      const nights = nightCount(inq.check_in, inq.check_out);
      const statusCls = inq.status === 'confirmed' ? 'status-confirmed' : inq.status === 'declined' ? 'status-declined' : 'status-pending';
      return `
        <div class="tl-item" data-type="inquiry">
          <div class="tl-dot tl-dot-inquiry"></div>
          <div class="reservation-card ${statusCls}" data-id="${inq.id}" data-type="inquiry">
            <div class="reservation-header">
              <div class="reservation-dates">
                <span class="reservation-day">${new Date(inq.check_in).getDate()}</span>
                <span class="reservation-date">${fmtDateShort(inq.check_in)}</span>
                <span class="reservation-arrow">&rarr;</span>
                <span class="reservation-date">${fmtDateShort(inq.check_out)}</span>
                ${nights ? `<span class="reservation-nights">${nights}n</span>` : ''}
              </div>
              <div class="reservation-badges">
                <span class="reservation-source-badge source-inquiry">${t('reservations.filterInquiries')}</span>
                ${isAdmin ? `<select class="reservation-status-select" data-id="${inq.id}">
                  <option value="pending" ${inq.status === 'pending' ? 'selected' : ''}>${t('reservations.pending')}</option>
                  <option value="confirmed" ${inq.status === 'confirmed' ? 'selected' : ''}>${t('reservations.confirmed')}</option>
                  <option value="declined" ${inq.status === 'declined' ? 'selected' : ''}>${t('reservations.declined')}</option>
                </select>` : `<span class="reservation-status-badge status-${inq.status}">${t('reservations.' + inq.status)}</span>`}
              </div>
            </div>
            <div class="reservation-details">
              <div class="reservation-detail"><strong>${t('reservations.guests')}:</strong> ${inq.guests}</div>
              <div class="reservation-detail"><strong>${t('reservations.contact')}:</strong> ${escHtml(inq.name || '—')} &middot; ${escHtml(inq.email)}${inq.phone ? ` &middot; ${escHtml(inq.phone)}` : ''}</div>
              ${inq.comment ? `<div class="reservation-detail"><strong>${t('reservations.comment')}:</strong> ${escHtml(inq.comment)}</div>` : ''}
              <div class="reservation-detail reservation-meta">${t('reservations.date')}: ${fmtDate(inq.created_at)}</div>
            </div>
          </div>
        </div>`;
    } else {
      const ev = item.data;
      const startDate = ev.start || ev.rawStart;
      const endDate = ev.end || ev.rawEnd;
      const nights = nightCount(startDate, endDate);
      const sourceColor = ev.color || 'var(--text-muted)';
      return `
        <div class="tl-item" data-type="ical">
          <div class="tl-dot" style="background:${sourceColor}"></div>
          <div class="reservation-card status-ical" data-type="ical" style="border-left-color:${sourceColor}">
            <div class="reservation-header">
              <div class="reservation-dates">
                <span class="reservation-day">${new Date(startDate).getDate()}</span>
                <span class="reservation-date">${fmtDateShort(startDate)}</span>
                <span class="reservation-arrow">&rarr;</span>
                <span class="reservation-date">${fmtDateShort(endDate)}</span>
                ${nights ? `<span class="reservation-nights">${nights}n</span>` : ''}
              </div>
              <div class="reservation-badges">
                <span class="reservation-source-badge" style="background:${sourceColor};color:#000">${escHtml(ev.sourceName || ev.source)}</span>
              </div>
            </div>
            <div class="reservation-details">
              <div class="reservation-detail"><strong>${escHtml(ev.title)}</strong></div>
              ${ev.description ? `<div class="reservation-detail">${escHtml(ev.description).substring(0, 200)}</div>` : ''}
            </div>
          </div>
        </div>`;
    }
  };

  // Render timeline grouped by month
  const timelineHTML = orderedKeys.map(key => {
    const items = monthGroups.get(key);
    const rel = monthRelation(key);
    const countInq = items.filter(i => i.type === 'inquiry').length;
    const countFeed = items.filter(i => i.type === 'ical').length;
    const isCollapsed = rel === 'past';
    return `
      <div class="tl-month ${rel === 'current' ? 'tl-month-current' : ''} ${rel === 'past' ? 'tl-month-past' : ''}" data-month="${key}">
        <div class="tl-month-header" ${isCollapsed ? 'data-collapsed="true"' : ''}>
          <div class="tl-month-label">
            <span class="tl-month-name">${fmtMonthLabel(key)}</span>
            ${rel === 'current' ? `<span class="tl-month-now">${t('reservations.now')}</span>` : ''}
          </div>
          <div class="tl-month-meta">
            <span class="tl-month-count">${items.length} ${items.length === 1 ? t('reservations.reservation') : t('reservations.reservations')}</span>
            ${countInq ? `<span class="tl-meta-pill tl-meta-inquiry">${countInq} ${t('reservations.filterInquiries').toLowerCase()}</span>` : ''}
            ${countFeed ? `<span class="tl-meta-pill tl-meta-feed">${countFeed} ${t('reservations.filterFeeds').toLowerCase()}</span>` : ''}
            <span class="tl-collapse-icon">${isCollapsed ? '&#9654;' : '&#9660;'}</span>
          </div>
        </div>
        <div class="tl-month-body" ${isCollapsed ? 'style="display:none"' : ''}>
          ${items.map(renderCard).join('')}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = filterBar + `<div class="reservations-timeline">${timelineHTML}</div>`;

  // Collapse / expand month sections
  container.querySelectorAll('.tl-month-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('.reservation-status-select')) return;
      const body = header.nextElementSibling;
      const icon = header.querySelector('.tl-collapse-icon');
      const collapsed = body.style.display === 'none';
      body.style.display = collapsed ? '' : 'none';
      icon.innerHTML = collapsed ? '&#9660;' : '&#9654;';
      header.dataset.collapsed = collapsed ? '' : 'true';
    });
  });

  // Filter tab click handlers
  container.querySelectorAll('.reservation-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.reservation-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      container.querySelectorAll('.tl-item').forEach(item => {
        item.style.display = (filter === 'all' || item.dataset.type === filter) ? '' : 'none';
      });
      container.querySelectorAll('.tl-month').forEach(month => {
        const visible = month.querySelectorAll(`.tl-item${filter === 'all' ? '' : `[data-type="${filter}"]`}`);
        month.style.display = visible.length ? '' : 'none';
      });
    });
  });

  // Handle inquiry status change
  container.querySelectorAll('.reservation-status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      e.stopPropagation();
      const id = sel.dataset.id;
      const status = sel.value;
      const card = sel.closest('.reservation-card');
      try {
        const res = await fetch(`/api/admin/inquiries/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          card.className = `reservation-card status-${status}`;
          card.dataset.type = 'inquiry';
        }
      } catch (e) {
        console.error('Failed to update status', e);
      }
    });
  });
}

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

// ─── Feed Config (admin) ─────────────────────────────────────────────────────

function createFeedRow(feed = {}) {
  const row = document.createElement('div');
  row.className = 'feed-config-row settings-card';
  row.innerHTML = `
    <div class="feed-row-fields">
      <div class="feed-field">
        <label class="settings-label-title">${t('feedConfig.id')}</label>
        <input type="text" class="config-input feed-id" value="${feed.id || ''}" placeholder="${t('feedConfig.idPlaceholder')}" />
      </div>
      <div class="feed-field">
        <label class="settings-label-title">${t('feedConfig.name')}</label>
        <input type="text" class="config-input feed-name" value="${feed.name || ''}" placeholder="${t('feedConfig.namePlaceholder')}" />
      </div>
      <div class="feed-field feed-field-url">
        <label class="settings-label-title">${t('feedConfig.url')}</label>
        <input type="url" class="config-input feed-url" value="${feed.url || ''}" placeholder="${t('feedConfig.urlPlaceholder')}" />
      </div>
      <div class="feed-field feed-field-color">
        <label class="settings-label-title">${t('feedConfig.color')}</label>
        <input type="color" class="feed-color-input" value="${feed.color || '#2C7BE5'}" />
      </div>
      <div class="feed-field feed-field-remove">
        <button type="button" class="btn-feed-remove" title="${t('feedConfig.remove')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
  `;
  row.querySelector('.btn-feed-remove').addEventListener('click', () => row.remove());
  return row;
}

async function loadFeedConfigPage() {
  if (!currentUser || currentUser.role !== 'admin') return;

  const listEl = document.getElementById('feed-config-list');
  const statusEl = document.getElementById('feed-config-status');
  listEl.innerHTML = '';

  // Load current feeds
  try {
    const res = await fetch('/api/admin/feeds');
    if (res.ok) {
      const feeds = await res.json();
      for (const feed of feeds) {
        listEl.appendChild(createFeedRow(feed));
      }
    }
  } catch (e) { console.error('Failed to load feeds', e); }

  // Add Feed button
  const addBtn = document.getElementById('feed-add-btn');
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener('click', () => {
    listEl.appendChild(createFeedRow());
  });

  // Save button
  const saveBtn = document.getElementById('feed-config-save');
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

  newSaveBtn.addEventListener('click', async () => {
    newSaveBtn.disabled = true;
    statusEl.textContent = t('feedConfig.saving');
    statusEl.className = 'link-config-status';
    try {
      const rows = listEl.querySelectorAll('.feed-config-row');
      const feeds = [];
      for (const row of rows) {
        const id = row.querySelector('.feed-id').value.trim();
        const name = row.querySelector('.feed-name').value.trim();
        const url = row.querySelector('.feed-url').value.trim();
        const color = row.querySelector('.feed-color-input').value;
        if (id && name && url) feeds.push({ id, name, url, color });
      }
      const res = await fetch('/api/admin/feeds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeds }),
      });
      if (!res.ok) throw new Error('Save failed');
      statusEl.textContent = t('feedConfig.saved');
      statusEl.className = 'link-config-status link-config-success';
    } catch (e) {
      statusEl.textContent = t('feedConfig.error');
      statusEl.className = 'link-config-status link-config-error';
    }
    newSaveBtn.disabled = false;
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  });

  // Sync Now button
  const syncBtn = document.getElementById('feed-sync-btn');
  const newSyncBtn = syncBtn.cloneNode(true);
  syncBtn.parentNode.replaceChild(newSyncBtn, syncBtn);

  newSyncBtn.addEventListener('click', async () => {
    newSyncBtn.disabled = true;
    statusEl.textContent = t('feedConfig.syncing');
    statusEl.className = 'link-config-status';
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      statusEl.textContent = t('feedConfig.synced') + ` (${data.totalEvents} events)`;
      statusEl.className = 'link-config-status link-config-success';
    } catch (e) {
      statusEl.textContent = t('feedConfig.syncError');
      statusEl.className = 'link-config-status link-config-error';
    }
    newSyncBtn.disabled = false;
    setTimeout(() => { statusEl.textContent = ''; }, 5000);
  });
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
    const phoneCardEarly = document.getElementById('account-phone-card');
    if (phoneCardEarly) phoneCardEarly.style.display = 'none';
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

  // Phone number (only for logged-in users)
  const phoneCard = document.getElementById('account-phone-card');
  const phoneRow = document.getElementById('account-phone-row');
  if (currentUser) {
    phoneCard.style.display = '';
    phoneRow.innerHTML = `
      <div class="account-phone-input-row">
        <input type="tel" id="account-phone-input" class="config-input" value="${escHtml(currentUser.phone || '')}" placeholder="${t('inquiry.phone')}" />
        <button class="btn-save" id="save-phone-btn">${t('account.phoneSave')}</button>
        <span id="phone-save-status" class="edit-status"></span>
      </div>
    `;
    document.getElementById('save-phone-btn').addEventListener('click', async () => {
      const phone = document.getElementById('account-phone-input').value;
      const statusEl = document.getElementById('phone-save-status');
      statusEl.textContent = t('modal.saving');
      statusEl.className = 'edit-status';
      try {
        const res = await fetch('/api/me/phone', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        if (res.ok) {
          currentUser.phone = phone;
          statusEl.textContent = t('account.phoneSaved');
          statusEl.classList.add('ok');
        } else throw new Error();
      } catch {
        statusEl.textContent = t('modal.saveError');
        statusEl.classList.add('err');
      }
    });
  } else {
    phoneCard.style.display = 'none';
  }
}

// ─── Push notifications ───────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const pad = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ─── Timezone selector ───────────────────────────────────────────────────────

async function initTimezone() {
  const select = document.getElementById('tz-select');
  const currentEl = document.getElementById('tz-current');
  if (!select) return;

  // Fetch pre-computed timezone list from server
  const url = IS_STATIC ? 'data/timezones.json' : '/api/timezones';
  let zones = [];
  try {
    const res = await fetch(url);
    zones = await res.json();
  } catch (e) {
    console.warn('Failed to load timezones, using browser default');
  }

  // Build options
  select.innerHTML = '';
  const autoOpt = document.createElement('option');
  autoOpt.value = '';
  autoOpt.textContent = `${t('settings.tzAuto')} — ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  select.appendChild(autoOpt);

  for (const z of zones) {
    const opt = document.createElement('option');
    opt.value = z.tz;
    opt.textContent = z.label;
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
      '/api/changelog': './CHANGELOG.json',
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
  // ── Route from URL ────────────────────────────────────────────────────────
  let startPage = 'dashboard';
  if (!IS_STATIC) {
    const { lang, page } = parseRoute(location.pathname);
    if (!lang && !page) {
      const savedLang = localStorage.getItem('lang') || 'en';
      currentLang = savedLang;
      history.replaceState({ lang: savedLang, page: 'dashboard' }, '', `/${savedLang}`);
    } else {
      if (lang) { currentLang = lang; localStorage.setItem('lang', lang); }
      startPage = page || 'dashboard';
      const resolvedLang = lang || currentLang;
      history.replaceState({ lang: resolvedLang, page: startPage }, '', pageToUrl(resolvedLang, startPage));
    }
  }

  await loadWasm();

  if (IS_STATIC) {
    await loadStaticGoogleAuth();
  } else {
    currentUser = await apiGet('/api/me');
    renderAuth(currentUser);
  }

  // Show auth-only elements (visible to any signed-in user)
  if (currentUser) {
    document.querySelectorAll('.nav-auth-only').forEach(el => el.classList.add('visible'));
    document.querySelectorAll('.auth-only').forEach(el => el.classList.add('visible'));
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
    selectable: true,
    selectAllow(selectInfo) {
      return selectInfo.start >= new Date(new Date().setHours(0,0,0,0));
    },
    selectMirror: true,
    select(info) {
      openInquiryModal(info.startStr, info.endStr);
      calendar.unselect();
    },
    dateClick(info) {
      // Only for future dates
      if (info.date < new Date(new Date().setHours(0,0,0,0))) return;
      if (!_pendingCheckIn) {
        // First click = check-in date
        _pendingCheckIn = info.dateStr;
        // Highlight the selected day
        info.dayEl.classList.add('fc-day-pending-checkin');
      } else {
        // Second click = check-out date
        const start = _pendingCheckIn;
        const end = info.dateStr;
        // Clear pending state
        document.querySelectorAll('.fc-day-pending-checkin').forEach(el => el.classList.remove('fc-day-pending-checkin'));
        _pendingCheckIn = null;
        // Ensure start < end, swap if needed
        if (start < end) {
          openInquiryModal(start, end);
        } else if (end < start) {
          openInquiryModal(end, start);
        } else {
          // Same day = 1 night
          const next = new Date(start);
          next.setDate(next.getDate() + 1);
          openInquiryModal(start, next.toISOString().slice(0, 10));
        }
      }
    },
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
  updateNavHrefs();
  initSettings();
  initPush();

  initSubscribeModal();

  // Navigate to the page from URL (or default dashboard)
  navigateTo(startPage, { pushState: false });

  await loadAll();
  setInterval(loadAll, 60 * 60 * 1000);

  // ── Version check (detect new deployments) ──────────────────────────────
  if (!IS_STATIC) {
    try {
      const vRes = await fetch('/api/version');
      if (vRes.ok) {
        const { version } = await vRes.json();
        window.__appVersion = version;
        setInterval(async () => {
          try {
            const r = await fetch('/api/version');
            if (!r.ok) return;
            const { version: latest } = await r.json();
            if (latest !== window.__appVersion && !document.getElementById('update-banner')) {
              const banner = document.createElement('div');
              banner.id = 'update-banner';
              banner.innerHTML = `<span>${t('update.available')}</span><button onclick="location.reload()">${t('update.refresh')}</button><button class="update-dismiss" onclick="this.parentNode.remove()">✕</button>`;
              document.body.appendChild(banner);
            }
          } catch (_) {}
        }, 5 * 60 * 1000); // check every 5 minutes
      }
    } catch (_) {}
  }
}

// ─── Global error logging ────────────────────────────────────────────────────
if (!IS_STATIC) {
  window.addEventListener('error', (e) => {
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: e.message || String(e),
          source: e.filename || null,
          lineno: e.lineno || null,
          colno: e.colno || null,
          stack: e.error?.stack || null,
          url: location.href,
        }),
      }).catch(() => {});
    } catch (_) {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    try {
      const msg = e.reason?.message || String(e.reason);
      const stack = e.reason?.stack || null;
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Unhandled rejection: ${msg}`, stack, url: location.href }),
      }).catch(() => {});
    } catch (_) {}
  });
}

document.addEventListener('DOMContentLoaded', init);
