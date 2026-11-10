const CACHE='music-video-v5.8-lyrics-scenes-20261110';
const FILES=['./scene-keywords.js?v=5.8','./scene-planner.js?v=5.8','./pexels-core.js?v=5.7','./pexels.js?v=5.8','./future.css?v=5.8','./playback-clock.js?v=5.6.2','./video-loader.js?v=5.6.1','./speed-curve.js?v=5.6','./media.js?v=5.6.2','./ai-subtitles-core.js?v=5.4','./ai-subtitles.js?v=5.4','./ai-subtitles-worker.js?v=5.4','./studio.css?v=5.6','./transitions.js?v=5.5','./album.js?v=5.3.1','./playlist.js?v=5.4','./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-180.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('music-video-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;if(event.request.mode==='navigate')event.respondWith(fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone())}return response}).catch(()=>caches.match('./index.html')));else if(FILES.some(file=>new URL(file,self.registration.scope).href===event.request.url))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)))});




