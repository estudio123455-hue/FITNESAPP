// The placeholder below is stamped in by scripts/generate-asset-manifest.cjs
// (a postbuild step) with a hash of every shipped file's contents, so this
// name — and therefore the cache it controls — changes on every build that
// actually changes something.
const CACHE_VERSION = '__CACHE_VERSION__'
const CACHE_NAME = `fitpulse-${CACHE_VERSION}`

const SHELL_URLS = ['/', '/manifest.json', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      let assetUrls = []
      try {
        const res = await fetch('/asset-manifest.json', { cache: 'no-store' })
        if (res.ok) assetUrls = await res.json()
      } catch {
        // not available (e.g. dev server) — fall back to the known shell paths
      }

      const cache = await caches.open(CACHE_NAME)
      await cache.addAll([...new Set([...SHELL_URLS, ...assetUrls])])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

// Cache-first for the app shell: serve from cache when we have it, otherwise
// fetch from the network and populate the cache for next time. Falls back to
// the cached shell for navigations when fully offline and uncached.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached

      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          cache.put(request, response.clone())
        }
        return response
      } catch (err) {
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/')
          if (fallback) return fallback
        }
        throw err
      }
    })(),
  )
})
