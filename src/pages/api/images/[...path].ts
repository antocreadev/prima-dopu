import type { APIRoute } from "astro";
import { getImageBuffer } from "../../../lib/storage";
import { isAdminUser } from "../../../lib/plans";

export const GET: APIRoute = async ({ params, locals }) => {
  const imagePath = params.path;

  if (!imagePath) {
    return new Response("Image non trouvée", { status: 404 });
  }

  // Sécurité : empêcher les path traversal
  if (imagePath.includes("..")) {
    return new Response("Chemin invalide", { status: 400 });
  }

  // Déterminer le type d'image depuis le chemin
  // Format: {type}/{userId}-{timestamp}-{uuid}.{ext}
  const pathParts = imagePath.split("/");
  const imageType = pathParts[0]; // "generated", "originals", ou "references"

  // Les images générées sont publiques (pour le partage social)
  const isPublicImage = imageType === "generated";

  if (!isPublicImage) {
    // Pour les images privées (originals, references), vérifier l'authentification
    const auth = locals.auth();
    const userId = auth.userId;

    if (!userId) {
      return new Response("Non authentifié", { status: 401 });
    }

    // Les admins ont accès à toutes les images (pour le debug)
    const isAdmin = isAdminUser(userId);

    // Vérifier que l'utilisateur a accès à cette image (sauf admin)
    if (!isAdmin && pathParts.length >= 2) {
      const filename = pathParts[pathParts.length - 1];
      const fileUserIdMatch = filename.match(/^(user_[^-]+)/);
      if (fileUserIdMatch) {
        const fileUserId = fileUserIdMatch[1];
        if (fileUserId !== userId) {
          console.warn(
            `🚫 Accès refusé: ${userId} tente d'accéder à l'image de ${fileUserId}`
          );
          return new Response("Accès non autorisé", { status: 403 });
        }
      }
    }
  }

  // Servir l'image depuis S3 via proxy (bucket privé)
  try {
    // S'assurer que le chemin commence par /
    const s3Path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    const imageBuffer = await getImageBuffer(s3Path);

    // Déterminer le type MIME
    const ext = imagePath.toLowerCase().split(".").pop();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const contentType = mimeTypes[ext || ""] || "application/octet-stream";

    return new Response(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Erreur lecture image S3:", error);
    return new Response("Image non trouvée", { status: 404 });
  }
};
