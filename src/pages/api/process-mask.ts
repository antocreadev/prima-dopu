// ============================================================================
// API PROCESS-MASK - Traitement des masques pour la génération
// ============================================================================
// Cette API crée le "masque spécial combiné" où :
// - La zone NOIRE du masque original est remplacée par l'image de référence
// - Cela montre à l'IA "cette référence va ICI"
// ============================================================================

import type { APIRoute } from "astro";
import sharp from "sharp";

export interface ProcessMaskResult {
  /** Masque combiné en base64 (référence visible dans la zone noire) */
  combinedMaskBase64: string;
  /** Masque noir/blanc original en base64 */
  originalMaskBase64: string;
  /** Dimensions du masque */
  dimensions: { width: number; height: number };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const originalImageFile = formData.get("originalImage") as File;
    const maskFile = formData.get("mask") as File;
    const referenceFile = formData.get("reference") as File;

    if (!originalImageFile || !maskFile || !referenceFile) {
      return new Response(
        JSON.stringify({ error: "Image originale, masque et référence requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convertir les fichiers en buffers
    const originalBuffer = Buffer.from(await originalImageFile.arrayBuffer());
    const maskBuffer = Buffer.from(await maskFile.arrayBuffer());
    const referenceBuffer = Buffer.from(await referenceFile.arrayBuffer());

    // Obtenir les métadonnées de l'image originale
    const originalMetadata = await sharp(originalBuffer).metadata();
    const { width, height } = originalMetadata;

    if (!width || !height) {
      return new Response(
        JSON.stringify({ error: "Impossible de lire les dimensions de l'image" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Redimensionner le masque aux dimensions de l'image originale si nécessaire
    const maskResized = await sharp(maskBuffer)
      .resize(width, height, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer();

    // Redimensionner la référence aux dimensions de l'image originale
    // On utilise "cover" pour remplir toute la zone sans déformation
    const referenceResized = await sharp(referenceBuffer)
      .resize(width, height, { fit: "cover", position: "center" })
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Charger l'image originale en RGBA
    const originalRGBA = await sharp(originalBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Créer le masque combiné :
    // - Zone BLANCHE (masque > 127) = image originale visible (zone à modifier)
    // - Zone NOIRE (masque <= 127) = image originale (contexte)
    // MAIS pour le "masque spécial combiné" on veut :
    // - Zone BLANCHE = RÉFÉRENCE (montrer ce qui sera appliqué)
    // - Zone NOIRE = image originale (contexte)
    
    const combinedBuffer = Buffer.alloc(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      const imgIdx = i * 4;
      const maskValue = maskResized[i];

      // Si le masque est BLANC (zone sélectionnée) → mettre la RÉFÉRENCE
      // Si le masque est NOIR (contexte) → garder l'image originale
      if (maskValue > 127) {
        // Zone blanche = RÉFÉRENCE
        combinedBuffer[imgIdx] = referenceResized[imgIdx];       // R
        combinedBuffer[imgIdx + 1] = referenceResized[imgIdx + 1]; // G
        combinedBuffer[imgIdx + 2] = referenceResized[imgIdx + 2]; // B
        combinedBuffer[imgIdx + 3] = 255;                          // A
      } else {
        // Zone noire = IMAGE ORIGINALE
        combinedBuffer[imgIdx] = originalRGBA[imgIdx];       // R
        combinedBuffer[imgIdx + 1] = originalRGBA[imgIdx + 1]; // G
        combinedBuffer[imgIdx + 2] = originalRGBA[imgIdx + 2]; // B
        combinedBuffer[imgIdx + 3] = 255;                      // A
      }
    }

    // Convertir le buffer en PNG
    const combinedImage = await sharp(combinedBuffer, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();

    // Convertir le masque original en PNG propre
    const cleanMask = await sharp(maskBuffer)
      .resize(width, height, { fit: "fill" })
      .png()
      .toBuffer();

    const result: ProcessMaskResult = {
      combinedMaskBase64: combinedImage.toString("base64"),
      originalMaskBase64: cleanMask.toString("base64"),
      dimensions: { width, height },
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors du traitement du masque:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors du traitement du masque" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * Version pour utilisation côté serveur (dans generate-stream)
 */
export async function createCombinedMask(
  originalBuffer: Buffer,
  maskBuffer: Buffer,
  referenceBuffer: Buffer
): Promise<{ combinedBuffer: Buffer; width: number; height: number }> {
  // Obtenir les métadonnées de l'image originale
  const originalMetadata = await sharp(originalBuffer).metadata();
  const { width, height } = originalMetadata;

  if (!width || !height) {
    throw new Error("Impossible de lire les dimensions de l'image");
  }

  // Redimensionner le masque aux dimensions de l'image originale
  const maskResized = await sharp(maskBuffer)
    .resize(width, height, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();

  // Redimensionner la référence aux dimensions de l'image originale
  const referenceResized = await sharp(referenceBuffer)
    .resize(width, height, { fit: "cover", position: "center" })
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Charger l'image originale en RGBA
  const originalRGBA = await sharp(originalBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Créer le masque combiné
  const combinedBuffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const imgIdx = i * 4;
    const maskValue = maskResized[i];

    if (maskValue > 127) {
      // Zone blanche = RÉFÉRENCE
      combinedBuffer[imgIdx] = referenceResized[imgIdx];
      combinedBuffer[imgIdx + 1] = referenceResized[imgIdx + 1];
      combinedBuffer[imgIdx + 2] = referenceResized[imgIdx + 2];
      combinedBuffer[imgIdx + 3] = 255;
    } else {
      // Zone noire = IMAGE ORIGINALE
      combinedBuffer[imgIdx] = originalRGBA[imgIdx];
      combinedBuffer[imgIdx + 1] = originalRGBA[imgIdx + 1];
      combinedBuffer[imgIdx + 2] = originalRGBA[imgIdx + 2];
      combinedBuffer[imgIdx + 3] = 255;
    }
  }

  // Convertir en PNG
  const finalBuffer = await sharp(combinedBuffer, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  return { combinedBuffer: finalBuffer, width, height };
}

/**
 * Crée un masque aperçu (image originale visible à travers le masque)
 */
export async function createPreviewMask(
  originalBuffer: Buffer,
  maskBuffer: Buffer
): Promise<Buffer> {
  const originalMetadata = await sharp(originalBuffer).metadata();
  const { width, height } = originalMetadata;

  if (!width || !height) {
    throw new Error("Impossible de lire les dimensions de l'image");
  }

  // Redimensionner le masque
  const maskResized = await sharp(maskBuffer)
    .resize(width, height, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();

  // Charger l'image originale en RGBA
  const originalRGBA = await sharp(originalBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Créer l'aperçu : zone blanche = original visible, zone noire = noir
  const previewBuffer = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const imgIdx = i * 4;
    const maskValue = maskResized[i];

    if (maskValue > 127) {
      // Zone blanche = IMAGE ORIGINALE visible
      previewBuffer[imgIdx] = originalRGBA[imgIdx];
      previewBuffer[imgIdx + 1] = originalRGBA[imgIdx + 1];
      previewBuffer[imgIdx + 2] = originalRGBA[imgIdx + 2];
      previewBuffer[imgIdx + 3] = 255;
    } else {
      // Zone noire = NOIR
      previewBuffer[imgIdx] = 0;
      previewBuffer[imgIdx + 1] = 0;
      previewBuffer[imgIdx + 2] = 0;
      previewBuffer[imgIdx + 3] = 255;
    }
  }

  return sharp(previewBuffer, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();
}
