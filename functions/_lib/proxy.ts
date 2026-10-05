type PagesEnv = {
  /**
   * Base URL of the deployed cs2-inventory-worker-api Worker, e.g.
   * "https://cs2-inventory-worker-api.<account>.workers.dev".
   *
   * Set this as an environment variable on the Cloudflare Pages project so the
   * Functions can forward /api, /sign-in, /sign-out and /healthz to it.
   */
  API_WORKER_URL?: string;
};

type PagesEventContext = {
  request: Request;
  env: PagesEnv;
};

/**
 * Forward a request to the CS2 API Worker while preserving the browser-facing
 * same-origin semantics:
 *
 *  - The browser calls the Pages domain, so it sees a same-origin response and
 *    sends the session cookie with every request. We pass Cookie/Authorization
 *    through untouched.
 *  - The `Origin` header is removed because the backend's CSRF guard
 *    (`assertSameOrigin`) compares it to the Worker's own origin, and the
 *    backend's CORS layer would otherwise treat the Pages origin as a
 *    cross-origin caller. With `Origin` gone, both checks pass.
 *  - `redirect: "manual"` keeps Steam OpenID's 302/307 hops (Steam -> callback
 *    -> FRONTEND_URL) intact instead of having the Function follow them.
 */
export async function proxyRequest(context: PagesEventContext): Promise<Response> {
  const baseUrl = context.env.API_WORKER_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    return new Response(
      "API_WORKER_URL is not configured on this Pages project. " +
        "Set it to the deployed cs2-inventory-worker-api URL.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const url = new URL(context.request.url);
  const target = new URL(url.pathname + url.search, baseUrl);

  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("content-length");

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: "manual"
  };
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  return fetch(target.toString(), init);
}