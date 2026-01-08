// ============================================================================
// UTILITAIRES POUR LE TRAITEMENT D'IMAGES
// ============================================================================

import heicConvert from "heic-convert";
import sharp from "sharp";
import { getImageBuffer } from "../../storage";
import { APPLE_FORMATS, MIME_TYPES, GENERATION_CONFIG } from "../config";
import type { PreparedImage } from "../types";

/**
 * Obtient le type MIME d'un fichier basé sur son extension
 */
export function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split(".").pop();
  return MIME_TYPES[ext || ""] || "image/jpeg";
}

/**
 * Pause asynchrone
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Prépare une image pour l'API Gemini
 * - Lit l'image depuis S3
 * - Convertit les formats Apple (HEIC, HEIF) en JPEG
 * - Optimise les images trop volumineuses (>4MB)
 */
export async function prepareImageForAPI(
  imagePath: string
): Promise<PreparedImage> {
  const ext = imagePath.toLowerCase().split(".").pop() || "";
  let buffer: Buffer;

  try {
    buffer = await getImageBuffer(imagePath);
  } catch (error: any) {
    console.error(`Erreur lecture image S3: ${imagePath}`, error);
    throw new Error(
      `Image introuvable sur S3: ${imagePath}. ${error?.message || ""}`
    );
  }

  let mimeType = getMimeType(imagePath);

  // Conversion des formats Apple (HEIC, HEIF) avec heic-convert
  if (APPLE_FORMATS.includes(ext)) {
    console.log(`   🔄 Conversion ${ext.toUpperCase()} → JPEG pour API...`);
    try {
      const converted = await heicConvert({
        buffer: buffer,
        format: "JPEG",
        quality: 0.9,
      });
      buffer = Buffer.from(converted);
      mimeType = "image/jpeg";
      console.log(
        `   ✓ Converti pour API: ${(buffer.length / 1024).toFixed(0)} KB`
      );
    } catch (error) {
      console.error(`   ❌ Erreur conversion ${ext}:`, error);
      throw new Error(
        `Impossible de convertir ${ext.toUpperCase()}. Format non supporté.`
      );
    }
  }

  // Optimisation si l'image est trop volumineuse (>4MB) avec sharp
  if (buffer.length > GENERATION_CONFIG.maxImageSizeBytes) {
    console.log(
      `   📐 Image trop volumineuse (${(buffer.length / 1024 / 1024).toFixed(
        1
      )}MB), optimisation...`
    );
    try {
      buffer = Buffer.from(
        await sharp(buffer)
          .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
      );
      mimeType = "image/jpeg";
      console.log(`   ✓ Optimisé: ${(buffer.length / 1024).toFixed(0)} KB`);
    } catch (error) {
      console.warn(
        `   ⚠️ Optimisation échouée, utilisation de l'image originale`
      );
    }
  }

  return {
    base64: buffer.toString("base64"),
    mimeType,
    sizeBytes: buffer.length,
  };
}
