// Offline app shell. Network first, so edits show up during development; cache is the fallback.
// Phase 4 will extend this file with notification handling.
const VERSION = 'w2d-v2';
const SHELL = [
  "./assets/icons/icon.svg",
  "./css/base.css",
  "./css/components.css",
  "./css/layout.css",
  "./css/responsive.css",
  "./index.html",
  "./js/app.js",
  "./js/controller.js",
  "./js/core/bus.js",
  "./js/core/config.js",
  "./js/core/icons.js",
  "./js/core/theme.js",
  "./js/core/utils.js",
  "./js/features/calendar.js",
  "./js/features/home.js",
  "./js/features/placeholders.js",
  "./js/features/settings.js",
  "./js/features/tasks.js",
  "./js/router.js",
  "./js/storage/db.js",
  "./js/storage/prefs.js",
  "./js/storage/store.js",
  "./js/ui/components.js",
  "./js/views.js",
  "./manifest.webmanifest",
  "./"
];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(VERSION).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request)));
});
