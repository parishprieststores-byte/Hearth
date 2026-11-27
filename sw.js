// Hearth service worker, adapted from Canon's.
// - App shell (index.html, manifest, icons): network-first with a 6 s timeout and the saved copy as fallback.
//   If a newer shell finishes downloading after the saved copy was served, every open window is told.
// - Pinned vendor files (Firebase 10.12.2, Google Fonts): cache-first.
// - Everything else (Firestore, Auth, other sites): untouched, straight to the network.
// - Only caches whose name starts with 'hearth-' are ever deleted. Other apps on this address keep theirs.
const SHELL_CACHE_NAME = 'hearth-shell-v1';
const PRECACHE_URLS = [
  './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap'
];
const VENDOR_HOSTS = ['www.gstatic.com', 'fonts.gstatic.com', 'fonts.googleapis.com'];
const NET_TIMEOUT_MS = 6000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE_NAME).then((cache) =>
    // one failed file must not stop the whole install, so each is cached on its own
    Promise.all(PRECACHE_URLS.map((url) =>
      cache.add(new Request(url, { cache: 'reload' })).catch((e) => console.warn('Hearth SW: precache skipped', url, e && e.message))
    ))
  ));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((n) => n.startsWith('hearth-') && n !== SHELL_CACHE_NAME).map((n) => caches.delete(n))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), own = url.origin === self.location.origin;
  if (own && url.pathname.startsWith('/__/')) return;
  if (own) { event.respondWith(networkFirst(req, event)); return; }
  if (VENDOR_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(req, event));
});

// SHA-256 of the body: two builds can share a length, so only the bytes are reliable.
async function signature(resp) {
  try {
    const d = await crypto.subtle.digest('SHA-256', await resp.clone().arrayBuffer());
    return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) { return ''; }
}
async function notifyUpdateReady() {
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  wins.forEach((c) => c.postMessage({ type: 'hearth-update-ready' }));
}

async function networkFirst(request, event) {
  const cache = await caches.open(SHELL_CACHE_NAME);
  const shellUrl = new URL('./index.html', self.registration.scope).href;
  const isNav = request.mode === 'navigate';
  // Whatever address a launch used, it is saved to and served from one entry.
  const fromCache = async () => {
    if (isNav) { const s = await cache.match(shellUrl); if (s) return s; }
    return cache.match(request, { ignoreSearch: true });
  };
  let servedSavedCopy = false;
  const net = fetch(request, { cache: 'no-cache' }).then(async (fresh) => {
    if (fresh && fresh.ok) {
      let changed = false;
      if (isNav) {
        try {
          const old = await cache.match(shellUrl);
          if (old) { const [a, b] = await Promise.all([signature(old), signature(fresh)]); changed = !!a && !!b && a !== b; }
        } catch (e) { /* cannot compare: do not announce */ }
      }
      const saved = cache.put(isNav ? shellUrl : request, fresh.clone())
        .then(() => { if (changed && servedSavedCopy) return notifyUpdateReady(); })
        .catch((e) => console.warn('Hearth SW: could not save', request.url, e && e.message));
      if (event && event.waitUntil) event.waitUntil(saved);
    }
    return fresh;
  });
  net.catch(() => {});
  if (event && event.waitUntil) event.waitUntil(net.catch(() => {}));
  const cached = await fromCache();
  if (!cached) return net;
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NET_TIMEOUT_MS));
  try {
    const winner = await Promise.race([net, timeout]);
    if (winner && (winner.ok || winner.type === 'opaqueredirect')) return winner;
  } catch (e) { /* offline or failed: use the saved copy */ }
  servedSavedCopy = true;
  return cached;
}

async function cacheFirst(request, event) {
  const cache = await caches.open(SHELL_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    const saved = cache.put(request, fresh.clone()).catch(() => {});
    if (event && event.waitUntil) event.waitUntil(saved);
  }
  return fresh;
}

// ---- Push notifications (sent by the Hearth push worker through Firebase Cloud Messaging) ----
self.addEventListener('push', (event) => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (e) { p = {}; }
  const d = p.data || p.notification || p;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some((c) => c.visibilityState === 'visible')) return; // the app is open and showing; it plays its own alert
    await self.registration.showNotification(d.title || 'Hearth', {
      body: d.body || '', icon: './icon-192.png', badge: './icon-192.png',
      tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || './' }
    });
  })());
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
