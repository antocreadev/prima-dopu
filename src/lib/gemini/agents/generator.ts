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
 */
export async function generateWithNanoBanana(
  originalImage: PreparedImage,
  referenceImages: PreparedImage[],
  prompt: string,
  outputDir: string,
  generationId: string
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

  for (const refImage of referenceImages) {
    contents.push({
      inlineData: { mimeType: refImage.mimeType, data: refImage.base64 },
    });
  }

  console.log(`   🖼️  ${1 + referenceImages.length} images envoyées`);

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
