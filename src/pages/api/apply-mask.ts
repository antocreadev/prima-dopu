import type { APIRoute } from "astro";
import sharp from "sharp";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const maskFile = formData.get("mask") as File;

    if (!imageFile || !maskFile) {
      return new Response(JSON.stringify({ error: "Image et masque requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convertir les fichiers en buffers
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const maskBuffer = Buffer.from(await maskFile.arrayBuffer());

    // Charger l'image et le masque avec sharp
    const image = sharp(imageBuffer);
    const mask = sharp(maskBuffer);

    // Obtenir les métadonnées de l'image
    const imageMetadata = await image.metadata();
    const { width, height } = imageMetadata;

    if (!width || !height) {
      return new Response(JSON.stringify({ error: "Impossible de lire les dimensions de l'image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier que le masque a les mêmes dimensions que l'image
    const maskMetadata = await mask.metadata();
    if (maskMetadata.width !== width || maskMetadata.height !== height) {
      console.warn(`Masque (${maskMetadata.width}x${maskMetadata.height}) vs Image (${width}x${height}) - dimensions différentes`);
    }

    // Convertir le masque en niveaux de gris (1 canal) pour l'utiliser comme alpha
    const maskAlpha = await mask
      .greyscale()
      .raw()
      .toBuffer();

    // Convertir l'image en RGBA
    const imageRGBA = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Créer un nouveau buffer avec le masque appliqué comme alpha
    const resultBuffer = Buffer.alloc(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const imgIdx = i * 4;
      const maskIdx = i;
      
      // Récupérer la valeur du masque (0-255)
      const maskValue = maskAlpha[maskIdx];
      
      // Si le masque est blanc (255), on garde l'image, sinon noir
      if (maskValue > 127) {
        resultBuffer[imgIdx] = imageRGBA[imgIdx];       // R
        resultBuffer[imgIdx + 1] = imageRGBA[imgIdx + 1]; // G
        resultBuffer[imgIdx + 2] = imageRGBA[imgIdx + 2]; // B
        resultBuffer[imgIdx + 3] = 255;                   // A
      } else {
        resultBuffer[imgIdx] = 0;     // R
        resultBuffer[imgIdx + 1] = 0; // G
        resultBuffer[imgIdx + 2] = 0; // B
        resultBuffer[imgIdx + 3] = 255; // A (opaque noir)
      }
    }

    // Convertir le buffer raw en PNG
    const finalImage = await sharp(resultBuffer, {
      raw: {
        width,
        height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    return new Response(new Uint8Array(finalImage), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "attachment; filename=masked-preview.png",
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'application du masque:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors du traitement de l'image" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
