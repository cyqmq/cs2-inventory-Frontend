import { type CS2ItemTranslationByLanguage } from "@ianlucas/cs2-lib";
import { type ViewerStatusReport } from "~/utils/viewer-availability";

interface ClientGlobals {
  splash: {
    end: () => void;
    loaded: boolean;
    n: number;
    render: () => void;
  };
  itemTranslationMap: CS2ItemTranslationByLanguage[string];
  systemTranslationMap: Record<string, string>;
  inspectedItem?: unknown;

  getViewerStatus?: () => ViewerStatusReport;
}

/**
 * Server-injected globals. The original server-rendered routes populated these
 * during SSR; in the JSON-API-worker architecture nothing is injected during SSR,
 * so these read as `undefined` at runtime and the client falls back to the
 * regular `appLogoUrl` rule. Typed explicitly to avoid `never` inference from
 * loader-return serialization in React Router v8.
 */
export interface ServerGlobals {
  appLogoBase64Url?: string;
  [key: string]: unknown;
}

type Globals = ClientGlobals;

declare global {
  interface Window {
    InventorySimulator: Globals;
  }
}

const isBrowser = typeof window !== "undefined";

if (isBrowser) {
  const context = window;
  if (context.InventorySimulator === undefined) {
    context.InventorySimulator = {} as Globals;
  }
}

const globals = isBrowser
  ? (window as Window).InventorySimulator
  : ({} as Globals);

export const isServerContext = !isBrowser;
export const serverGlobals = globals as unknown as ServerGlobals;
export const clientGlobals = globals as ClientGlobals;
