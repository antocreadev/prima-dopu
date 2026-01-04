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
    }),
  ],
  adapter: node({ mode: "standalone" }),
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },
});
