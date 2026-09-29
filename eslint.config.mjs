// @ts-check

import eslint from "@eslint/js";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["build/", ".react-router/", "dist-electron/"] },
  eslint.configs.recommended,
  tseslint.configs.strict,
  {
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { caughtErrors: "none", argsIgnorePattern: "^_" }
      ],
      "prefer-const": ["error", { destructuring: "all" }],
      "@typescript-eslint/no-dynamic-delete": "off"
    }
  },
  {
    // Node build/maintenance scripts. They are plain CommonJS/ESM, not part of
    // the browser bundle, so the TS-flavoured import rule does not apply and
    // they need the Node globals that the browser config leaves out.
    files: ["scripts/**"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        console: "readonly",
        module: "writable",
        process: "readonly",
        require: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss
    },
    rules: {
      "better-tailwindcss/enforce-canonical-classes": "error",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off"
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/tailwind.css"
      }
    }
  }
);
