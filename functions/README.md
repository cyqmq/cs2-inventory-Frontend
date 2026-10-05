# Cloudflare Pages Functions

These Functions reverse-proxy the API paths from the Pages domain to the
deployed `cs2-inventory-worker-api` Cloudflare Worker, so the SPA can run on
Cloudflare Pages without CORS or cross-origin cookies:

- `/api/*` -> Worker
- `/sign-in/*` -> Worker (Steam OpenID callback)
- `/sign-out` -> Worker
- `/healthz` -> Worker

## Configuration

1. Deploy the backend Worker (`npm run deploy` in `cs2-inventory-worker-api`).
   Its URL is `https://cs2-inventory-worker-api.<account>.workers.dev`.
2. On the Cloudflare Pages project, add an environment variable:
   - `API_WORKER_URL` = the Worker URL above.
3. On the Worker, set the production values (see the backend `.dev.vars.example`):
   - `STEAM_CALLBACK_URL` = `https://<pages-domain>/sign-in/steam/callback`
   - `FRONTEND_URL` = `https://<pages-domain>`
   - `SESSION_SECURE_COOKIE` = `true`
4. Build and deploy: `npm run build`, then publish the `build/client` directory.

`public/_redirects` serves `index.html` for all non-API paths so the SPA's
client-side routes work on Pages.