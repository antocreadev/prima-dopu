import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import { frFR } from "@clerk/localizations";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

import sentry from "@sentry/astro";

export default defineConfig({
  integrations: [
    clerk({
      localization: frFR,
    }),
    react(),
    sentry({
      project: "primadopu-astro",
      org: "primadopu",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourceMapsUploadOptions: {
        enabled:
          process.env.NODE_ENV === "production" &&
          !!process.env.SENTRY_AUTH_TOKEN,
      },
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
      },
    }),
  ],
  adapter: node({ mode: "standalone" }),
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },
});
