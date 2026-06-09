// ══════════════════════════════════════════════════════════════════
// Fluxy ERP — Service Worker v1.2
// Strategy: Cache-first for app shell, Network-first for API calls
// Single-file architecture: index.html contains all CSS + JS inline
// ══════════════════════════════════════════════════════════════════

var CACHE_VERSION    = '1.2';
var CACHE_NAME       = 'fluxy-v' + CACHE_VERSION;
var CACHE_OLD_PREFIX = 'fluxy-v';

// App shell — single-file architecture (all CSS/JS embedded in index.html)
var SHELL_ASSETS = [
  './index.html',
  './sw.js',
  './manifest.json',
];

// ── Install: pre-cache shell ──────────────────────────────────────
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(SHELL_ASSETS);
    }).then(function(){
      return self.skipWaiting(); // activate immediately
    })
  );
});

// ── Activate: delete old caches ───────────────────────────────────
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){
          return k.startsWith(CACHE_OLD_PREFIX) && k !== CACHE_NAME;
        }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim(); // take control immediately
    })
  );
});

// ── Fetch: cache-first for shell, network-first for others ────────
self.addEventListener('fetch', function(e){
  var url = e.request.url;

  // Only handle same-origin GET requests
  if(e.request.method !== 'GET') return;
  if(!url.startsWith(self.location.origin)) return;

  // Network-first for manifest.json (always fresh metadata)
  if(url.includes('manifest.json')){
    e.respondWith(
      fetch(e.request).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }

  // Cache-first for index.html and sw.js (app shell)
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached){
        // Stale-while-revalidate: serve cache, update in background
        var fetchUpdate = fetch(e.request).then(function(response){
          if(response && response.status === 200){
            caches.open(CACHE_NAME).then(function(cache){
              cache.put(e.request, response.clone());
            });
          }
          return response;
        }).catch(function(){});
        return cached;
      }
      return fetch(e.request).then(function(response){
        if(response && response.status === 200){
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, response.clone());
          });
        }
        return response;
      });
    })
  );
});

// ── Message: force skip waiting ───────────────────────────────────
self.addEventListener('message', function(e){
  if(e.data && e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
