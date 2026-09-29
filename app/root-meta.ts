/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { MetaFunction } from "react-router";
import type { ClientInitData } from "./api-client";
import { DEFAULT_APP_NAME } from "./app-defaults";
import { getSystemTranslation } from "./utils/translation";

export function getMetaTitle(key?: string): MetaFunction {
  return function meta({ matches }) {
    const rootData = matches.find((match) => match.id === "root");
    // React Router v8's MetaFunction loader generics serialize a plain
    // interface like `ClientInitData` to `undefined`, so we cast the matched
    // loader data directly instead of leaning on the generic chain.
    const loaderData = rootData?.loaderData as ClientInitData | undefined;
    const appName =
      (loaderData?.rules as Record<string, unknown> | undefined)?.appName ??
      DEFAULT_APP_NAME;
    const pageTitle =
      key !== undefined
        ? getSystemTranslation(
            key,
            (loaderData?.preferences as Record<string, string> | undefined)
              ?.language
          )
        : undefined;
    return [
      { title: `${pageTitle !== undefined ? `${pageTitle} - ` : ""}${appName}` }
    ];
  };
}