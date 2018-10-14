const cacheName = "tg-restaurant5";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        return cache.addAll([]);
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return keys.map(key => key !== cacheName && caches.delete(key))
    })
  );
});

self.addEventListener("fetch", event => {
  //restaurants
  if(event.request.url.endsWith("restaurants")) {
    return event.respondWith(
      fetch(event.request).then(res => res)
    )
  }
  event.respondWith(
    caches.open(cacheName).then(cache => {
      return cache.match(event.request).then(res => 
        
        res || fetch(event.request).then(netRes => {
                  cache.put(event.request, netRes.clone());
                  return netRes;
                })
      );
    })
  );
  
});