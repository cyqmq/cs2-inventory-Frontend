import { type CS2ItemTranslationByLanguage } from "@ianlucas/cs2-lib";

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
export const serverGlobals = globals as never;
export const clientGlobals = globals as ClientGlobals;
