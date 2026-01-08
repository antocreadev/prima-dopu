// ============================================================================
// AGENT ANALYSTE D'IMAGE - TOUS MÉTIERS DU BÂTIMENT & AMÉNAGEMENT
// ============================================================================
// Analyse exhaustive couvrant: BTP, décoration, architecture, énergie,
// rénovation, immobilier, menuiserie, façadier, constructions bois,
// fermetures, plomberie, paysagiste, électricité, toiture, piscine, etc.
// ============================================================================

import { GoogleGenAI } from "@google/genai";
import { MODELS } from "../config";
import type { ImageAnalysis, PreparedImage } from "../types";

// Client AI (initialisé une seule fois)
const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.AI_GOOGLE_API_KEY || process.env.AI_GOOGLE_API_KEY || "",
});

/**
 * Prompt d'analyse exhaustif pour tous les métiers du bâtiment
 */
const ANALYSIS_PROMPT = `Tu es un EXPERT POLYVALENT en analyse visuelle pour TOUS les métiers du bâtiment, de l'aménagement et de l'habitat.

TON EXPERTISE COUVRE:
• BTP & Gros œuvre: maçonnerie, charpente, fondations, structure
• Menuiserie intérieure: portes, placards, escaliers, parquets
• Menuiserie extérieure & Fermetures: fenêtres, volets, portails, stores, pergolas
• Façade & Ravalement: enduit, bardage, isolation extérieure
• Toiture & Couverture: tuiles, ardoises, gouttières, cheminées, velux
• Plomberie & Sanitaires: tuyauterie, robinetterie, WC, douches, baignoires
• Électricité & Domotique: tableau, prises, éclairage, alarmes, interphones
• Chauffage & Climatisation: radiateurs, chaudières, PAC, VMC, climatiseurs
• Énergies Renouvelables: panneaux solaires, batteries, bornes de recharge
• Paysagisme & Extérieur: terrasses, allées, clôtures, végétation, arrosage
• Piscine & Spa: bassins, margelles, abris, équipements
• Décoration & Agencement: mobilier, luminaires, textiles, art
• Cuisine & Salle de bain: meubles, plans de travail, électroménager

ANALYSE cette image de manière EXHAUSTIVE et identifie:

1. **TYPE D'ESPACE**: Intérieur, extérieur, ou mixte
2. **TOUTES LES SURFACES** modifiables (murs, sols, plafonds, façades, toiture)
3. **TOUS LES ÉLÉMENTS ARCHITECTURAUX** (portes, fenêtres, escaliers, garde-corps)
4. **TOUS LES ÉQUIPEMENTS TECHNIQUES** (plomberie, électricité, chauffage, énergie)
5. **TOUT LE MOBILIER** (meubles, luminaires, décorations)
6. **TOUTE LA VÉGÉTATION** (plantes, arbres, haies, massifs)
7. **L'ÉCLAIRAGE** précis de la scène
8. **LA PERSPECTIVE** exacte pour le respect du cadrage

Réponds UNIQUEMENT avec ce JSON valide (sans markdown, sans backticks):
{
  "spaceType": "type précis (salon, chambre, cuisine, jardin, façade, toiture...)",
  "environment": "interior | exterior | mixed",
  "surfaces": [
    {
      "id": "wall_north",
      "name": "Mur nord",
      "description": "Mur vertical principal face à l'entrée",
      "boundaries": "De l'angle gauche jusqu'à la fenêtre",
      "currentMaterial": "Peinture blanche mate légèrement usée",
      "category": "wall",
      "condition": "good",
      "visiblePercentage": 80
    }
  ],
  "objects": [
    {
      "id": "window_main",
      "name": "Fenêtre principale",
      "category": "window",
      "subcategory": "double_vitrage_pvc",
      "description": "Fenêtre 2 vantaux avec volets roulants",
      "position": "Mur nord, centre",
      "style": "moderne",
      "material": "PVC blanc",
      "color": "blanc",
      "condition": "good"
    },
    {
      "id": "radiator_main",
      "name": "Radiateur",
      "category": "radiator",
      "subcategory": "acier_horizontal",
      "description": "Radiateur à eau chaude sous la fenêtre",
      "position": "Sous la fenêtre principale",
      "style": "classique",
      "material": "acier peint",
      "color": "blanc",
      "condition": "good"
    }
  ],
  "lighting": {
    "type": "natural | artificial | mixed",
    "direction": "Lumière venant de la droite par la fenêtre",
    "intensity": "medium",
    "temperature": "neutral",
    "shadows": "soft",
    "estimatedTimeOfDay": "après-midi"
  },
  "perspective": {
    "viewType": "angular",
    "description": "Vue depuis l'entrée vers le fond de la pièce",
    "cameraHeight": "eye_level",
    "fieldOfView": "normal",
    "vanishingPoint": "centre-droit de l'image"
  },
  "existingMaterials": [
    {"zone": "Sol", "type": "parquet", "color": "chêne moyen", "texture": "veiné", "finish": "satin"}
  ],
  "technicalEquipment": [
    {
      "id": "outlet_1",
      "type": "prise électrique",
      "category": "outlet",
      "position": "Mur gauche, bas"
    }
  ],
  "vegetation": [
    {
      "id": "plant_1",
      "type": "ficus",
      "category": "indoor_plant",
      "position": "Coin gauche",
      "size": "medium",
      "health": "healthy"
    }
  ],
  "relevantTrades": ["peinture", "menuiserie", "électricité", "décoration"]
}

CATÉGORIES D'ÉLÉMENTS À IDENTIFIER (sois EXHAUSTIF):

🏗️ STRUCTURE & GROS ŒUVRE:
- Murs porteurs, cloisons, poutres, colonnes
- Escaliers, marches, rampes, garde-corps
- Dalles, fondations visibles, linteaux

🚪 MENUISERIE & FERMETURES:
- Portes (intérieures, extérieures, garage, coulissantes)
- Fenêtres (fixes, ouvrantes, velux, baies vitrées)
- Volets (battants, roulants), stores, persiennes
- Portails, portillons, clôtures
- Placards, dressings, bibliothèques intégrées
- Plinthes, moulures, lambris

🏠 TOITURE & FAÇADE:
- Tuiles, ardoises, couverture métallique
- Gouttières, descentes, chéneaux
- Cheminées, conduits, antennes
- Enduit, bardage (bois, métallique, composite)
- Isolation extérieure visible

🔧 PLOMBERIE & SANITAIRES:
- Lavabos, éviers, robinetterie
- WC, bidets, urinoirs
- Douches, baignoires, parois
- Chauffe-eau, ballon, cumulus
- Tuyauterie visible, radiateurs

⚡ ÉLECTRICITÉ & DOMOTIQUE:
- Prises, interrupteurs, variateurs
- Tableau électrique, compteur
- Éclairages (plafonniers, appliques, spots)
- Thermostats, interphones, vidéophones
- Caméras, détecteurs, alarmes

🌡️ CHAUFFAGE & CLIMATISATION:
- Radiateurs (eau, électrique)
- Cheminées, inserts, poêles
- Climatiseurs, splits, cassettes
- VMC, bouches d'aération

☀️ ÉNERGIES RENOUVELABLES:
- Panneaux solaires (photovoltaïques, thermiques)
- Pompes à chaleur
- Batteries de stockage
- Bornes de recharge VE

🪴 EXTÉRIEUR & PAYSAGISME:
- Terrasses (bois, pierre, composite)
- Allées, dallage, pavés
- Pelouse, massifs, bordures
- Arbres, arbustes, haies
- Piscines, spas, fontaines
- Mobilier de jardin, pergolas

🪑 MOBILIER & DÉCORATION:
- Canapés, fauteuils, chaises
- Tables, bureaux, commodes
- Lits, armoires, étagères
- Luminaires (lustres, lampes)
- Rideaux, tapis, coussins
- Tableaux, miroirs, objets déco
- Plantes d'intérieur

🍳 CUISINE:
- Meubles hauts et bas
- Plan de travail, crédence, îlot
- Électroménager (four, plaque, hotte, frigo)
- Évier, robinetterie

🛁 SALLE DE BAIN:
- Vasques, meubles de salle de bain
- Douche, baignoire
- Miroirs, rangements
- Sèche-serviettes

RÈGLES CRITIQUES:
1. Identifie CHAQUE élément visible séparément avec un ID unique
2. Sois PRÉCIS sur les matériaux, couleurs, styles, états
3. Note la POSITION exacte de chaque élément
4. Identifie les ÉQUIPEMENTS TECHNIQUES même petits (prises, interrupteurs)
5. La perspective est CRUCIALE - analyse-la précisément
6. Les MÉTIERS concernés aident à contextualiser les modifications possibles`;

/**
 * Analyse fallback générique
 */
function createFallbackAnalysis(): ImageAnalysis {
  return {
    spaceType: "espace non identifié",
    environment: "interior",
    surfaces: [
      {
        id: "wall_main",
        name: "Mur principal",
        description: "Surface murale principale",
        boundaries: "Zone principale visible",
        currentMaterial: "inconnu",
        category: "wall",
      },
      {
        id: "floor_main",
        name: "Sol",
        description: "Surface au sol",
        boundaries: "Partie basse de l'image",
        currentMaterial: "inconnu",
        category: "floor",
      },
    ],
    objects: [],
    lighting: {
      type: "mixed",
      direction: "non déterminée",
      intensity: "medium",
      temperature: "neutral",
      shadows: "soft",
    },
    perspective: {
      viewType: "frontal",
      description: "Vue frontale",
      cameraHeight: "eye_level",
      fieldOfView: "normal",
    },
    existingMaterials: [],
    technicalEquipment: [],
    vegetation: [],
    relevantTrades: [],
  };
}

/**
 * Agent Analyste - Analyse exhaustive d'une image
 * Identifie toutes les surfaces, objets, équipements pour tous les métiers
 */
export async function analyzeImageWithAgent(
  imageData: PreparedImage
): Promise<ImageAnalysis> {
  console.log("   🔍 Agent Analyste: Analyse exhaustive multi-métiers...");

  try {
    const response = await ai.models.generateContent({
      model: MODELS.analyzer,
      contents: [
        { text: ANALYSIS_PROMPT },
        {
          inlineData: { mimeType: imageData.mimeType, data: imageData.base64 },
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extraire le JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]) as ImageAnalysis;

      // Logs détaillés
      console.log(`   ✓ Type d'espace: ${analysis.spaceType} (${analysis.environment})`);
      console.log(`   ✓ ${analysis.surfaces?.length || 0} surfaces identifiées`);
      console.log(`   ✓ ${analysis.objects?.length || 0} objets identifiés`);
      console.log(`   ✓ ${analysis.technicalEquipment?.length || 0} équipements techniques`);
      console.log(`   ✓ ${analysis.vegetation?.length || 0} éléments végétaux`);
      
      if (analysis.relevantTrades && analysis.relevantTrades.length > 0) {
        console.log(`   ✓ Métiers concernés: ${analysis.relevantTrades.join(", ")}`);
      }

      // Log des surfaces
      if (analysis.surfaces && analysis.surfaces.length > 0) {
        console.log("\n   📐 Surfaces:");
        for (const surface of analysis.surfaces.slice(0, 5)) {
          console.log(`      - ${surface.name} (${surface.category}): ${surface.currentMaterial}`);
        }
        if (analysis.surfaces.length > 5) {
          console.log(`      ... et ${analysis.surfaces.length - 5} autres`);
        }
      }

      // Log des objets
      if (analysis.objects && analysis.objects.length > 0) {
        console.log("\n   🪑 Objets:");
        for (const obj of analysis.objects.slice(0, 5)) {
          console.log(`      - ${obj.name} (${obj.category}): ${obj.style} ${obj.material}`);
        }
        if (analysis.objects.length > 5) {
          console.log(`      ... et ${analysis.objects.length - 5} autres`);
        }
      }

      return analysis;
    }
  } catch (error) {
    console.warn("   ⚠️ Parsing de l'analyse échoué, utilisation du fallback");
    console.error("   Erreur:", error);
  }

  return createFallbackAnalysis();
}
