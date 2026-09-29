import type { Config } from "@react-router/dev/config";

export default {
  // Pure SPA: all data comes from the JSON API worker over fetch, so there is
  // no server bundle, no SSR pass and nothing to prerender. `index.html` is
  // produced by the Layout in app/root.tsx.
  ssr: false,
  prerender: false
} satisfies Config;
