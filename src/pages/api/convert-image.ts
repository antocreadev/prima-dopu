import type { APIRoute } from "astro";
import heicConvert from "heic-convert";

/**
 * Endpoint pour convertir les images HEIC/HEIF en JPEG
 * Utilisé pour l'aperçu dans le navigateur (qui ne supporte pas ces formats)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "Aucun fichier fourni" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const ext = file.name.toLowerCase().split(".").pop() || "";

    // Formats Apple nécessitant conversion
    const appleFormats = ["heic", "heif", "hif"];

    if (appleFormats.includes(ext)) {
      console.log(`🔄 Conversion ${ext.toUpperCase()} → JPEG pour aperçu...`);

      const convertedBuffer = await heicConvert({
        buffer: Buffer.from(arrayBuffer),
        format: "JPEG",
        quality: 0.85,
      });

      console.log(
        `✓ Converti: ${(convertedBuffer.byteLength / 1024).toFixed(0)} KB`
      );

      return new Response(new Uint8Array(convertedBuffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "max-age=3600",
        },
      });
    }

    // Pour les autres formats, retourner tel quel
    return new Response(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": file.type || "image/jpeg",
        "Cache-Control": "max-age=3600",
      },
    });
  } catch (error) {
    console.error("Erreur conversion image:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la conversion de l'image" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
