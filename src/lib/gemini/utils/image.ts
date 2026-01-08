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

/**
 * Informations pour une zone de masque annotée
 */
export interface MaskZoneInfo {
  maskImage: PreparedImage;
  referenceImage: PreparedImage;
  referenceName: string;
  instruction: string;
  referenceIndex: number;
}

/**
 * Crée un masque combiné où la zone blanche du masque contient la référence
 * et la zone noire contient l'image originale
 */
export async function createCombinedMaskImage(
  originalImage: PreparedImage,
  maskImage: PreparedImage,
  referenceImage: PreparedImage
): Promise<PreparedImage> {
  console.log("   🎭 Création du masque combiné...");

  try {
    // Décoder les images depuis base64
    const originalBuffer = Buffer.from(originalImage.base64, "base64");
    const maskBuffer = Buffer.from(maskImage.base64, "base64");
    const referenceBuffer = Buffer.from(referenceImage.base64, "base64");

    // Obtenir les dimensions de l'image originale
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

    // Créer le masque combiné :
    // Zone BLANCHE = RÉFÉRENCE (montrer ce qui sera appliqué)
    // Zone NOIRE = IMAGE ORIGINALE (contexte)
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

    console.log(`   ✓ Masque combiné créé: ${(finalBuffer.length / 1024).toFixed(0)} KB`);

    return {
      base64: finalBuffer.toString("base64"),
      mimeType: "image/png",
      sizeBytes: finalBuffer.length,
    };
  } catch (error) {
    console.error("   ❌ Erreur création masque combiné:", error);
    throw error;
  }
}

/**
 * Couleurs pour les annotations de chaque zone (palette distincte)
 */
const ANNOTATION_COLORS = [
  { r: 255, g: 0, b: 0 },     // Rouge
  { r: 0, g: 150, b: 255 },   // Bleu
  { r: 0, g: 200, b: 0 },     // Vert
  { r: 255, g: 150, b: 0 },   // Orange
  { r: 200, g: 0, b: 255 },   // Violet
  { r: 0, g: 200, b: 200 },   // Cyan
];

/**
 * Trouve le centre de gravité d'une zone blanche dans un masque
 */
async function findMaskCenter(
  maskBuffer: Buffer,
  width: number,
  height: number
): Promise<{ x: number; y: number }> {
  let sumX = 0, sumY = 0, count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (maskBuffer[idx] > 127) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  if (count === 0) {
    return { x: width / 2, y: height / 2 };
  }

  return { x: Math.round(sumX / count), y: Math.round(sumY / count) };
}

/**
 * Crée une image annotée avec toutes les zones fusionnées et des annotations
 * Fusionne TOUS les masques en UN SEUL avec des annotations visuelles
 */
export async function createMergedAnnotatedMask(
  originalImage: PreparedImage,
  zones: MaskZoneInfo[]
): Promise<PreparedImage> {
  console.log(`   🎭 Fusion de ${zones.length} masque(s) avec annotations...`);

  try {
    const originalBuffer = Buffer.from(originalImage.base64, "base64");
    const originalMetadata = await sharp(originalBuffer).metadata();
    const { width, height } = originalMetadata;

    if (!width || !height) {
      throw new Error("Impossible de lire les dimensions de l'image");
    }

    // Charger l'image originale en RGBA
    const originalRGBA = await sharp(originalBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Buffer final pour l'image fusionnée
    const mergedBuffer = Buffer.alloc(width * height * 4);
    
    // Copier l'image originale comme base
    for (let i = 0; i < width * height; i++) {
      const imgIdx = i * 4;
      mergedBuffer[imgIdx] = originalRGBA[imgIdx];
      mergedBuffer[imgIdx + 1] = originalRGBA[imgIdx + 1];
      mergedBuffer[imgIdx + 2] = originalRGBA[imgIdx + 2];
      mergedBuffer[imgIdx + 3] = 255;
    }

    // Stocker les infos pour les annotations SVG
    const annotationData: Array<{
      centerX: number;
      centerY: number;
      color: { r: number; g: number; b: number };
      label: string;
      instruction: string;
    }> = [];

    // Appliquer chaque masque avec sa référence
    for (let zoneIdx = 0; zoneIdx < zones.length; zoneIdx++) {
      const zone = zones[zoneIdx];
      const color = ANNOTATION_COLORS[zoneIdx % ANNOTATION_COLORS.length];

      const maskBuffer = Buffer.from(zone.maskImage.base64, "base64");
      const referenceBuffer = Buffer.from(zone.referenceImage.base64, "base64");

      // Redimensionner le masque
      const maskResized = await sharp(maskBuffer)
        .resize(width, height, { fit: "fill" })
        .greyscale()
        .raw()
        .toBuffer();

      // Redimensionner la référence
      const referenceResized = await sharp(referenceBuffer)
        .resize(width, height, { fit: "cover", position: "center" })
        .ensureAlpha()
        .raw()
        .toBuffer();

      // Trouver le centre du masque pour l'annotation
      const center = await findMaskCenter(maskResized, width, height);

      // Appliquer la référence dans la zone du masque
      for (let i = 0; i < width * height; i++) {
        const imgIdx = i * 4;
        const maskValue = maskResized[i];

        if (maskValue > 127) {
          // Zone blanche = appliquer la RÉFÉRENCE
          mergedBuffer[imgIdx] = referenceResized[imgIdx];
          mergedBuffer[imgIdx + 1] = referenceResized[imgIdx + 1];
          mergedBuffer[imgIdx + 2] = referenceResized[imgIdx + 2];
          mergedBuffer[imgIdx + 3] = 255;
        }
      }

      // Dessiner un contour coloré autour de la zone
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const maskValue = maskResized[idx];

          // Détecter les bords (pixels blancs avec un voisin noir)
          if (maskValue > 127) {
            const isEdge = 
              (x > 0 && maskResized[idx - 1] <= 127) ||
              (x < width - 1 && maskResized[idx + 1] <= 127) ||
              (y > 0 && maskResized[idx - width] <= 127) ||
              (y < height - 1 && maskResized[idx + width] <= 127);

            if (isEdge) {
              // Dessiner un contour épais (3 pixels)
              for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = (ny * width + nx) * 4;
                    mergedBuffer[nIdx] = color.r;
                    mergedBuffer[nIdx + 1] = color.g;
                    mergedBuffer[nIdx + 2] = color.b;
                    mergedBuffer[nIdx + 3] = 255;
                  }
                }
              }
            }
          }
        }
      }

      // Stocker les données pour l'annotation
      annotationData.push({
        centerX: center.x,
        centerY: center.y,
        color,
        label: zone.referenceName || `Ref ${zone.referenceIndex + 1}`,
        instruction: zone.instruction,
      });
    }

    // Convertir le buffer en image
    let mergedImage = await sharp(mergedBuffer, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();

    // Créer les annotations SVG
    const svgAnnotations = createAnnotationsSVG(annotationData, width, height);

    // Superposer les annotations SVG
    mergedImage = await sharp(mergedImage)
      .composite([
        {
          input: Buffer.from(svgAnnotations),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    console.log(`   ✓ Masque fusionné annoté créé: ${(mergedImage.length / 1024).toFixed(0)} KB`);
    console.log(`   📍 ${annotationData.length} zone(s) annotée(s)`);

    return {
      base64: mergedImage.toString("base64"),
      mimeType: "image/png",
      sizeBytes: mergedImage.length,
    };
  } catch (error) {
    console.error("   ❌ Erreur création masque fusionné:", error);
    throw error;
  }
}

/**
 * Crée le SVG des annotations (flèches, labels, instructions)
 */
function createAnnotationsSVG(
  annotations: Array<{
    centerX: number;
    centerY: number;
    color: { r: number; g: number; b: number };
    label: string;
    instruction: string;
  }>,
  width: number,
  height: number
): string {
  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
    </filter>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="white" stroke="black" stroke-width="0.5"/>
    </marker>
  </defs>`;

  for (let i = 0; i < annotations.length; i++) {
    const ann = annotations[i];
    const { r, g, b } = ann.color;
    const colorStr = `rgb(${r},${g},${b})`;

    // Position du label (décalé vers le haut-droite ou autre selon la position)
    let labelX = ann.centerX + 60;
    let labelY = ann.centerY - 40;

    // Ajuster si le label sort de l'image
    if (labelX + 200 > width) labelX = ann.centerX - 200;
    if (labelY < 50) labelY = ann.centerY + 80;
    if (labelY + 60 > height) labelY = height - 70;

    // Numéro dans un cercle au centre
    svgContent += `
    <circle cx="${ann.centerX}" cy="${ann.centerY}" r="25" fill="${colorStr}" stroke="white" stroke-width="3" filter="url(#shadow)"/>
    <text x="${ann.centerX}" y="${ann.centerY + 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">${i + 1}</text>`;

    // Flèche du label vers le centre
    svgContent += `
    <line x1="${labelX}" y1="${labelY + 15}" x2="${ann.centerX + 30}" y2="${ann.centerY}" stroke="white" stroke-width="3" marker-end="url(#arrowhead)"/>
    <line x1="${labelX}" y1="${labelY + 15}" x2="${ann.centerX + 30}" y2="${ann.centerY}" stroke="${colorStr}" stroke-width="2"/>`;

    // Box du label avec fond
    const labelWidth = Math.max(ann.label.length * 10, ann.instruction.length * 7, 150);
    svgContent += `
    <rect x="${labelX - 5}" y="${labelY - 25}" width="${labelWidth + 10}" height="65" rx="8" fill="rgba(0,0,0,0.8)" stroke="${colorStr}" stroke-width="2"/>`;

    // Texte du label
    svgContent += `
    <text x="${labelX + 5}" y="${labelY - 5}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${colorStr}">[${i + 1}] ${escapeXml(ann.label)}</text>
    <text x="${labelX + 5}" y="${labelY + 15}" font-family="Arial, sans-serif" font-size="12" fill="white">${escapeXml(truncateText(ann.instruction, 30))}</text>
    <text x="${labelX + 5}" y="${labelY + 32}" font-family="Arial, sans-serif" font-size="10" fill="#aaa">→ Appliquer ici</text>`;
  }

  svgContent += `</svg>`;
  return svgContent;
}

/**
 * Échappe les caractères spéciaux XML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Tronque le texte si trop long
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}
