import type { APIRoute } from "astro";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const GET: APIRoute = async ({ params }) => {
  const imagePath = params.path;

  if (!imagePath) {
    return new Response("Image non trouvée", { status: 404 });
  }

  // Sécurité : empêcher les path traversal
  if (imagePath.includes("..")) {
    return new Response("Chemin invalide", { status: 400 });
  }

  const fullPath = join(process.cwd(), "public", "uploads", imagePath);

  if (!existsSync(fullPath)) {
    return new Response("Image non trouvée", { status: 404 });
  }

  try {
    const imageBuffer = readFileSync(fullPath);

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

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Erreur lecture image:", error);
    return new Response("Erreur serveur", { status: 500 });
  }
};
