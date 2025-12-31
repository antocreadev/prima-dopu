import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import { frFR } from "@clerk/localizations";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [
    clerk({
      localization: frFR,
    }),
  ],
  adapter: node({ mode: "standalone" }),
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },
});