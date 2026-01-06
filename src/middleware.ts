import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";
import { isFirstTimeUser } from "./lib/db";

// Routes publiques qui ne nécessitent pas d'authentification
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/legal/(.*)",
  "/api/convert-image", // Conversion d'image pour aperçu
  "/api/images/generated/(.*)", // Images générées publiques pour le partage social
]);

// Routes exclues de la redirection tutoriel
const isExcludedFromTutorialRedirect = createRouteMatcher([
  "/generate",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/legal/(.*)",
  "/api/(.*)",
  "/pricing",
]);

export const onRequest = clerkMiddleware((auth, context) => {
  const { userId } = auth();
  
  // Rediriger les nouveaux utilisateurs vers /generate pour le tutoriel
  if (userId && !isExcludedFromTutorialRedirect(context.request)) {
    try {
      const isFirstTime = isFirstTimeUser(userId);
      if (isFirstTime) {
        return context.redirect("/generate");
      }
    } catch (e) {
      // En cas d'erreur DB, on continue normalement
      console.error("[Middleware] Error checking first time user:", e);
    }
  }
  
  // Les routes publiques ne nécessitent pas de protection
  if (isPublicRoute(context.request)) {
    return;
  }

  // Pour les autres routes, l'authentification est gérée par les pages elles-mêmes
});
