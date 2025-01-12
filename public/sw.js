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

            // Try to find a cached response for the year
            const dateMatch = /(\d{4})-\d{2}-\d{2}/.exec(url.pathname);
            if (dateMatch) {
                const year = dateMatch[1];
                return caches.open(CACHE_NAME).then((cache) => {
                    return cache.match(`/${year}`).then((yearlyCache) => {
                        if (yearlyCache) {
                            return yearlyCache;
                        }

                        // If no cache found, fetch from network
                        return fetchAndCache(event.request, year);
                    });
                });
            }

            // For non-date URLs, proceed with normal fetch and cache
            return fetchAndCache(event.request);
        })
    );
});

// Helper function to fetch from network and cache the response
function fetchAndCache(request, year = null) {
    return fetch(request).then((networkResponse) => {
        if (request.method === "GET") {
            return caches.open(CACHE_NAME).then((cache) => {
                // If we have a year, cache under the year key
                if (year) {
                    cache.put(`/${year}`, networkResponse.clone());
                } else {
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            });
        }
        return networkResponse;
    });
}
