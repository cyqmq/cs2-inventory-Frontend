import type * as languages from "~/translations";

export type SystemTranslationTokens = keyof (typeof languages)["english"];
