import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import { frFR } from "@clerk/localizations";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

export default defineConfig({
  integrations: [clerk({
    localization: frFR,
  }), react()],
  adapter: node({ mode: "standalone" }),
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },
});