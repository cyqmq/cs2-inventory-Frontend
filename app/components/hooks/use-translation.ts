/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { clientGlobals } from "~/globals";
import type { SystemTranslationTokens } from "~/translation.server";
import { fetchTranslation } from "~/utils/translation-api";

export function useTranslation({ language }: { language: string }) {
  const [systemMap, setSystemMap] = useState(clientGlobals.systemTranslationMap ?? {});
  const [itemMap, setItemMap] = useState(clientGlobals.itemTranslationMap ?? {});

  function translate(token: SystemTranslationTokens, ...values: string[]) {
    return (
      systemMap[token]?.replace(
        /\{(\d+)\}/g,
        (_, index) => values[Number(index) - 1] ?? ""
      ) ?? ""
    );
  }

  useEffect(() => {
    let cancelled = false;
    fetchTranslation(language)
      .then(({ systemTranslationMap, itemTranslationMap }) => {
        if (cancelled) {
          return;
        }
        clientGlobals.systemTranslationMap = systemTranslationMap;
        clientGlobals.itemTranslationMap = itemTranslationMap;
        setSystemMap(systemTranslationMap);
        setItemMap(itemTranslationMap);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [language]);

  return { system: systemMap, items: itemMap, translate };
}
