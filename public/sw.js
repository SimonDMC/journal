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

    // Don't cache non-HTTP (chrome-extension://) requests
    if (!event.request.url.startsWith("http")) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Don't cache local requests while developing
    /* if (url.host.includes("localhost") || url.host.includes("127.0.0.1")) {
        event.respondWith(fetch(event.request));
        return;
    } */

    // Normal caching logic for other requests
    event.respondWith(
        caches.match(event.request).then(async (cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            // Cache entry separately due to ?date= varying
            if (url.pathname == "/entry") {
                const cache = await caches.open(CACHE_NAME);
                let entryPage = await cache.match(`/entry`);

                if (!entryPage) {
                    entryPage = await fetch(event.request);
                    await cache.put(`/entry`, entryPage.clone());
                }

                return entryPage;
            }

            // For non-entry URLs, proceed with normal fetch and cache
            const networkResponse = await fetch(event.request);
            if (event.request.method === "GET") {
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
        })
    );
});
