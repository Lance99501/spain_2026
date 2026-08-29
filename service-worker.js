const CACHE_VERSION='spain2026-20260830-v4';
const APP_CACHE=`${CACHE_VERSION}-app`;
const RUNTIME_CACHE=`${CACHE_VERSION}-runtime`;
const TILE_CACHE=`${CACHE_VERSION}-tiles`;

const APP_SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/app-icon.svg',
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/app-shell.css',
  './assets/css/today.css',
  './assets/css/map.css',
  './assets/css/itinerary.css',
  './assets/css/ticket.css',
  './assets/css/pwa.css',
  './assets/js/app.js',
  './assets/js/api.js',
  './assets/js/map.js',
  './assets/js/ticket.js',
  './assets/js/itinerary.js',
  './assets/js/today.js',
  './assets/js/pwa.js',
  './assets/js/router.js',
  './data/trip-data.js',
  './assets/images/barcelona.jpg',
  './assets/images/sevilla.jpg',
  './assets/images/granada.jpg',
  './assets/images/madrid.jpg'
];

const OPTIONAL_EXTERNAL=[
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(APP_CACHE);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(OPTIONAL_EXTERNAL.map(url=>cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keep=new Set([APP_CACHE,RUNTIME_CACHE,TILE_CACHE]);
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(key=>key.startsWith('spain2026-')&&!keep.has(key))
        .map(key=>caches.delete(key))
    );
    await self.clients.claim();
  })());
});

function isSensitiveRequest(request,url){
  if(request.method!=='GET') return true;
  if(url.origin!==self.location.origin) return false;
  return /\/api\/tickets(?:\/|$)/.test(url.pathname)
    || /\/api\/auth(?:\/|$)/.test(url.pathname);
}

async function networkFirst(request,cacheName){
  const cache=await caches.open(cacheName);
  try{
    const response=await fetch(request);
    if(response&&response.ok) await cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached) return cached;
    throw error;
  }
}

async function cacheFirst(request,cacheName){
  const cache=await caches.open(cacheName);
  const cached=await cache.match(request);
  if(cached) return cached;

  const response=await fetch(request);
  if(response&&(response.ok||response.type==='opaque')){
    await cache.put(request,response.clone());
  }
  return response;
}

async function trimCache(cacheName,maxEntries){
  const cache=await caches.open(cacheName);
  const keys=await cache.keys();
  while(keys.length>maxEntries){
    await cache.delete(keys.shift());
  }
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);

  if(isSensitiveRequest(request,url)){
    event.respondWith(fetch(request));
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response&&response.ok){
          const cache=await caches.open(APP_CACHE);
          await cache.put('./index.html',response.clone());
        }
        return response;
      }catch{
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  if(url.hostname.endsWith('.tile.openstreetmap.org')){
    event.respondWith((async()=>{
      const response=await cacheFirst(request,TILE_CACHE);
      trimCache(TILE_CACHE,160).catch(()=>{});
      return response;
    })());
    return;
  }

  if(url.hostname==='cdn.jsdelivr.net'){
    event.respondWith(cacheFirst(request,RUNTIME_CACHE));
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith(networkFirst(request,APP_CACHE));
  }
});
