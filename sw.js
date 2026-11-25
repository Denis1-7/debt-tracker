/* Debt Tracker — offline shell.
 *
 * Cache-first for the app's own files, network for everything else. The app is
 * one page plus a manifest and icons, so a single cache holds all of it and a
 * cold start with no network still opens to the last state in localStorage.
 *
 * The cache name carries a hash of the built page, so shipping a new build
 * changes this file too, which makes every installed copy drop the old cache
 * instead of serving a stale app forever.
 */
const CACHE = 'debt-tracker-31359e8242'
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => hit ?? fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match('./index.html'))),
  )
})
