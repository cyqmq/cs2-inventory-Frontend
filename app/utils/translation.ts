/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { clientGlobals } from "../globals";

export function getSystemTranslation(key: string, _language?: string) {
  return clientGlobals.systemTranslationMap?.[key];
}
