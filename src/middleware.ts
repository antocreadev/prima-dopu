import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";

// Routes publiques qui ne nécessitent pas d'authentification
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/legal/(.*)",
  "/api/convert-image", // Conversion d'image pour aperçu
]);

export const onRequest = clerkMiddleware((auth, context) => {
  // Les routes publiques ne nécessitent pas de protection
  if (isPublicRoute(context.request)) {
    return;
  }

  // Pour les autres routes, l'authentification est gérée par les pages elles-mêmes
});
