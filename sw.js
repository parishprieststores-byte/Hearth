const V='hearth-v3',SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 const own=u.origin===location.origin;if(!(own||u.hostname==='www.gstatic.com'))return;
 e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(e.request);
  const net=fetch(e.request).then(r=>{if(r.ok||r.type==='opaque')c.put(e.request,r.clone());return r});
  if(own)return net.catch(()=>hit);  /* own files: network first, cache only when offline */
  return hit||net}))});
