// ============================================================================
// AGENT GÉNÉRATEUR - GÉNÉRATION D'IMAGE AVEC NANO BANANA PRO
// ============================================================================

import { GoogleGenAI } from "@google/genai";
import { saveBuffer } from "../../storage";
import { MODELS, IMAGE_CONFIG } from "../config";
import type { PreparedImage } from "../types";

// Client AI
const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.AI_GOOGLE_API_KEY || process.env.AI_GOOGLE_API_KEY || "",
});

/**
 * Résultat de la génération
 */
export interface GeneratorResult {
  imagePath: string;
  description: string;
  thoughtCount: number;
}

/**
 * Agent Générateur - Génère l'image avec Nano Banana Pro
 * @param originalImage - Image originale
 * @param referenceImages - Images de référence (matériaux/objets)
 * @param prompt - Prompt de génération
 * @param outputDir - Répertoire de sortie
 * @param generationId - ID de la génération
 * @param combinedMaskImages - Masques combinés optionnels (référence dans zone sélectionnée)
 */
export async function generateWithNanoBanana(
  originalImage: PreparedImage,
  referenceImages: PreparedImage[],
  prompt: string,
  outputDir: string,
  generationId: string,
  combinedMaskImages?: (PreparedImage | null)[]
): Promise<GeneratorResult> {
  console.log(
    "   🎨 Agent Générateur: Appel à Nano Banana Pro (gemini-3-pro-image-preview)..."
  );
  console.log(`   📝 Prompt: ${prompt.length} caractères`);
  console.log(
    `   🖼️  Config: ${IMAGE_CONFIG.imageSize} @ ${IMAGE_CONFIG.aspectRatio}`
  );

  // Afficher le prompt complet pour debug
  console.log("\n" + "─".repeat(70));
  console.log("📝 PROMPT COMPLET ENVOYÉ À GEMINI:");
  console.log("─".repeat(70));
  console.log(prompt);
  console.log("─".repeat(70) + "\n");

  // Construire le contenu selon la documentation Nano Banana Pro
  // L'ordre est important: prompt texte d'abord, puis les images
  const contents: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: originalImage.mimeType,
        data: originalImage.base64,
      },
    },
  ];

  // Ajouter les images de référence
  for (const refImage of referenceImages) {
    contents.push({
      inlineData: { mimeType: refImage.mimeType, data: refImage.base64 },
    });
  }

  // Ajouter le masque fusionné annoté s'il existe
  // C'est UNE SEULE image qui montre:
  // - L'image originale comme fond
  // - Les zones de masque remplies avec les textures de référence correspondantes
  // - Des numéros dans des cercles colorés au centre de chaque zone
  // - Des flèches et labels indiquant quelle référence appliquer où
  // - Des contours colorés autour de chaque zone
  let hasMask = false;
  if (combinedMaskImages && combinedMaskImages.length > 0 && combinedMaskImages[0]) {
    const annotatedMask = combinedMaskImages[0];
    contents.push({
      inlineData: { mimeType: annotatedMask.mimeType, data: annotatedMask.base64 },
    });
    hasMask = true;
    console.log(`   🎭 Masque fusionné annoté ajouté (guide visuel des zones)`);
    
    // Ajouter une explication textuelle du masque pour Gemini
    contents.push({
      text: `

📌 GUIDE VISUEL DES MODIFICATIONS (image précédente):
L'image annotée ci-dessus te montre EXACTEMENT où et quoi appliquer:
- Chaque zone numérotée (1, 2, 3...) correspond à une instruction
- Les contours colorés délimitent PRÉCISÉMENT les zones à modifier
- À l'intérieur de chaque zone, tu vois déjà un aperçu de la texture/matériau à appliquer
- Les labels indiquent le nom de la référence et l'instruction

🎯 UTILISE CE GUIDE pour:
1. Identifier les zones EXACTES à modifier (suivre les contours colorés)
2. Voir quel matériau/texture appliquer dans chaque zone (déjà visible dans le masque)
3. Comprendre la correspondance zone ↔ référence ↔ instruction

⚠️ IMPORTANT: Les zones NON colorées/numérotées doivent rester IDENTIQUES à l'image originale.
`
    });
  }

  console.log(`   🖼️  ${1 + referenceImages.length + (hasMask ? 1 : 0)} images envoyées`);

  // Configuration de l'API
  const apiConfig: any = {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio: IMAGE_CONFIG.aspectRatio,
      imageSize: IMAGE_CONFIG.imageSize,
    },
  };

  // Appel avec configuration avancée Nano Banana Pro
  const response = await ai.models.generateContent({
    model: MODELS.generator,
    contents: contents,
    config: apiConfig,
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("Réponse vide de l'API Gemini");
  }

  const parts = response.candidates[0].content?.parts || [];
  let generatedImagePath = "";
  let description = "";
  let thoughtCount = 0;

  // Traitement des parties (inclut les "thought" images de Nano Banana Pro)
  for (const part of parts) {
    // Ignorer les images de "thinking" (intermédiaires)
    if ((part as any).thought) {
      thoughtCount++;
      continue;
    }

    if (part.inlineData?.data) {
      const imageData = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || "image/png";
      const extension = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";

      const fileName = `generated_${generationId}.${extension}`;
      const imageBuffer = Buffer.from(imageData as string, "base64");

      // Sauvegarder sur S3
      generatedImagePath = await saveBuffer(imageBuffer, fileName, "generated");

      console.log(
        `   💾 Sauvegardé sur S3: ${fileName} (${(
          imageBuffer.length / 1024
        ).toFixed(0)} KB)`
      );
      if (thoughtCount > 0) {
        console.log(
          `   🧠 Mode Thinking: ${thoughtCount} image(s) intermédiaire(s) générée(s)`
        );
      }
    } else if (part.text) {
      description = part.text;
    }
  }

  if (!generatedImagePath) {
    throw new Error(
      `Pas d'image générée. Réponse: ${
        description?.substring(0, 300) || "vide"
      }`
    );
  }

  return {
    imagePath: generatedImagePath,
    description: description || "Image générée avec succès",
    thoughtCount,
  };
}
