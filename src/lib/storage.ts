import aws4 from "aws4";
import https from "https";
import heicConvert from "heic-convert";
import sharp from "sharp";

// Configuration S3 Hetzner depuis les variables d'environnement
// Astro utilise import.meta.env, avec fallback sur process.env pour compatibilité
const S3_REGION = import.meta.env.S3_REGION || process.env.S3_REGION || "hel1";
const S3_ACCESS_KEY =
  import.meta.env.S3_ACCESS_KEY || process.env.S3_ACCESS_KEY || "";
const S3_SECRET_KEY =
  import.meta.env.S3_SECRET_KEY || process.env.S3_SECRET_KEY || "";
const S3_BUCKET =
  import.meta.env.S3_BUCKET || process.env.S3_BUCKET || "primadopu";

// Hetzner utilise le style virtual-hosted: bucket.region.your-objectstorage.com
const S3_HOST = `${S3_BUCKET}.${S3_REGION}.your-objectstorage.com`;

// Formats Apple nécessitant une conversion
const APPLE_FORMATS = ["heic", "heif", "hif"];

// Formats supportés par l'API Gemini
const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "webp"];

/**
 * Signe une requête pour S3 Hetzner
 */
function signRequest(
  method: string,
  path: string,
  body?: Buffer,
  contentType?: string
): { url: string; headers: Record<string, string> } {
  const opts: aws4.Request = {
    host: S3_HOST,
    path: path,
    method: method,
    service: "s3",
    region: S3_REGION,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      // Hetzner S3 requiert UNSIGNED-PAYLOAD pour éviter les erreurs InvalidArgument
      "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
    },
  };

  if (body) {
    opts.headers!["Content-Length"] = body.length.toString();
    // Ne pas passer le body à aws4 pour éviter le calcul du hash
    // On utilise UNSIGNED-PAYLOAD à la place
  }

  const signed = aws4.sign(opts, {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  });

  return {
    url: `https://${S3_HOST}${path}`,
    headers: signed.headers as Record<string, string>,
  };
}

/**
 * Convertit une image HEIC/HEIF en JPEG si nécessaire
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
        quality: 0.92,
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

/**
 * Obtenir le type MIME à partir de l'extension
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
}

/**
 * Upload un buffer vers S3 Hetzner en utilisant https natif
 */
async function uploadToS3(
  s3Key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const path = `/${s3Key}`;
  const { headers } = signRequest("PUT", path, buffer, contentType);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: S3_HOST,
        port: 443,
        path: path,
        method: "PUT",
        headers: headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            console.error("Erreur S3 upload:", res.statusCode, data);
            reject(new Error(`S3 upload failed: ${res.statusCode} - ${data}`));
          }
        });
      }
    );

    req.on("error", (e) => reject(e));
    req.write(buffer);
    req.end();
  });
}

/**
 * Sauvegarde une image sur S3 Hetzner
 * @returns Le chemin S3 de l'image (utilisé comme clé)
 */
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
    const s3Key = `${type}/${filename}`;

    // Upload vers S3
    await uploadToS3(s3Key, buffer, getMimeType(ext));

    if (converted) {
      console.log(`   💾 Sauvegardé sur S3 (converti): ${s3Key}`);
    } else {
      console.log(`   💾 Sauvegardé sur S3: ${s3Key}`);
    }

    // Retourner le chemin S3 (sera utilisé pour construire l'URL)
    return `/${s3Key}`;
  } catch (error) {
    console.error("Erreur upload S3:", error);
    throw error;
  }
}

/**
 * Sauvegarde un buffer directement sur S3 (pour les images générées)
 * @returns Le chemin S3 de l'image
 */
export async function saveBuffer(
  buffer: Buffer,
  filename: string,
  type: "generated" | "references" | "originals"
): Promise<string> {
  try {
    const ext = filename.split(".").pop() || "png";
    const s3Key = `${type}/${filename}`;

    await uploadToS3(s3Key, buffer, getMimeType(ext));

    console.log(`   💾 Sauvegardé sur S3: ${s3Key}`);
    return `/${s3Key}`;
  } catch (error) {
    console.error("Erreur upload S3:", error);
    throw error;
  }
}

/**
 * Récupère une image depuis S3 sous forme de Buffer
 * @param s3Path Le chemin S3 (ex: /references/xxx.jpg)
 */
export async function getImageBuffer(s3Path: string): Promise<Buffer> {
  // Enlever le / initial si présent et /uploads si présent (compatibilité ancien format)
  let s3Key = s3Path.startsWith("/") ? s3Path.slice(1) : s3Path;
  if (s3Key.startsWith("uploads/")) {
    s3Key = s3Key.replace("uploads/", "");
  }
  const path = `/${s3Key}`;

  const { headers } = signRequest("GET", path);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: S3_HOST,
        port: 443,
        path: path,
        method: "GET",
        headers: headers,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          res.on("end", () => resolve(Buffer.concat(chunks)));
        } else {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            console.error(`Erreur lecture S3 ${s3Path}:`, res.statusCode, data);
            reject(new Error(`S3 GET failed: ${res.statusCode}`));
          });
        }
      }
    );

    req.on("error", (e) => {
      console.error(`Erreur lecture S3 ${s3Path}:`, e);
      reject(e);
    });
    req.end();
  });
}

/**
 * Construit l'URL publique S3 pour une image
 * @param s3Path Le chemin S3 (ex: /references/xxx.jpg)
 */
export function getPublicUrl(s3Path: string): string {
  const s3Key = s3Path.startsWith("/") ? s3Path.slice(1) : s3Path;
  // Format Hetzner virtual-hosted style: https://BUCKET.REGION.your-objectstorage.com/KEY
  return `https://${S3_HOST}/${s3Key}`;
}

/**
 * Supprime une image de S3
 * @param s3Path Le chemin S3 (ex: /references/xxx.jpg ou /uploads/references/xxx.jpg)
 */
export async function deleteImage(s3Path: string): Promise<boolean> {
  // Enlever le / initial et /uploads si présent (compatibilité ancien format)
  let s3Key = s3Path.startsWith("/") ? s3Path.slice(1) : s3Path;
  if (s3Key.startsWith("uploads/")) {
    s3Key = s3Key.replace("uploads/", "");
  }

  const path = `/${s3Key}`;
  const { headers } = signRequest("DELETE", path);

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: S3_HOST,
        port: 443,
        path: path,
        method: "DELETE",
        headers: headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (
            res.statusCode &&
            ((res.statusCode >= 200 && res.statusCode < 300) ||
              res.statusCode === 404)
          ) {
            console.log(`   🗑️ Supprimé de S3: ${s3Key}`);
            resolve(true);
          } else {
            console.error(`Erreur suppression S3: ${res.statusCode}`, data);
            resolve(false);
          }
        });
      }
    );

    req.on("error", (e) => {
      console.error(`Erreur suppression S3 ${s3Path}:`, e);
      resolve(false);
    });
    req.end();
  });
}

/**
 * Vérifie si S3 est configuré
 */
export function isS3Configured(): boolean {
  return !!(S3_ACCESS_KEY && S3_SECRET_KEY && S3_BUCKET);
}
