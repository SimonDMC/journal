<div align="center">
    <img src="client/public/favicon.png" height="128" alt="Journal Icon">
    <h1 align="center">Journal</h1>
</div>

<div align="center">

_A delightful web app for keeping a daily journal._

Built with
[React](https://react.dev/),
[TypeScript](https://www.typescriptlang.org/),
[Vite](https://vite.dev/) and
[TanStack Router](https://tanstack.com/router/latest), and hosted on
[Cloudflare Workers](https://workers.cloudflare.com/)!

</div>

## How To Use

A public instance is available at https://journal.simondmc.com.

The app itself should be pretty intuitive. The main page has a calendar which shows which entries
have been filled in. Click on one and start writing, entries save automatically. It works entirely
offline and doesn't automatically update unless you allow it to. You can create an account to sync
entries across multiple devices, search through them, and export them.

Read my [blog post](https://simondmc.com/blog/creating-my-perfect-journal-app) for an overview of
Journal's aims, features and history.

![Journal Screenshot](https://simondmc.com/i/8ec6fbddf01fb712.png)

## Privacy

Journal includes an account system, which lets you save your entries on a server and sync them
across multiple devices. Creating and using an account is entirely optional; if you don't make an
account, nothing ever leaves your device.

Entries saved to the server are **end-to-end encrypted** using your encryption key. This means that
even when you do have an account, nobody who has access to the database can read your entries. The
full privacy policy can be found in the Journal app, by going to Settings > Security > View Privacy Policy.

## Running Locally

For running Journal for development purposes, refer to the [documentation](/docs/development.md).

The frontend component is entirely plaform-agnostic, but the backend component
relies on Cloudflare's bindings for the database and rate-limiting. You can self-host Journal by
running [workerd](https://github.com/cloudflare/workerd) (the Cloudflare Workers runtime) alongside
[Wrangler](https://developers.cloudflare.com/workers/wrangler/) and
[Miniflare](https://developers.cloudflare.com/workers/testing/miniflare/) for emulating D1, R2, and
other bindings. I don't have experience with this, as Journal is intended to run on Cloudflare's
global platform, but it should work.

You can also deploy this project on your own Cloudflare account (just make sure you set your own D1
credentials in [wrangler.jsonc](/wrangler.jsonc) and fill in environment variables) to store account details and entries in a database
nobody else has access to.
