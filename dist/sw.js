const CACHE='mikawa-offline-v4';
const SHELL=['./','./index.html','./style.css','./experience.css','./motion.js','./random.js','./assets/contours.svg','./app.js','./data.js','./photos.js','./budgets.js','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./assets/NotoSerifJP.woff2','./assets/NotoSansJP.woff2','./assets/NotoSerifJP-OFL.txt','./assets/NotoSansJP-OFL.txt'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mikawa-offline-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const image=url.pathname.includes('/assets/');
 if(image){event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}));return;}
 event.respondWith(fetch(request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone());}return response;}).catch(async()=>{const cached=await caches.match(request);if(cached)return cached;if(request.mode==='navigate')return caches.match(new URL('./index.html',self.registration.scope).href);return Response.error();}));
});
