self.addEventListener("fetch", (event) => {
    // add to cache on network hit (network first)
    event.respondWith(
        fetch(event.request)
            .then(async (response) => {
                const cache = await caches.open("journal");

                // fetch offline.html and cache it
                await cache.add(new Request("/offline.html"));
                return response;
            })
            .catch(async () => {
                // if network fails, return offline.html
                const cache = await caches.open("journal");
                return cache.match("/offline.html");
            })
    );
});
