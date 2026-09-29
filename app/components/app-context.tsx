/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2Inventory,
  CS2InventorySpec,
  ensure
} from "@ianlucas/cs2-lib";
import type { ClientInitData, ClientRules } from "~/api-client";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo
} from "react";
import { useInventoryFilterState } from "~/components/hooks/use-inventory-filter-state";
import { useInventoryState } from "~/components/hooks/use-inventory-state";
import { useTranslation } from "~/components/hooks/use-translation";
import { SyncAction } from "~/data/sync";
import type { ViewerServerStatus } from "~/data/viewer";
import { pushToSync, sync } from "~/sync";
import { updateEconomyLanguage } from "~/utils/economy";
import {
  getCharmDetachmentsToDisplay,
  getFreeItemsToDisplay,
  safeLoadInventory
} from "~/utils/inventory";
import {
  cacheInventoryData,
  getCachedInventoryData,
  getSanitizedCachedInventoryData
} from "~/utils/inventory-cached-data";
import {
  TransformedInventoryItems,
  sortItemsByEquipped,
  transform
} from "~/utils/inventory-transform";
import { cacheAuthenticatedUserId } from "~/utils/user-cached-data";
import { viewerClientAvailability } from "~/utils/viewer-availability";

interface AppContextValue extends Omit<ClientInitData, "rules"> {
  inventory: CS2Inventory;
  inventoryFilter: ReturnType<typeof useInventoryFilterState>;
  items: TransformedInventoryItems;
  setInventory: (value: CS2Inventory) => void;
  translation: ReturnType<typeof useTranslation>;
  rules: ResolvedClientRules;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  return ensure(
    useContext(AppContext),
    "Application context is not available."
  );
}

export function useTranslate() {
  return useAppContext().translation.translate;
}

/**
 * The rules as every component sees them: `ClientRules` with the two
 * unimplemented #527 limits and the server-side viewer verdict resolved by
 * `AppProvider` before they reach the tree.
 */
export type ResolvedClientRules = ClientRules & {
  inventoryItemMaxPatches: number;
  inventoryItemMaxStickers: number;
  viewer: ViewerServerStatus;
};

export function useRules(): ResolvedClientRules {
  return useAppContext().rules;
}

export function usePreferences() {
  return useAppContext().preferences;
}

export function useInventory() {
  const { inventory, setInventory } = useAppContext();
  return [inventory, setInventory] as const;
}

export function useUser() {
  return useAppContext().user;
}

export function useInventoryItems() {
  return useAppContext().items;
}

export function useInventoryFilter() {
  return useAppContext().inventoryFilter;
}

interface AppProviderProps extends Omit<ClientInitData, "rules"> {
  children: ReactNode;
  rules: ClientRules;
}

export function AppProvider({
  children,
  preferences,
  rules,
  user
}: AppProviderProps) {
  // Upstream #527 added these two limits with a default of -1 ("use the game's
  // limit") and #631 has the server probe the viewer and publish the verdict.
  // This fork's Worker implements neither, so it never sends these fields;
  // resolve them here so every consumer sees plain values. Viewer probing
  // itself stays entirely client-side - nothing is reported anywhere.
  const resolvedRules: ResolvedClientRules = {
    ...rules,
    inventoryItemMaxPatches: rules.inventoryItemMaxPatches ?? -1,
    inventoryItemMaxStickers: rules.inventoryItemMaxStickers ?? -1,
    viewer:
      rules.viewer ??
      (rules.viewerEnabled && rules.viewerCatalog !== undefined
        ? { available: true, catalog: rules.viewerCatalog }
        : { available: false, reason: "disabled" })
  };

  const inventorySpec = {
    data:
      (user?.inventory
        ? safeLoadInventory(user.inventory)?.getData()
        : undefined) ??
      (rules.appCacheInventory ? getCachedInventoryData() : undefined),
    maxItems: rules.inventoryMaxItems,
    storageUnitMaxItems: rules.inventoryStorageUnitMaxItems
  } satisfies Partial<CS2InventorySpec>;
  const [inventory, setInventory, reactSetInventory] = useInventoryState(
    () => new CS2Inventory(inventorySpec)
  );
  const inventoryFilter = useInventoryFilterState();
  const translation = useTranslation({
    language: preferences.language
  });

  useEffect(() => {
    CS2Economy.baseUrl = rules.assetsBaseUrl ?? CS2Economy.baseUrl;
  }, [rules.assetsBaseUrl]);

  useEffect(() => {
    viewerClientAvailability.setServerStatus(resolvedRules.viewer);
  }, [resolvedRules.viewer]);

  useEffect(() => {
    cacheInventoryData(inventory.stringify());
  }, [inventory]);

  useEffect(() => {
    if (user !== undefined) {
      if (rules.appCacheInventory && user.inventory === null) {
        const cachedData = getSanitizedCachedInventoryData();
        if (cachedData !== undefined) {
          pushToSync({
            type: SyncAction.AddFromCache,
            data: cachedData
          });
          setInventory(
            new CS2Inventory({
              ...inventorySpec,
              data: cachedData
            })
          );
        }
      }
      cacheAuthenticatedUserId(user.id);
      sync.syncedAt = new Date(user.syncedAt).getTime();
    }
  }, [user]);

  useEffect(() => {
    updateEconomyLanguage(translation.items);
    reactSetInventory(
      (inventory) =>
        new CS2Inventory({
          ...inventorySpec,
          data: inventory.getData()
        })
    );
  }, [translation.items]);

  const items = useMemo(
    () =>
      (preferences.hideFilters
        ? sortItemsByEquipped
        : inventoryFilter.sortItems)(
        // Inventory Items
        inventory
          .getAll()
          .filter(
            (item) => !preferences.hideFreeItems || !item.isCharmDetachment()
          )
          .map((item) =>
            transform(item, {
              models: rules.inventoryItemEquipHideModel || [],
              types: rules.inventoryItemEquipHideType || []
            })
          ),
        // Default Game Items
        [
          ...getFreeItemsToDisplay(preferences.hideFreeItems),
          ...getCharmDetachmentsToDisplay(inventory, preferences.hideFreeItems)
        ]
      ),
    [
      inventory,
      preferences.hideFreeItems,
      preferences.hideFilters,
      rules.inventoryItemEquipHideModel,
      rules.inventoryItemEquipHideType,
      inventoryFilter.sortItems
    ]
  );

  return (
    <AppContext.Provider
      value={{
        inventory,
        inventoryFilter,
        items,
        translation: translation,
        preferences,
        rules: resolvedRules,
        setInventory,
        user
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
