// ============================================================================
// AGENT ANALYSEUR DE MASQUE
// ============================================================================
// Analyse un masque dessiné par l'utilisateur pour :
// 1. Identifier précisément quelle zone/élément il délimite
// 2. Améliorer l'instruction utilisateur en fonction du masque réel
// 3. Corriger les incohérences (ex: "tout le sol" mais masque partiel)
// ============================================================================

import { GoogleGenAI } from "@google/genai";
import { MODELS } from "../config";
import type { PreparedImage, ImageAnalysis } from "../types";

// Client AI
const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.AI_GOOGLE_API_KEY || process.env.AI_GOOGLE_API_KEY || "",
});

/**
 * Résultat de l'analyse du masque
 */
export interface MaskAnalysisResult {
  /** Description de la zone délimitée par le masque */
  zoneDescription: string;
  /** Type d'élément couvert (surface, objet, etc.) */
  elementType: "surface" | "object" | "area" | "multiple";
  /** Éléments spécifiques identifiés dans le masque */
  elementsInMask: string[];
  /** Position relative dans l'image */
  position: {
    horizontal: "left" | "center" | "right" | "full-width";
    vertical: "top" | "middle" | "bottom" | "full-height";
  };
  /** Pourcentage approximatif de l'image couvert */
  coveragePercent: number;
  /** Est-ce une zone partielle ou totale? */
  isPartial: boolean;
  /** Suggestions pour améliorer l'instruction */
  instructionCorrections: string[];
  /** Instruction améliorée basée sur le masque */
  improvedInstruction: string;
}

/**
 * Prompt pour analyser le masque avec l'image originale
 */
const MASK_ANALYSIS_PROMPT = `Tu es un EXPERT en analyse d'image et de zones délimitées.

Je te fournis DEUX images:
1. L'IMAGE ORIGINALE de l'espace (intérieur/extérieur)
2. Un MASQUE où la zone BLANCHE représente la zone sélectionnée par l'utilisateur

L'INSTRUCTION DE L'UTILISATEUR pour cette zone est: "{instruction}"

ANALYSE LE MASQUE et réponds à ces questions:

1. **ZONE DÉLIMITÉE** - Quelle partie de l'image le masque sélectionne-t-il?
   - Décris précisément la zone (ex: "partie droite du sol", "mur du fond", "coin gauche du toit")
   
2. **TYPE D'ÉLÉMENT** - Qu'est-ce qui est sélectionné?
   - "surface" = mur, sol, plafond, toit, façade
   - "object" = meuble, luminaire, plante, équipement
   - "area" = zone générale sans élément précis
   - "multiple" = plusieurs éléments différents

3. **ÉLÉMENTS IDENTIFIÉS** - Liste les éléments/surfaces visibles dans la zone blanche

4. **POSITION**
   - Horizontal: left (gauche), center (centre), right (droite), full-width (toute la largeur)
   - Vertical: top (haut), middle (milieu), bottom (bas), full-height (toute la hauteur)

5. **COUVERTURE** - Quel pourcentage approximatif de l'image le masque couvre-t-il? (0-100)

6. **PARTIEL OU TOTAL** - Le masque couvre-t-il:
   - Une PARTIE d'un élément (ex: partie droite du sol) = partial
   - La TOTALITÉ d'un élément (ex: tout le mur du fond) = total

7. **CORRECTIONS À L'INSTRUCTION**
   - L'instruction "{instruction}" correspond-elle au masque?
   - Si l'instruction dit "tout le sol" mais le masque ne couvre qu'une partie → corriger
   - Si l'instruction est vague mais le masque est précis → préciser

8. **INSTRUCTION AMÉLIORÉE**
   - Reformule l'instruction pour qu'elle corresponde EXACTEMENT au masque
   - Sois PRÉCIS sur la zone: "partie droite du sol" au lieu de "le sol"

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks):
{
  "zoneDescription": "Description précise de la zone délimitée par le masque",
  "elementType": "surface | object | area | multiple",
  "elementsInMask": ["sol", "partie du tapis", ...],
  "position": {
    "horizontal": "left | center | right | full-width",
    "vertical": "top | middle | bottom | full-height"
  },
  "coveragePercent": 25,
  "isPartial": true,
  "instructionCorrections": [
    "L'instruction mentionne 'tout le sol' mais le masque ne couvre que la partie droite",
    "Préciser: 'partie droite du sol' au lieu de 'sol'"
  ],
  "improvedInstruction": "Instruction reformulée précise correspondant exactement au masque"
}`;

/**
 * Analyse un masque pour comprendre quelle zone il délimite
 */
export async function analyzeMaskZone(
  originalImage: PreparedImage,
  maskImage: PreparedImage,
  userInstruction: string,
  imageAnalysis?: ImageAnalysis
): Promise<MaskAnalysisResult> {
  console.log("   🎭 Analyse du masque en cours...");
  console.log(`      Instruction utilisateur: "${userInstruction}"`);

  const prompt = MASK_ANALYSIS_PROMPT.replace(/{instruction}/g, userInstruction);

  try {
    const response = await ai.models.generateContent({
      model: MODELS.analyzer,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: originalImage.mimeType,
                data: originalImage.base64,
              },
            },
            {
              inlineData: {
                mimeType: maskImage.mimeType,
                data: maskImage.base64,
              },
            },
          ],
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      console.log(`      ✓ Zone identifiée: ${parsed.zoneDescription}`);
      console.log(`      ✓ Type: ${parsed.elementType}`);
      console.log(`      ✓ Couverture: ${parsed.coveragePercent}%`);
      console.log(`      ✓ Partiel: ${parsed.isPartial}`);
      if (parsed.instructionCorrections?.length > 0) {
        console.log(`      ⚠️ Corrections: ${parsed.instructionCorrections.length}`);
      }
      console.log(`      → Instruction améliorée: "${parsed.improvedInstruction}"`);

      return {
        zoneDescription: parsed.zoneDescription || "Zone non identifiée",
        elementType: parsed.elementType || "area",
        elementsInMask: parsed.elementsInMask || [],
        position: parsed.position || { horizontal: "center", vertical: "middle" },
        coveragePercent: parsed.coveragePercent || 50,
        isPartial: parsed.isPartial !== false,
        instructionCorrections: parsed.instructionCorrections || [],
        improvedInstruction: parsed.improvedInstruction || userInstruction,
      };
    }
  } catch (error) {
    console.error("   ❌ Erreur lors de l'analyse du masque:", error);
  }

  // Fallback si l'analyse échoue
  return {
    zoneDescription: "Zone sélectionnée par l'utilisateur",
    elementType: "area",
    elementsInMask: [],
    position: { horizontal: "center", vertical: "middle" },
    coveragePercent: 50,
    isPartial: true,
    instructionCorrections: [],
    improvedInstruction: userInstruction,
  };
}

/**
 * Combine l'instruction originale avec l'analyse du masque
 * pour créer une instruction optimale
 */
export function buildMaskAwareInstruction(
  originalInstruction: string,
  maskAnalysis: MaskAnalysisResult,
  referenceName?: string
): string {
  const parts: string[] = [];

  // Utiliser l'instruction améliorée comme base
  parts.push(maskAnalysis.improvedInstruction);

  // Ajouter des précisions si le masque est partiel
  if (maskAnalysis.isPartial) {
    parts.push(`[ZONE PRÉCISE: ${maskAnalysis.zoneDescription}]`);
  }

  // Ajouter la position si elle est spécifique
  if (maskAnalysis.position.horizontal !== "full-width" || maskAnalysis.position.vertical !== "full-height") {
    const posDesc = [];
    if (maskAnalysis.position.horizontal !== "full-width") {
      posDesc.push(maskAnalysis.position.horizontal === "left" ? "côté gauche" :
                   maskAnalysis.position.horizontal === "right" ? "côté droit" : "au centre");
    }
    if (maskAnalysis.position.vertical !== "full-height") {
      posDesc.push(maskAnalysis.position.vertical === "top" ? "partie haute" :
                   maskAnalysis.position.vertical === "bottom" ? "partie basse" : "au milieu");
    }
    if (posDesc.length > 0) {
      parts.push(`[POSITION: ${posDesc.join(", ")}]`);
    }
  }

  // Ajouter la couverture si elle est partielle
  if (maskAnalysis.coveragePercent < 80) {
    parts.push(`[COUVERTURE: ~${maskAnalysis.coveragePercent}% de la zone visible]`);
  }

  return parts.join(" ");
}
