import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import { CS2Economy, CS2_ITEMS } from "@ianlucas/cs2-lib";
import { Component, StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { apiGet, setApiBaseUrl, type ClientInitData } from "./api-client";
import { clientGlobals } from "./globals";
import { fetchTranslation } from "./utils/translation-api";

(function hideSplashBeforeHydrate() {
  const el = document.getElementById("splash");
  if (el && el.style.display !== "none") {
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.display = "none";
    console.log("[CS2] splash hidden by hideSplashBeforeHydrate IIFE");
  } else if (el) {
    console.log("[CS2] splash already hidden (display: none)");
  } else {
    console.log("[CS2] splash element not found in DOM");
  }
})();

const _splashStartTime = Date.now();
window.addEventListener("load", function() {
  console.log("[CS2] window load event, elapsed:", Date.now() - _splashStartTime, "ms");
});
const _origPushState = history.pushState;
history.pushState = function(...args: Parameters<History["pushState"]>) {
  console.log("[CS2] pushState called:", args[2]);
  return _origPushState.apply(this, args);
};

window.addEventListener("error", (e) => {
  console.log("[CS2] GLOBAL ERROR:", e.message, e.error?.stack);
});
window.addEventListener("unhandledrejection", (e) => {
  console.log("[CS2] UNHANDLED REJECTION:", e.reason?.stack || e.reason);
});

class RenderErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.log("[CS2] RENDER ERROR:", error.message, error.stack, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return <div><pre>{this.state.error.stack}</pre></div>;
    }
    return this.props.children;
  }
}

function hydrate() {
  fontAwesomeConfig.replacementClass = "";

  startTransition(() => {
    try {
      hydrateRoot(
        document,
        <StrictMode>
          <RenderErrorBoundary>
            <HydratedRouter />
          </RenderErrorBoundary>
        </StrictMode>
      );
    } catch (err) {
      console.log("[CS2] hydrateRoot error:", err);
    }
  });
}

async function loadTranslationsAndHydrate() {
  // Load the deployment's default language (or the user's stored preference)
  // before the first render instead of always downloading English first. The
  // initial /api/init round-trip decides which item-translation chunk is
  // needed; on failure English is fetched as a safe fallback.
  let language = "english";
  try {
    const init = await apiGet<ClientInitData>("/api/init");
    language = init.preferences?.language ?? "english";
  } catch (error) {
    console.error(
      "[CS2-entry] /api/init failed, falling back to english:",
      error
    );
  }
  try {
    const { systemTranslationMap, itemTranslationMap } =
      await fetchTranslation(language);
    clientGlobals.systemTranslationMap = systemTranslationMap;
    clientGlobals.itemTranslationMap = itemTranslationMap;
    CS2Economy.load({
      items: CS2_ITEMS,
      language: itemTranslationMap
    });
  } catch (error) {
    console.error("[CS2-entry] translation load failed:", error);
  }
  hydrate();
}

async function init() {
  console.log("[CS2-entry] init start");
  try {
    if (window.electronAPI) {
      const apiBaseUrl = await window.electronAPI.getApiBaseUrl();
      console.log("[CS2-entry] got API URL:", apiBaseUrl);
      setApiBaseUrl(apiBaseUrl);
    } else {
      const origin = window.location.origin;
      console.log("[CS2-entry] browser mode, API URL from origin:", origin);
      setApiBaseUrl(origin);
    }
    console.log("[CS2-entry] calling loadTranslationsAndHydrate");
    await loadTranslationsAndHydrate();
    console.log("[CS2-entry] loadTranslationsAndHydrate done");
  } catch (e) {
    console.error("[CS2-entry] init error:", e);
  }
}

console.log("[CS2-entry] script start");
init().catch(e => console.error("[CS2-entry] unhandled:", e));

if ("serviceWorker" in navigator) {
  // Unregister any existing service workers to avoid stale cache.
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) {
      reg.unregister();
    }
  });
}
