/*---------------------------------------------------------------------------------------------
 *  CS2 Inventory Simulator — on-bundle translation loader
 *
 *  The original server served /translations/<lang>.json so the client could fetch
 *  translations on demand. This worker API no longer ships them, so the frontend
 *  resolves both maps from its own bundle:
 *
 *    - system translations: app/translations/<lang>.ts (UI strings). These are
 *      small (a few KB each), so all 29 are bundled statically.
 *    - item translations:   app/translations-items/<lang>.ts (cs2-lib re-exports).
 *      Each is a big chunk (hundreds of KB), so import.meta.glob splits them into
 *      lazy chunks that load on demand.
 *
 *  Language modules export the language under its own name (e.g. `english`),
 *  matching the original `{ systemTranslationMap, itemTranslationMap }` shape.
 *--------------------------------------------------------------------------------------------*/

import type { CS2ItemTranslationByLanguage } from "@ianlucas/cs2-lib";
import * as systemTranslations from "../translations";

const itemTranslationModules = import.meta.glob("../translations-items/*.ts");

export async function fetchTranslation(language: string) {
  const systemTranslationMap = (
    systemTranslations as Record<string, Record<string, string>>
  )[language];
  if (systemTranslationMap === undefined) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const itemLoader = itemTranslationModules[`../translations-items/${language}.ts`];
  if (itemLoader === undefined) {
    throw new Error(`Unsupported language: ${language}`);
  }
  const itemModule = (await itemLoader()) as {
    [name: string]: CS2ItemTranslationByLanguage[string];
  };
  return {
    systemTranslationMap,
    itemTranslationMap: itemModule[language] ?? {}
  };
}