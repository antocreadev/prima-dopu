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

  // Construire le contenu avec des labels EXPLICITES pour chaque image
  const contents: any[] = [
    { text: prompt },
    { text: `

═══════════════════════════════════════════════════════════════════════
🏠 IMAGE 1 - IMAGE ORIGINALE À MODIFIER (image suivante)
═══════════════════════════════════════════════════════════════════════
C'est l'image de base que tu dois transformer. 
CONSERVE son cadrage, sa perspective et tous les éléments non concernés par les modifications.
` },
    {
      inlineData: {
        mimeType: originalImage.mimeType,
        data: originalImage.base64,
      },
    },
  ];

  // Ajouter les images de référence avec labels explicites
  if (referenceImages.length > 0) {
    contents.push({
      text: `

═══════════════════════════════════════════════════════════════════════
🎨 IMAGES DE RÉFÉRENCE (${referenceImages.length} image(s) suivante(s))
═══════════════════════════════════════════════════════════════════════
Ces images montrent les matériaux, textures ou objets à utiliser pour les modifications.
Chaque référence est numérotée et correspond à une zone du masque.
`
    });
    
    for (let i = 0; i < referenceImages.length; i++) {
      const refImage = referenceImages[i];
      contents.push({
        text: `
📌 RÉFÉRENCE ${i + 1}/${referenceImages.length} (image suivante):
Cette texture/matériau doit être appliqué dans la ZONE ${i + 1} du masque annoté.
`
      });
      contents.push({
        inlineData: { mimeType: refImage.mimeType, data: refImage.base64 },
      });
    }
  }

  // Ajouter le masque fusionné annoté s'il existe
  let hasMask = false;
  if (combinedMaskImages && combinedMaskImages.length > 0 && combinedMaskImages[0]) {
    const annotatedMask = combinedMaskImages[0];
    
    contents.push({
      text: `

═══════════════════════════════════════════════════════════════════════
🎭 MASQUE DE GUIDAGE ANNOTÉ (image suivante) - TRÈS IMPORTANT !
═══════════════════════════════════════════════════════════════════════
L'image suivante est un GUIDE VISUEL qui te montre EXACTEMENT :
• OÙ appliquer chaque modification (zones délimitées par des contours colorés)
• QUOI appliquer (la texture/matériau est déjà visible à l'intérieur de chaque zone)
• QUELLE RÉFÉRENCE utiliser (numéros 1, 2, 3... correspondent aux références ci-dessus)

⚠️ RÈGLES STRICTES À RESPECTER:
1. Modifie UNIQUEMENT les zones colorées/numérotées du masque
2. Applique la texture/référence correspondant au numéro de la zone
3. Garde TOUT LE RESTE de l'image IDENTIQUE à l'originale
4. Respecte les contours EXACTS des zones délimitées
`
    });
    
    contents.push({
      inlineData: { mimeType: annotatedMask.mimeType, data: annotatedMask.base64 },
    });
    
    contents.push({
      text: `
☝️ L'image CI-DESSUS est le MASQUE ANNOTÉ. Voici la correspondance:
${referenceImages.map((_, i) => `  • Zone ${i + 1} (numéro ${i + 1} dans un cercle) → Applique la RÉFÉRENCE ${i + 1}`).join('\n')}

Les parties NON masquées (sans numéro ni contour coloré) doivent rester STRICTEMENT IDENTIQUES à l'image originale.
═══════════════════════════════════════════════════════════════════════
`
    });
    
    hasMask = true;
    console.log(`   🎭 Masque fusionné annoté ajouté avec labels explicites`);
  }

  // Instruction finale de rappel
  contents.push({
    text: `

🎯 RÉCAPITULATIF DE TA MISSION:
═══════════════════════════════════════════════════════════════════════
1. Prends l'IMAGE ORIGINALE (image 1) comme base
2. Consulte les IMAGES DE RÉFÉRENCE pour voir les matériaux/textures à utiliser
3. Regarde le MASQUE ANNOTÉ pour savoir EXACTEMENT où appliquer chaque référence:
${referenceImages.map((_, i) => `   - Zone ${i + 1} → Référence ${i + 1}`).join('\n')}
4. Génère UNE SEULE image finale avec toutes les modifications appliquées
5. CONSERVE le cadrage, la perspective et la luminosité de l'original

🚫 INTERDIT: 
- Zoomer ou dézoomer
- Recadrer l'image
- Changer l'angle de vue
- Modifier les zones NON masquées
- Inventer des modifications non demandées
═══════════════════════════════════════════════════════════════════════
`
  });

  // ═══════════════════════════════════════════════════════════════════════
  // LOG FINAL DE TOUT CE QUI EST ENVOYÉ À L'IA
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(70));
  console.log("📤 RÉCAPITULATIF FINAL - ENVOI À GEMINI");
  console.log("═".repeat(70));
  console.log(`🤖 Modèle: ${MODELS.generator}`);
  console.log(`📐 Config: ${IMAGE_CONFIG.imageSize} @ ${IMAGE_CONFIG.aspectRatio}`);
  console.log("");
  
  // Compter et lister les éléments
  let contentIndex = 0;
  for (const content of contents) {
    contentIndex++;
    if (content.text) {
      const textPreview = content.text.length > 100 
        ? content.text.substring(0, 100) + "..." 
        : content.text;
      console.log(`📝 [${contentIndex}] TEXTE (${content.text.length} chars): "${textPreview.replace(/\n/g, ' ')}"`);
    } else if (content.inlineData) {
      const sizeKB = (content.inlineData.data.length * 0.75 / 1024).toFixed(0);
      const type = content.inlineData.mimeType;
      
      // Identifier le type d'image
      let imageType = "Image";
      if (contentIndex === 2) imageType = "🏠 IMAGE ORIGINALE";
      else if (contentIndex <= 2 + referenceImages.length) imageType = `🎨 RÉFÉRENCE ${contentIndex - 2}`;
      else if (hasMask && contentIndex === 2 + referenceImages.length + 1) imageType = "🎭 MASQUE FUSIONNÉ ANNOTÉ";
      
      console.log(`🖼️  [${contentIndex}] ${imageType} (${type}, ~${sizeKB} KB)`);
    }
  }
  
  console.log("");
  console.log(`📊 TOTAL: ${contents.length} éléments`);
  console.log(`   • 1 image originale`);
  console.log(`   • ${referenceImages.length} image(s) de référence`);
  console.log(`   • ${hasMask ? "1 masque fusionné annoté" : "0 masque"}`);
  console.log(`   • ${contents.filter(c => c.text).length} bloc(s) de texte`);
  console.log("═".repeat(70) + "\n");

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
