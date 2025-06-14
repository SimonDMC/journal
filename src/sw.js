// Install: Pre-cache specific static assets
self.addEventListener("install", (event) => {
    console.log("Service worker registered!");
    self.skipWaiting(); // Activate the service worker immediately
});

// Fetch: Intercept requests and serve from cache or network
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Always fetch version meta from the network
    if (url.pathname === "/versions.json" || url.pathname == "/asset-list.json") {
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
        caches
            .keys()
            // The version to use is the oldest available, since on install it wipes the old ones
            .then((names) => caches.open(names[0]))
            .then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                // Serve from cache if cached
                if (cachedResponse) {
                    return cachedResponse;
                }
                // For any request with no file extension, return index
                if (!url.pathname.includes(".")) {
                    let index = await cache.match("/");

                    if (!index) {
                        indexPage = await fetch(event.request);
                        await cache.put("/", indexPage.clone());
                        return indexPage;
                    }
                    return index;
                }
                // For asset URLs, proceed with normal fetch-and-cache
                const networkResponse = await fetch(event.request);
                if (event.request.method === "GET") {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            })
    );
});
