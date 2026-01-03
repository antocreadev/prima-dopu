import type { APIRoute } from "astro";
import { getImageBuffer } from "../../../lib/storage";

export const GET: APIRoute = async ({ params }) => {
  const imagePath = params.path;

  if (!imagePath) {
    return new Response("Image non trouvée", { status: 404 });
  }

  // Sécurité : empêcher les path traversal
  if (imagePath.includes("..")) {
    return new Response("Chemin invalide", { status: 400 });
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
