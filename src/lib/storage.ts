import { writeFileSync, mkdirSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import heicConvert from "heic-convert";
import sharp from "sharp";

// Utiliser process.cwd() pour pointer vers la racine du projet
const UPLOADS_DIR = join(process.cwd(), "public/uploads");

// Formats Apple nécessitant une conversion
const APPLE_FORMATS = ["heic", "heif", "hif"];

// Formats supportés par l'API Gemini
const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "webp"];

// Créer le dossier uploads s'il n'existe pas
try {
  mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {}

/**
 * Convertit une image HEIC/HEIF en JPEG si nécessaire
 * Utilise heic-convert pour les formats Apple (car sharp peut ne pas avoir le support HEIF)
 * Retourne le buffer converti et la nouvelle extension
 */
async function convertImageIfNeeded(
  buffer: Buffer,
  originalExt: string
): Promise<{ buffer: Buffer; ext: string; converted: boolean }> {
  const extLower = originalExt.toLowerCase();

  // Si c'est un format Apple, convertir en JPEG avec heic-convert
  if (APPLE_FORMATS.includes(extLower)) {
    console.log(`   🔄 Conversion ${extLower.toUpperCase()} → JPEG...`);
    try {
      const converted = await heicConvert({
        buffer: buffer,
        format: "JPEG",
        quality: 0.92, // Haute qualité
      });
      const convertedBuffer = Buffer.from(converted);
      console.log(
        `   ✓ Converti: ${(buffer.length / 1024).toFixed(0)} KB → ${(
          convertedBuffer.length / 1024
        ).toFixed(0)} KB`
      );
      return { buffer: convertedBuffer, ext: "jpg", converted: true };
    } catch (error) {
      console.error(`   ❌ Erreur conversion HEIC:`, error);
      throw new Error(
        `Impossible de convertir le fichier ${extLower.toUpperCase()}. Veuillez utiliser un format JPEG ou PNG.`
      );
    }
  }

  // Si c'est déjà un format supporté, retourner tel quel
  if (SUPPORTED_FORMATS.includes(extLower)) {
    return { buffer, ext: extLower, converted: false };
  }

  // Format inconnu - tenter une conversion en JPEG via sharp
  console.log(`   ⚠️ Format inconnu (${extLower}), tentative de conversion...`);
  try {
    const convertedBuffer = await sharp(buffer)
      .jpeg({ quality: 90 })
      .toBuffer();
    return {
      buffer: Buffer.from(convertedBuffer),
      ext: "jpg",
      converted: true,
    };
  } catch {
    throw new Error(`Format d'image non supporté: ${extLower}`);
  }
}

// Créer le dossier uploads s'il n'existe pas
try {
  mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {}

export async function saveImage(
  file: File,
  userId: string,
  type: "references" | "originals"
): Promise<string> {
  try {
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const originalExt = file.name.split(".").pop() || "jpg";

    // Convertir si nécessaire (HEIC, HEIF, etc.)
    const { buffer, ext, converted } = await convertImageIfNeeded(
      originalBuffer,
      originalExt
    );

    const filename = `${userId}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const subDir = join(UPLOADS_DIR, type);

    mkdirSync(subDir, { recursive: true });

    const filePath = join(subDir, filename);
    writeFileSync(filePath, buffer);

    if (converted) {
      console.log(`   💾 Sauvegardé (converti): ${filename}`);
    }

    // Retourner le chemin relatif pour l'URL
    return `/uploads/${type}/${filename}`;
  } catch (error) {
    throw error;
  }
}

export function getAbsolutePath(relativePath: string): string {
  return join(process.cwd(), "public", relativePath);
}

export function deleteImage(relativePath: string): boolean {
  try {
    const absolutePath = getAbsolutePath(relativePath);
    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
