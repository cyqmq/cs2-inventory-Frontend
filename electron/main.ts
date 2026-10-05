import { app, BrowserWindow, ipcMain, net, shell } from "electron";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === "development" || (process.env.NODE_ENV !== "production" && !app.isPackaged);
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

const DEFAULT_API_BASE_URL = "https://ccs.8385838.xyz";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml"
};

/**
 * Shared secret with the Worker. It deliberately has no default value: a build
 * that ships a placeholder lets anyone who reads the binary call
 * `/api/auth/electron?steamId=<any>&secret=<placeholder>` and receive a session
 * cookie for that Steam account. Fail closed instead.
 */
function getElectronAuthSecret(): string {
  const secret = process.env.ELECTRON_AUTH_SECRET || readConfig().electronAuthSecret || "";
  if (secret.trim() === "") {
    throw new Error(
      "ELECTRON_AUTH_SECRET is not configured. Set the ELECTRON_AUTH_SECRET environment variable (packaged builds) or electronAuthSecret in config.json (dev) before using Steam sign-in."
    );
  }
  return secret;
}
const STEAM_OPENID_SERVER = "https://steamcommunity.com/openid/login";
const STEAM_ID_REGEX = /^https:\/\/steamcommunity\.com\/openid\/id\/(76561[0-9]{12})\/?$/;

/**
 * The only origins the app window is ever allowed to sit on: its own local
 * server, and the Vite dev server.
 *
 * Anything else means the window has been navigated somewhere unexpected, and
 * `webSecurity: true` means that page now holds a same-origin view of the
 * session cookie and the preload bridge. Redirecting to `steamcommunity.com`
 * would break that, so Steam sign-in deliberately does not happen inside the
 * window: `steam-login` opens it in the user's real browser instead, and Steam
 * sends them back to the loopback callback, which the app picks up via the
 * `open-url` event (see `registerSteamCallbackInterception`).
 */
function isTrustedAppOrigin(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:") {
    return false;
  }
  const host = parsed.hostname;
  // The loopback server this process starts. Both spellings because a literal
  // IPv6 host is bracketed in the URL.
  if (host === "127.0.0.1" || host === "[::1]" || host === "localhost") {
    return true;
  }
  try {
    return new URL(VITE_DEV_SERVER_URL).hostname === host;
  } catch {
    return false;
  }
}

function getConfigPath() {
  return path.join(app.getPath("userData"), "config.json");
}

function readConfig(): Record<string, string> {
  const configPath = getConfigPath();
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

function writeConfig(config: Record<string, string>) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

function getApiBaseUrl(): string {
  const config = readConfig();
  return config.apiBaseUrl || process.env.API_BASE_URL || DEFAULT_API_BASE_URL;
}

let localServerPort: number | null = null;

let callbackParams: Record<string, string> | null = null;

/**
 * Resolves a request path inside `root`, or undefined when it escapes.
 * `path.join` happily collapses `..`, so a raw `GET /../../Users/x/.ssh/id_rsa`
 * would otherwise be served from anywhere the process can read. Confining the
 * resolved path back under `root` (with a separator so `/client-evil` does not
 * pass for `/client`) is what actually stops it.
 */
function resolveStaticFile(root: string, requestPath: string): string | undefined {
  let decoded: string;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return undefined;
  }
  // Reject NUL and backslashes outright: Windows treats "\\" as a separator, so
  // a path the POSIX-only check above considers harmless can still traverse.
  if (decoded.includes("\0") || decoded.includes("\\")) {
    return undefined;
  }
  const relative = decoded.replace(/^\/+/, "");
  const resolved = path.resolve(root, relative === "" ? "index.html" : relative);
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved !== root && !resolved.startsWith(prefix)) {
    return undefined;
  }
  return resolved;
}

function startLocalServer(clientDir: string): Promise<number> {
  return new Promise((resolve) => {
    const root = path.resolve(clientDir);
    const server = http.createServer((req, res) => {
      const rawUrl = req.url || "/";
      const urlPath = rawUrl.split("?")[0].split("#")[0];
      if (urlPath === "/steam-callback") {
        const query = new URL(rawUrl, "http://localhost").searchParams;
        callbackParams = {};
        for (const [k, v] of query.entries()) {
          if (k.startsWith("openid.")) callbackParams[k] = v;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html><body style='background:#1c1c1c;color:#f5f5f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'><div>Verifying Steam login...</div></body></html>");
        // Steam completes the flow by redirecting the *system browser* here, and
        // this loopback server is what receives it — Windows cannot register an
        // `http://` protocol handler, so OS interception is not an option. Drive
        // the verification directly instead of relying on the app window to
        // navigate here.
        const port = localServerPort;
        if (port === null) {
          res.writeHead(503, { "Content-Type": "text/html" });
          res.end("<html><body>Callback server unavailable. Return to the app.</body></html>");
          return;
        }
        void handleSteamCallback(`http://127.0.0.1:${port}/steam-callback`);
        return;
      }
      const filePath = resolveStaticFile(root, urlPath);
      const headers: Record<string, string> = {
        "Content-Type": "text/html",
        "Cache-Control": "no-store"
      };
      if (filePath === undefined) {
        res.writeHead(403, headers);
        res.end("Forbidden");
        return;
      }
      const mime = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
      headers["Content-Type"] = mime;
      fs.readFile(filePath, (err, data) => {
        if (err) {
          fs.readFile(path.join(root, "index.html"), (err2, data2) => {
            if (err2) {
              res.writeHead(404, headers);
              res.end("Not found");
              return;
            }
            headers["Content-Type"] = "text/html";
            res.writeHead(200, headers);
            res.end(data2);
          });
          return;
        }
        res.writeHead(200, headers);
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      localServerPort = (server.address() as import("net").AddressInfo).port;
      resolve(localServerPort);
    });
  });
}

async function verifySteamLogin(
  params: Record<string, string>,
  returnUrl: string
): Promise<string> {
  if (params["openid.mode"] !== "id_res") throw new Error("Invalid openid.mode");
  if (params["openid.ns"] !== "http://specs.openid.net/auth/2.0") throw new Error("Invalid openid.ns");
  if (!params["openid.return_to"]?.startsWith(returnUrl)) throw new Error("Invalid openid.return_to");
  if (params["openid.op_endpoint"] !== STEAM_OPENID_SERVER) throw new Error("Invalid openid.op_endpoint");

  const nonceMatch = params["openid.response_nonce"]?.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z)/);
  if (!nonceMatch) throw new Error("Invalid response_nonce");
  if (Math.abs(Date.now() - new Date(nonceMatch[1]).getTime()) > 300_000) throw new Error("Nonce too old");

  const match = params["openid.identity"]?.match(STEAM_ID_REGEX);
  if (!match) throw new Error("Invalid identity - no SteamID");
  const steamId = match[1];

  const body = new URLSearchParams(params);
  body.set("openid.mode", "check_authentication");

  const response = await net.fetch(STEAM_OPENID_SERVER, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) throw new Error(`Steam verification HTTP ${response.status}`);
  const text = await response.text();
  const kv: Record<string, string> = {};
  for (const line of text.trim().split("\n")) {
    const idx = line.indexOf(":");
    if (idx !== -1) kv[line.slice(0, idx)] = line.slice(idx + 1);
  }
  if (kv["is_valid"] !== "true" || kv["ns"] !== "http://specs.openid.net/auth/2.0") {
    throw new Error("Steam rejected verification");
  }
  return steamId;
}

let mainWindow: BrowserWindow | null = null;
let isSteamLogin = false;
let steamLoginResolve: (() => void) | null = null;
let steamLoginReject: ((err: Error) => void) | null = null;

async function handleSteamCallback(url: string) {
  console.log("[CS2-MAIN] handleSteamCallback called, isSteamLogin:", isSteamLogin);
  if (!isSteamLogin || !mainWindow) return;
  const apiBaseUrl = getApiBaseUrl();
  // The real listening port, never a fallback: a mismatched port would make the
  // prefix check below fail and silently drop a legitimate login.
  const port = localServerPort;
  if (port === null) {
    isSteamLogin = false;
    steamLoginReject?.(new Error("Steam callback arrived before the callback server was listening"));
    steamLoginResolve = null;
    steamLoginReject = null;
    return;
  }
  const returnUrl = `http://127.0.0.1:${port}/steam-callback`;
  // Never log the full URL: the query string carries one-time OpenID credentials.
  console.log("[CS2-MAIN] callback received on expected prefix:", url.startsWith(returnUrl));
  if (!url.startsWith(returnUrl)) {
    console.log("[CS2-MAIN] URL prefix mismatch, ignoring");
    return;
  }

  try {
    const params = callbackParams || {};
    callbackParams = null;
    console.log("[CS2-MAIN] callbackParams keys:", Object.keys(params));

    const steamId = await verifySteamLogin(params, returnUrl);
    console.log("[CS2-MAIN] steamId:", steamId);

    let nickname = "Player";
    let avatarUrl = "";
    try {
      const apiKeyResp = await net.fetch(
        `${apiBaseUrl}/api/auth/electron-config?secret=${encodeURIComponent(getElectronAuthSecret())}`,
        { method: "GET", signal: AbortSignal.timeout(5000) }
      );
      if (apiKeyResp.ok) {
        const { steamApiKey } = await apiKeyResp.json() as { steamApiKey?: string };
        if (steamApiKey) {
          const summaryResp = await net.fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamId}`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (summaryResp.ok) {
            const data = await summaryResp.json() as { response?: { players?: Array<{ personaname: string; avatarfull: string }> } };
            const player = data?.response?.players?.[0];
            if (player) {
              nickname = player.personaname;
              avatarUrl = player.avatarfull;
            }
          }
        }
      }
      console.log("[CS2-MAIN] steam profile: nickname=%s avatar=%s", nickname, avatarUrl);
    } catch (e) { console.log("[CS2-MAIN] profile fetch non-critical error:", e); }

    console.log("[CS2-MAIN] calling /api/auth/electron for steamId:", steamId);
    const sessionResp = await net.fetch(
      `${apiBaseUrl}/api/auth/electron?steamId=${encodeURIComponent(steamId)}&secret=${encodeURIComponent(getElectronAuthSecret())}&nickname=${encodeURIComponent(nickname)}&avatar=${encodeURIComponent(avatarUrl)}`,
      { method: "GET", signal: AbortSignal.timeout(10000) }
    );
    console.log("[CS2-MAIN] /api/auth/electron status:", sessionResp.status);
    if (!sessionResp.ok) {
      throw new Error(`Session creation failed: ${sessionResp.status}`);
    }
    const { sessionCookie } = await sessionResp.json() as { sessionCookie: string };

    const _prefix = "_session=";
    const _rawValue = sessionCookie.startsWith(_prefix)
      ? sessionCookie.substring(_prefix.length).split(";")[0]
      : sessionCookie;

    const _maxAgeMatch = sessionCookie.match(/Max-Age=(\d+)/i);
    const _maxAge = _maxAgeMatch ? parseInt(_maxAgeMatch[1], 10) : 2147483647;
    const _expirationDate = Math.floor(Date.now() / 1000) + _maxAge;

    await mainWindow.webContents.session.cookies.set({
      url: apiBaseUrl,
      name: "_session",
      value: _rawValue,
      path: "/",
      secure: apiBaseUrl.startsWith("https"),
      httpOnly: true,
      sameSite: "no_restriction",
      expirationDate: _expirationDate
    });
    console.log("[CS2-MAIN] cookie set done");

    isSteamLogin = false;
    console.log("[CS2-MAIN] loading URL http://127.0.0.1:" + port + "/");
    mainWindow.loadURL(`http://127.0.0.1:${port}/`);
    steamLoginResolve?.();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("[CS2-MAIN] ERROR:", msg);
    isSteamLogin = false;
    mainWindow.loadURL(`http://127.0.0.1:${port}/`);
    steamLoginReject?.(new Error(msg));
  } finally {
    steamLoginResolve = null;
    steamLoginReject = null;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: "CS2 Inventory Simulator",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Was `false`, which disabled the same-origin policy outright: any page
      // the window was navigated to could read the app's origin, and with it the
      // session cookie and the preload bridge. Steam sign-in used to rely on this
      // to load steamcommunity.com in-window; that now happens in the system
      // browser (see `steam-login`), so the exemption is not needed.
      webSecurity: true
    },
    icon: isDev
      ? undefined
      : path.join(__dirname, "..", "build", "client", "favicon.ico")
  });

  try {
    await mainWindow.webContents.session.clearServiceWorkers();
  } catch { /* ignore */ }

  // The app must never end up on a foreign origin. Anything that tries — an
  // in-app link, an injected redirect, a malicious ad in a bundled page — is
  // bounced to the user's browser instead, where it has no access to this
  // session. The current trusted page is allowed to keep loading.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isTrustedAppOrigin(url)) {
      return;
    }
    event.preventDefault();
    console.log("[CS2-MAIN] blocked navigation to untrusted origin, opening externally");
    void shell.openExternal(url);
  });

  // `will-redirect` covers the server-driven case that `will-navigate` misses:
  // an HTTP 302 from the local server to somewhere else.
  mainWindow.webContents.on("will-redirect", (event, url) => {
    if (isTrustedAppOrigin(url)) {
      return;
    }
    event.preventDefault();
    console.log("[CS2-MAIN] blocked redirect to untrusted origin, opening externally");
    void shell.openExternal(url);
  });

  // Opening a new window (target=_blank, window.open) is the same escape in a
  // different shape: deny it and hand the URL to the real browser. `deny` for
  // trusted origins too — a second Electron window would carry the same preload
  // and session, which nothing in the app asks for.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isTrustedAppOrigin(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const port = await startLocalServer(path.join(__dirname, "..", "build", "client"));
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("get-api-base-url", () => {
  return getApiBaseUrl();
});

ipcMain.handle("set-api-base-url", (_event, url: string) => {
  const config = readConfig();
  config.apiBaseUrl = url;
  writeConfig(config);
  return true;
});

ipcMain.handle("get-config-path", () => {
  return getConfigPath();
});

ipcMain.handle("steam-login", async () => {
  if (!mainWindow) throw new Error("No main window");
  // The callback has to be served even in dev, where the app itself is loaded
  // from Vite and the local server is otherwise never started.
  if (localServerPort === null) {
    await startLocalServer(path.join(__dirname, "..", "build", "client"));
  }
  const port = localServerPort;
  if (port === null) throw new Error("Local callback server unavailable");
  const returnUrl = `http://127.0.0.1:${port}/steam-callback`;

  isSteamLogin = true;

  return new Promise<void>((resolve, reject) => {
    steamLoginResolve = resolve;
    steamLoginReject = reject;

    const steamUrl = new URL(STEAM_OPENID_SERVER);
    steamUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
    steamUrl.searchParams.set("openid.mode", "checkid_setup");
    steamUrl.searchParams.set("openid.return_to", returnUrl);
    steamUrl.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
    steamUrl.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

    // In the system browser, not the app window: the navigation whitelist only
    // admits loopback, and handing steamcommunity.com a same-origin view of the
    // session cookie and preload bridge is exactly what webSecurity is there to
    // prevent.
    void shell.openExternal(steamUrl.toString()).catch((error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.log("[CS2-MAIN] could not open browser for Steam login:", msg);
      isSteamLogin = false;
      reject(new Error(`Could not open browser for Steam login: ${msg}`));
    });

    setTimeout(() => {
      if (isSteamLogin) {
        isSteamLogin = false;
        reject(new Error("Steam login timeout"));
      }
    }, 300_000);
  });
});

/**
 * Single-instance lock, so a second launch focuses the window already waiting
 * for a Steam callback instead of starting a login that will never complete.
 */
function registerSingleInstance() {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return false;
  }
  app.on("second-instance", () => {
    if (mainWindow === null) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  return true;
}

if (registerSingleInstance()) {
  app.whenReady().then(createWindow);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
