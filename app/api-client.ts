import type { ViewerCatalog, ViewerServerStatus } from "./data/viewer";

let _apiBaseUrl = "http://localhost:8787";

const API_BASE_URL_OVERRIDE =
  typeof process !== "undefined" &&
  typeof process.env !== "undefined" &&
  typeof process.env.API_BASE_URL === "string" &&
  process.env.API_BASE_URL.trim() !== ""
    ? process.env.API_BASE_URL.trim()
    : undefined;

if (API_BASE_URL_OVERRIDE !== undefined) {
  _apiBaseUrl = API_BASE_URL_OVERRIDE.replace(/\/$/, "");
}

export async function initApiBaseUrl() {
  if (typeof window !== "undefined" && window.electronAPI) {
    try {
      const url = await window.electronAPI.getApiBaseUrl();
      if (url) _apiBaseUrl = url.replace(/\/$/, "");
    } catch {}
  }
}

export function setApiBaseUrl(url: string) {
  _apiBaseUrl = url.replace(/\/$/, "");
}

export function getApiBaseUrl() {
  return _apiBaseUrl;
}

export function apiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${_apiBaseUrl}${cleanPath}`;
}

export async function apiPost<T>(path: string, body: object) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });
  if (!response.ok) {
    throw new Error(`API POST ${path} failed: ${response.status}`);
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : undefined;
}

export async function apiGet<T>(path: string) {
  const response = await fetch(apiUrl(path), { credentials: "include" });
  if (!response.ok) {
    throw new Error(`API GET ${path} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

/**
 * Public user data as returned by the JSON API worker (`/api/init`,
 * `/api/user/:userId`). `inventory` is the stringified CS2 inventory JSON.
 */
export interface ClientUser {
  avatar: string;
  createdAt: number;
  id: string;
  name: string;
  updatedAt: number;
  inventory: string | null;
  syncedAt: number;
}

/**
 * Preferences returned by `/api/init`.
 */
export interface ClientPreferences {
  background: string | null;
  lang: string;
  language: string;
  hideFilters: boolean;
  hideFreeItems: boolean;
  hideNewItemLabel: boolean;
  prefer2dStickerEditor: boolean;
  statsForNerds: boolean;
}

/**
 * Site rules returned by `/api/init`. The index signature keeps unknown rules
 * readable (`unknown`) while the fields the frontend actually consumes are
 * declared explicitly so they compile to the right types.
 */
export interface ClientRules {
  [rule: string]: unknown;
  appCacheInventory: boolean;
  appFooterName: string;
  appFaviconMimeType: string;
  appFaviconUrl: string;
  appHideAuth: boolean;
  appHideLogo: boolean;
  appLogoUrl: string;
  appName: string;
  assetsBaseUrl: string;
  cloudflareAnalyticsToken?: string;
  craftAllowImportInspectLink: boolean;
  craftAllowKeychainSeed: boolean;
  craftAllowKeychains: boolean;
  craftAllowKeychainX: boolean;
  craftAllowKeychainY: boolean;
  craftAllowKeychainZ: boolean;
  craftAllowNametag: boolean;
  craftAllowPatches: boolean;
  craftAllowSeed: boolean;
  craftAllowStatTrak: boolean;
  craftAllowStickerRotation: boolean;
  craftAllowStickerSchema: boolean;
  craftAllowStickers: boolean;
  craftAllowStickerWear: boolean;
  craftAllowStickerX: boolean;
  craftAllowStickerY: boolean;
  craftAllowWear: boolean;
  craftHideCategory: string[];
  craftHideFilterType: string[];
  craftHideId: number[];
  craftHideModel: string[];
  craftHideType: string[];
  craftMaxQuantity: number;
  editAllowKeychainSeed: boolean;
  editAllowKeychains: boolean;
  editAllowKeychainX: boolean;
  editAllowKeychainY: boolean;
  editAllowKeychainZ: boolean;
  editAllowNametag: boolean;
  editAllowPatches: boolean;
  editAllowSeed: boolean;
  editAllowStatTrak: boolean;
  editAllowStickerRotation: boolean;
  editAllowStickerSchema: boolean;
  editAllowStickers: boolean;
  editAllowStickerWear: boolean;
  editAllowStickerX: boolean;
  editAllowStickerY: boolean;
  editAllowWear: boolean;
  editHideCategory: string[];
  editHideId: number[];
  editHideModel: string[];
  editHideType: string[];
  inventoryItemAllowApplyPatch: boolean;
  inventoryItemAllowApplySticker: boolean;
  inventoryItemAllowEdit: boolean;
  inventoryItemAllowInspectInGame: boolean;
  inventoryItemAllowRemovePatch: boolean;
  inventoryItemAllowRemoveSticker: boolean;
  inventoryItemAllowScrapeSticker: boolean;
  inventoryItemAllowShare: boolean;
  inventoryItemAllowUnlockContainer: boolean;
  inventoryItemEquipHideModel: string[];
  inventoryItemEquipHideType: string[];
  /**
   * Upstream #527. The Worker sends both limits (already clamped to the game's
   * hard maximum, so `-1` never reaches the client). They stay optional so an
   * older Worker deployment keeps working; `AppProvider` falls back to `-1`.
   */
  inventoryItemMaxPatches?: number;
  inventoryItemMaxStickers?: number;
  inventoryMaxItems: number;
  inventoryStorageUnitMaxItems: number;
  meta?: { appUrl: string; appSiteName: string };
  sourceCommit?: string;
  viewerAssetsBaseUrl: string;
  viewerAttachmentsOnly: boolean;
  viewerCatalog?: ViewerCatalog;
  /**
   * Upstream #631: the server probes the viewer (catalog + public per-origin
   * quota) and publishes the verdict. The Worker sends it, including
   * `{ available: false, reason: "disabled" }` when the viewer is off. Kept
   * optional for older Worker deployments, where `AppProvider` derives an
   * equivalent status from `viewerCatalog` / `viewerEnabled` instead.
   */
  viewer?: ViewerServerStatus;
  viewerEmbedUrl: string;
  viewerEnabled: boolean;
  viewerKey: string;
  viewerOriginAllowed: boolean;
}

export interface ClientInitData {
  rules: ClientRules;
  preferences: ClientPreferences;
  user: ClientUser | undefined;
}

export async function fetchClientInit(): Promise<ClientInitData> {
  return apiGet<ClientInitData>("/api/init");
}