import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";
import { dirname, relative, resolve } from "path";
import { minify_sync } from "terser";
import ts from "typescript";
import { defineConfig } from "vite";

const workerUrl = (process.env.WORKER_URL ?? "http://localhost:8787").replace(
  "//localhost:",
  "//127.0.0.1:"
);

export default defineConfig({
  base: "/",
  server: {
    port: 3000,
    allowedHosts: [".monkeycode-ai.online"],
    // In browser mode the app calls the API through the same origin
    // (entry.client.tsx sets the API URL to window.location.origin), so route
    // the API paths to the local Cloudflare Worker during development.
    proxy: {
      "/api": workerUrl,
      "/sign-in": workerUrl,
      "/healthz": workerUrl
    }
  },
  preview: {
    port: 3000,
    allowedHosts: [".monkeycode-ai.online"],
    // Same-origin API routing for the production preview (`vite preview`).
    proxy: {
      "/api": workerUrl,
      "/sign-in": workerUrl,
      "/healthz": workerUrl
    }
  },
  environments: {
    client: {
      build: {
        sourcemap: process.env.BUILD_SOURCE_MAPS === "true" ? "hidden" : false,
        rolldownOptions: {
          output: {
            sourcemapPathTransform: (source, sourcemapPath) =>
              relative(process.cwd(), resolve(dirname(sourcemapPath), source))
          }
        }
      }
    }
  },
  build: {},
  resolve: {
    tsconfigPaths: true
  },
  plugins: [tailwindcss(), !process.env.VITEST && reactRouter()],
  define: {
    __SPLASH_SCRIPT__: JSON.stringify(
      minify_sync(
        ts.transpileModule(
          readFileSync(resolve(process.cwd(), "app/utils/splash.ts"), {
            encoding: "utf-8"
          }),
          {
            compilerOptions: {
              module: ts.ModuleKind.CommonJS,
              noImplicitUseStrict: true,
              target: ts.ScriptTarget.ES2022
            }
          }
        ).outputText
      ).code
    ),
    __SOURCE_COMMIT__: JSON.stringify(process.env.SOURCE_COMMIT)
  }
});
