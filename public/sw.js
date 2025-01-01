const CACHE_NAME = "journal-cache";

// Install: Pre-cache specific static assets
self.addEventListener("install", (event) => {
    console.log("Service worker registered!");
    self.skipWaiting(); // Activate the service worker immediately
});

// Fetch: Intercept requests and serve from cache or network
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Always fetch build-meta.json from the network
    if (url.pathname === "/build-meta.json") {
        event.respondWith(fetch(event.request));
        return;
    }

    // Don't cache API requests
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Normal caching logic for other requests
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        // Only cache GET requests
                        if (event.request.method === "GET") {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                })
                .catch((error) => {
                    console.error("Fetch failed:", error);
                    throw error;
                });
        })
    );
});
