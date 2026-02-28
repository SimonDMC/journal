# Development

## Pre-requisites

Ensure you have Node.js installed, and run `npm install` to install all dependencies. If Vite
complains about your Node.js version, it might be out of date.

## Running using a dev server

To run the app with a dev server, run `npm run dev` to start the app at http://localhost:5173. The
development server serves both the frontend, via Vite, and backend (accessible through `/api/*`) via
Miniflare (Cloudflare Workers runtime).

The dev server is useful while developing, as it provides live reload, meaning you don't need to
refresh the page whenever you make a change to the codebase. However, (caching)[caching.md] is
disabled on the development server (to be able to see changes quickly), meaning it isn't entirely
accurate to how the app will run in production.

## Running using a preview server

To check how the app will behave in a real environment, create a production build by running
`npm run build`, followed by starting a preview server by running `npm run start`. This server
will not receive changes whenever you make a change in the codebase, instead you'll have to
re-run the build and restart the server. The preview server closely mimics the production
environment, except with a local database.

## Testing on a phone

To test how the app will look and run on a phone (or any other non-desktop device), you can either
simulate it using your preferred browser's devtools, or expose the app over a network.

Using the browser devtools is easy, convenient and allows for better debugging, but is limited to
a specific browser engine as well as having other limitations (e.g. multi-point touching). For that
reason, testing on a real device can be useful.

The easiest way of doing that is to proxy the local server through a cloudflare tunnel using
[cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/).
By creating a temporary tunnel, you get an HTTPS URL which you can open on your phone and use to
test the app.

Alternatively, to expose a server to the local network, append ` -- --host` to the dev or preview
server command (e.g. `npm run dev -- --host`). However, the app will not run properly on unencrypted
HTTP, due to its reliance on the [crypto.subtle API](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle),
which requires HTTPS, so you'll have to set up a self-signed certificate.
