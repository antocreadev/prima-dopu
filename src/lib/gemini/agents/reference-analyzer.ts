// ============================================================================
// AGENT ANALYSE DE RÉFÉRENCE - CLASSIFICATION ÉTENDUE
// ============================================================================
// Analyse les images de référence pour déterminer:
// - Type (texture, objet, produit, plante, équipement technique, etc.)
// - Action à effectuer (appliquer, remplacer, ajouter)
// - Conseils d'intégration photoréaliste
// ============================================================================

import { GoogleGenAI } from "@google/genai";
import { MODELS } from "../config";
import type { ReferenceAnalysis, PreparedImage, ReferenceAction } from "../types";

// Client AI
const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.AI_GOOGLE_API_KEY || process.env.AI_GOOGLE_API_KEY || "",
});

/**
 * Prompt d'analyse de référence - Classification étendue
 */
const REFERENCE_ANALYSIS_PROMPT = `Tu es un EXPERT en identification d'images de référence pour la visualisation de projets d'aménagement.

TON RÔLE: Analyser cette image de RÉFÉRENCE fournie par l'utilisateur et déterminer PRÉCISÉMENT:
1. Ce que l'image représente
2. Comment l'utiliser dans une transformation d'espace
3. Comment l'intégrer de manière PHOTORÉALISTE

TYPES DE RÉFÉRENCES POSSIBLES:

🎨 TEXTURES & MATÉRIAUX (à appliquer sur des surfaces):
- Peintures, enduits, crépis
- Carrelages, faïences, mosaïques, vinyl
- Parquets, stratifiés, vinyles
- Pierre, marbre, granit
- Béton, béton ciré
- Papiers peints
- Tissus, textiles
- Bardages (bois, métal, composite)
- Revêtements de toiture (tuiles, ardoises)

📦 PRODUITS & OBJETS (à placer/remplacer):
- Photos de catalogue produit
- Rendus 3D de meubles
- Packshots sur fond blanc
- Luminaires, lampes
- Sanitaires (lavabos, WC, douches)
- Électroménager
- Menuiseries (portes, fenêtres)
- Radiateurs, chauffages

🌿 VÉGÉTATION (plantes, arbres):
- Plantes
- Arbres, arbustes
- Haies, massifs floraux
- Gazon, couvre-sols

⚡ ÉQUIPEMENTS TECHNIQUES:
- Panneaux solaires
- Pompes à chaleur
- Climatiseurs
- Équipements de piscine
- Portails, clôtures
- Systèmes d'alarme

🏗️ ÉLÉMENTS ARCHITECTURAUX:
- Fenêtres, baies vitrées
- Portes (entrée, garage, intérieures)
- Volets, stores
- Pergolas, vérandas
- Escaliers, garde-corps

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks):
{
  "type": "texture | material_sample | product_photo | 3d_render | furniture_photo | lighting_fixture | plant_photo | technical_equipment | architectural_element | ambiance_photo | custom",
  "category": "catégorie précise (ex: parquet chevron, table à manger scandinave, panneau solaire monocristallin)",
  "subcategory": "sous-catégorie si applicable",
  "description": "description détaillée et complète de ce que montre l'image",
  "mainColor": "couleur dominante",
  "secondaryColors": ["couleur2", "couleur3"],
  "style": "style (moderne, classique, industriel, scandinave, bohème, minimaliste, rustique...)",
  "material": "matériau principal",
  "secondaryMaterials": ["autres matériaux visibles"],
  "action": "apply_texture | replace_object | add_element | use_as_style | extract_color",
  "finish": "finition (mat, satiné, brillant, texturé...)",
  "pattern": "motif si applicable (chevron, damier, uni, géométrique...)",
  "dimensions": "dimensions estimées si identifiables",
  "brand": "marque si identifiable",
  "imageQuality": "excellent | good | acceptable | poor",
  "integrationTips": [
    "Conseil 1 pour une intégration réaliste",
    "Conseil 2...",
    "Conseil 3..."
  ]
}

RÈGLES DE CLASSIFICATION:

📐 C'est une TEXTURE/MATÉRIAU si:
- Image en gros plan de surface
- Pattern répétitif ou uniforme
- Pas de forme d'objet reconnaissable
- Échantillon sans contexte 3D
→ action = "apply_texture"

🛋️ C'est un OBJET/PRODUIT si:
- Forme complète identifiable
- Meuble, luminaire, équipement
- Photo de catalogue ou rendu 3D
- Produit avec structure 3D
→ action = "replace_object" (si remplacement) ou "add_element" (si ajout)

🌱 C'est de la VÉGÉTATION si:
- Plante, arbre, fleurs
- Élément végétal naturel
→ action = "add_element" ou "replace_object"

⚙️ C'est un ÉQUIPEMENT TECHNIQUE si:
- Panneau solaire, pompe à chaleur
- Climatiseur, chauffage
- Installation électrique, plomberie
→ action = "replace_object" ou "add_element"

🏠 C'est un ÉLÉMENT ARCHITECTURAL si:
- Porte, fenêtre, volet
- Escalier, garde-corps
- Élément de structure
→ action = "replace_object"

CONSEILS D'INTÉGRATION À FOURNIR:
Pour chaque référence, donne des conseils SPÉCIFIQUES pour:
- L'adaptation de l'éclairage
- Le respect de la perspective
- La gestion des ombres
- L'intégration chromatique
- Le rendu photoréaliste

Sois PRÉCIS et EXHAUSTIF dans ton analyse.`;

/**
 * Fallback pour l'analyse de référence
 */
function createFallbackReferenceAnalysis(): ReferenceAnalysis {
  return {
    type: "custom",
    category: "élément de référence",
    description: "Image de référence non analysée",
    mainColor: "non déterminé",
    style: "non déterminé",
    material: "non déterminé",
    action: "apply_texture",
    imageQuality: "acceptable",
    integrationTips: [
      "Adapter l'éclairage à la scène",
      "Respecter la perspective existante",
      "Ajouter des ombres cohérentes",
    ],
  };
}

/**
 * Agent Analyse de Référence
 * Analyse une image de référence pour déterminer comment l'intégrer
 */
export async function analyzeReferenceImage(
  imageData: PreparedImage
): Promise<ReferenceAnalysis> {
  console.log("   🎨 Agent Référence: Classification de l'image...");

  try {
    const response = await ai.models.generateContent({
      model: MODELS.analyzer,
      contents: [
        { text: REFERENCE_ANALYSIS_PROMPT },
        {
          inlineData: { mimeType: imageData.mimeType, data: imageData.base64 },
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]) as ReferenceAnalysis;
      
      console.log(`   ✓ Type: ${analysis.type.toUpperCase()}`);
      console.log(`   ✓ Catégorie: ${analysis.category}`);
      console.log(`   ✓ Action: ${analysis.action}`);
      console.log(`   ✓ Style: ${analysis.style} | Matériau: ${analysis.material}`);
      console.log(`   ✓ Qualité image: ${analysis.imageQuality}`);
      
      if (analysis.integrationTips && analysis.integrationTips.length > 0) {
        console.log(`   ✓ Conseils d'intégration:`);
        for (const tip of analysis.integrationTips.slice(0, 3)) {
          console.log(`      → ${tip}`);
        }
      }

      return analysis;
    }
  } catch (error) {
    console.warn("   ⚠️ Analyse de référence échouée, utilisation du fallback");
    console.error("   Erreur:", error);
  }

  return createFallbackReferenceAnalysis();
}

/**
 * Détermine l'action appropriée basée sur le type de référence
 */
export function determineAction(
  referenceType: string,
  hasTargetObject: boolean
): ReferenceAction {
  // Textures et matériaux → toujours appliquer comme texture
  if (
    referenceType === "texture" ||
    referenceType === "material_sample" ||
    referenceType === "paint_color" ||
    referenceType === "wallpaper" ||
    referenceType === "tile_pattern" ||
    referenceType === "wood_sample" ||
    referenceType === "stone_sample" ||
    referenceType === "fabric_sample"
  ) {
    return "apply_texture";
  }

  // Références de style/ambiance
  if (
    referenceType === "ambiance_photo" ||
    referenceType === "style_reference" ||
    referenceType === "mood_board"
  ) {
    return "use_as_style";
  }

  // Palette de couleurs
  if (referenceType === "color_palette") {
    return "extract_color";
  }

  // Objets et produits
  if (hasTargetObject) {
    return "replace_object";
  }

  return "add_element";
}
