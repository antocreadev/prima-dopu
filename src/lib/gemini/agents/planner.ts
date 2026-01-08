// ============================================================================
// AGENT PLANIFICATEUR - COMPRÉHENSION INTELLIGENTE DES INSTRUCTIONS
// ============================================================================
// Analyse VRAIMENT les instructions utilisateur pour comprendre:
// - L'ACTION demandée (ajouter, remplacer, appliquer, modifier)
// - LA QUANTITÉ (1, 3, plusieurs, etc.)
// - LA ZONE PRÉCISE (partie droite, côté gauche, au centre, etc.)
// - L'ÉLÉMENT concerné (panneaux solaires, meubles, etc.)
// ============================================================================

import { GoogleGenAI } from "@google/genai";
import { MODELS } from "../config";
import { analyzeReferenceImage } from "./reference-analyzer";
import type {
  ImageAnalysis,
  ModificationPlan,
  ModificationTask,
  GenerationInstruction,
  PreparedImage,
  ReferenceAnalysis,
  SurfaceInfo,
  ObjectInfo,
} from "../types";

// Client AI
const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.AI_GOOGLE_API_KEY || process.env.AI_GOOGLE_API_KEY || "",
});

/**
 * Interface pour l'interprétation enrichie d'une instruction
 */
interface EnrichedInstruction {
  originalText: string;
  action: "add" | "replace" | "apply_texture" | "remove" | "modify";
  quantity: number | "all" | "some" | "partial";
  quantityText: string; // "3 panneaux", "tous les murs", etc.
  targetElement: string; // "panneau solaire", "table", "parquet", etc.
  targetZone: string; // "partie droite du toit", "mur nord", etc.
  zoneConstraints: {
    side?: "left" | "right" | "center" | "top" | "bottom";
    area?: "partial" | "full" | "specific";
    description: string;
  };
  style?: string;
  color?: string;
  additionalNotes: string[];
}

/**
 * Prompt pour parser intelligemment l'instruction utilisateur
 */
const INSTRUCTION_PARSER_PROMPT = `Tu es un EXPERT en compréhension du langage naturel pour des projets d'aménagement.

MISSION: Analyser cette instruction utilisateur et extraire PRÉCISÉMENT toutes les informations demandées.

INSTRUCTION À ANALYSER: "{instruction}"
TYPE DE RÉFÉRENCE DÉTECTÉ: {referenceType} ({referenceCategory})

EXTRACTION REQUISE:

1. **ACTION** - Que veut faire l'utilisateur?
   - "add" = AJOUTER un nouvel élément (qui n'existe pas encore)
   - "replace" = REMPLACER un élément existant par un autre
   - "apply_texture" = APPLIQUER un matériau/texture sur une SURFACE (mur, sol, toit)
   - "remove" = SUPPRIMER un élément
   - "modify" = MODIFIER un élément existant (couleur, taille, etc.)

2. **QUANTITÉ** - Combien d'éléments?
   - Nombre précis (1, 2, 3, 10...)
   - "all" = tous, l'ensemble
   - "some" = quelques-uns, plusieurs
   - "partial" = une partie seulement

3. **ÉLÉMENT CIBLE** - Sur quoi agir?
   - Identifier l'élément mentionné (panneau solaire, table, mur, toit, etc.)

4. **ZONE PRÉCISE** - OÙ exactement?
   - Extraire la position/zone mentionnée
   - Identifier le côté (gauche, droite, centre, haut, bas)
   - Identifier si c'est partiel ou total

INDICES LEXICAUX:
- "ajoute", "met", "installe", "pose" → action = "add"
- "remplace", "change", "substitue" → action = "replace"
- "applique", "peins", "recouvre", "tapisse" → action = "apply_texture"
- "enlève", "supprime", "retire" → action = "remove"
- "3 panneaux", "deux chaises", "une table" → quantité précise
- "tous les murs", "tout le sol" → quantité = "all"
- "une partie", "une section", "un coin" → quantité = "partial"
- "à droite", "côté droit", "partie droite" → side = "right"
- "à gauche", "côté gauche", "partie gauche" → side = "left"
- "au centre", "au milieu" → side = "center"
- "en haut", "partie supérieure" → side = "top"
- "en bas", "partie inférieure" → side = "bottom"

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks):
{
  "action": "add | replace | apply_texture | remove | modify",
  "quantity": 3,
  "quantityText": "3 panneaux solaires",
  "targetElement": "panneau solaire",
  "targetZone": "partie droite du toit",
  "zoneConstraints": {
    "side": "right",
    "area": "partial",
    "description": "Uniquement sur la section droite de la toiture, pas sur tout le toit"
  },
  "style": "style si mentionné",
  "color": "couleur si mentionnée",
  "additionalNotes": [
    "Note importante extraite de l'instruction"
  ]
}`;

/**
 * Agent Planificateur - Crée le plan de modification avec compréhension intelligente
 */
export async function planModificationsWithAgent(
  analysis: ImageAnalysis,
  instructions: GenerationInstruction[],
  referenceImages: PreparedImage[]
): Promise<ModificationPlan> {
  console.log("   📋 Agent Planificateur: Analyse intelligente des modifications...");

  // 1. Analyser chaque image de référence
  console.log("\n   🔍 Étape 1: Analyse des images de référence...");
  const referenceAnalyses: ReferenceAnalysis[] = [];
  for (let i = 0; i < referenceImages.length; i++) {
    console.log(`   📷 Analyse référence ${i + 1}/${referenceImages.length}...`);
    const refAnalysis = await analyzeReferenceImage(referenceImages[i]);
    referenceAnalyses.push(refAnalysis);
  }

  // 2. Parser chaque instruction de manière intelligente
  console.log("\n   🧠 Étape 2: Compréhension intelligente des instructions...");
  const enrichedInstructions: EnrichedInstruction[] = [];
  
  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    const refAnalysis = referenceAnalyses[i];
    
    console.log(`   💬 Parsing instruction ${i + 1}: "${instr.location}"`);
    
    const enriched = await parseInstructionIntelligently(
      instr.location,
      refAnalysis
    );
    
    enrichedInstructions.push(enriched);
    
    console.log(`      → Action: ${enriched.action.toUpperCase()}`);
    console.log(`      → Quantité: ${enriched.quantityText}`);
    console.log(`      → Élément: ${enriched.targetElement}`);
    console.log(`      → Zone: ${enriched.targetZone}`);
    if (enriched.zoneConstraints.side) {
      console.log(`      → Côté: ${enriched.zoneConstraints.side}`);
    }
  }

  // 3. Mapper intelligemment sur les éléments analysés
  console.log("\n   🗺️ Étape 3: Mapping sur les éléments identifiés...");
  const tasks = buildTasksFromEnrichedInstructions(
    analysis,
    instructions,
    referenceAnalyses,
    enrichedInstructions
  );

  console.log(`\n   ✓ ${tasks.length} tâches de modification planifiées:`);
  for (const task of tasks) {
    const targetName = task.targetSurface?.name || task.targetObject?.name || task.targetZone || "Zone spécifiée";
    const emoji =
      task.actionType === "replace_object"
        ? "🔄"
        : task.actionType === "add_element"
        ? "➕"
        : "🎨";
    const qtyInfo = task.quantity ? ` (x${task.quantity})` : "";
    console.log(`      ${emoji} ${task.actionType}: ${targetName}${qtyInfo} → ${task.targetMaterial}`);
  }

  // 4. Construire le prompt optimisé
  const { buildOptimizedPrompt } = await import("../prompts/builder");
  const globalPrompt = buildOptimizedPrompt(
    analysis,
    tasks,
    instructions,
    referenceAnalyses
  );

  return {
    originalAnalysis: analysis,
    tasks,
    globalPrompt,
    enrichedInstructions,
  };
}

/**
 * Parse une instruction de manière intelligente avec l'IA
 */
async function parseInstructionIntelligently(
  instructionText: string,
  refAnalysis: ReferenceAnalysis
): Promise<EnrichedInstruction> {
  const prompt = INSTRUCTION_PARSER_PROMPT
    .replace("{instruction}", instructionText)
    .replace("{referenceType}", refAnalysis?.type || "unknown")
    .replace("{referenceCategory}", refAnalysis?.category || "unknown");

  try {
    const response = await ai.models.generateContent({
      model: MODELS.analyzer,
      contents: [{ text: prompt }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        originalText: instructionText,
        action: parsed.action || "add",
        quantity: parsed.quantity || 1,
        quantityText: parsed.quantityText || "1 élément",
        targetElement: parsed.targetElement || "élément",
        targetZone: parsed.targetZone || "zone non spécifiée",
        zoneConstraints: parsed.zoneConstraints || { area: "full", description: "" },
        style: parsed.style,
        color: parsed.color,
        additionalNotes: parsed.additionalNotes || [],
      };
    }
  } catch (error) {
    console.warn("   ⚠️ Parsing intelligent échoué, analyse basique...");
  }

  // Fallback: parsing basique par mots-clés
  return parseInstructionBasic(instructionText, refAnalysis);
}

/**
 * Parsing basique par mots-clés (fallback)
 */
function parseInstructionBasic(
  instructionText: string,
  refAnalysis: ReferenceAnalysis
): EnrichedInstruction {
  const text = instructionText.toLowerCase();
  
  // Détecter l'action
  let action: EnrichedInstruction["action"] = "add";
  if (text.includes("remplace") || text.includes("change")) {
    action = "replace";
  } else if (text.includes("applique") || text.includes("peins") || text.includes("recouvre")) {
    action = "apply_texture";
  } else if (text.includes("ajoute") || text.includes("met") || text.includes("installe") || text.includes("pose")) {
    action = "add";
  } else if (text.includes("enlève") || text.includes("supprime")) {
    action = "remove";
  }

  // Forcer add pour les objets si refAnalysis indique un objet
  if (refAnalysis?.type === "product_photo" || refAnalysis?.type === "3d_render" || 
      refAnalysis?.type === "furniture_photo" || refAnalysis?.type === "technical_equipment") {
    if (action === "apply_texture") {
      action = "add";
    }
  }

  // Détecter la quantité
  let quantity: number | "all" | "some" | "partial" = 1;
  let quantityText = "1 élément";
  
  const numberMatch = text.match(/(\d+)\s*(panneau|table|chaise|meuble|lampe|plante|arbre|volet|fenêtre|porte)/i);
  if (numberMatch) {
    quantity = parseInt(numberMatch[1]);
    quantityText = numberMatch[0];
  } else if (text.includes("tous les") || text.includes("tout le") || text.includes("toute la")) {
    quantity = "all";
    quantityText = "tous les éléments";
  } else if (text.includes("une partie") || text.includes("section") || text.includes("partie")) {
    quantity = "partial";
    quantityText = "une partie";
  }

  // Détecter le côté
  let side: "left" | "right" | "center" | "top" | "bottom" | undefined;
  if (text.includes("droite") || text.includes("droit")) {
    side = "right";
  } else if (text.includes("gauche")) {
    side = "left";
  } else if (text.includes("centre") || text.includes("milieu")) {
    side = "center";
  } else if (text.includes("haut") || text.includes("supérieur")) {
    side = "top";
  } else if (text.includes("bas") || text.includes("inférieur")) {
    side = "bottom";
  }

  return {
    originalText: instructionText,
    action,
    quantity,
    quantityText,
    targetElement: refAnalysis?.category || "élément",
    targetZone: instructionText,
    zoneConstraints: {
      side,
      area: quantity === "partial" ? "partial" : quantity === "all" ? "full" : "specific",
      description: instructionText,
    },
    additionalNotes: [],
  };
}

/**
 * Construit les tâches à partir des instructions enrichies
 */
function buildTasksFromEnrichedInstructions(
  analysis: ImageAnalysis,
  instructions: GenerationInstruction[],
  referenceAnalyses: ReferenceAnalysis[],
  enrichedInstructions: EnrichedInstruction[]
): ModificationTask[] {
  const tasks: ModificationTask[] = [];

  for (let i = 0; i < enrichedInstructions.length; i++) {
    const enriched = enrichedInstructions[i];
    const instruction = instructions[i];
    const refAnalysis = referenceAnalyses[i];

    // Déterminer le type d'action pour le système
    let actionType: "apply_texture" | "replace_object" | "add_element" = "add_element";
    
    if (enriched.action === "apply_texture") {
      actionType = "apply_texture";
    } else if (enriched.action === "replace") {
      actionType = "replace_object";
    } else if (enriched.action === "add") {
      actionType = "add_element";
    }

    // Pour les OBJETS (panneaux solaires, meubles, etc.) → TOUJOURS add_element ou replace_object
    const isObjectReference = 
      refAnalysis?.type === "product_photo" ||
      refAnalysis?.type === "3d_render" ||
      refAnalysis?.type === "furniture_photo" ||
      refAnalysis?.type === "technical_equipment" ||
      refAnalysis?.type === "lighting_fixture" ||
      refAnalysis?.type === "plant_photo" ||
      refAnalysis?.type === "architectural_element";

    if (isObjectReference && actionType === "apply_texture") {
      actionType = "add_element";
    }

    // Chercher une zone/surface correspondante dans l'analyse
    const targetZone = findBestMatchingZone(analysis, enriched);

    // Construire la description de positionnement détaillée
    const positionDescription = buildPositionDescription(enriched);

    tasks.push({
      priority: i,
      targetSurface: targetZone.surface,
      targetObject: targetZone.object,
      targetZone: enriched.targetZone,
      targetMaterial: instruction.referenceName || refAnalysis?.category || "référence",
      referenceIndex: i,
      specificInstructions: enriched.originalText,
      actionType,
      referenceAnalysis: refAnalysis,
      elementCategory: targetZone.surface?.category || targetZone.object?.category,
      quantity: typeof enriched.quantity === "number" ? enriched.quantity : undefined,
      quantityText: enriched.quantityText,
      positionConstraints: {
        side: enriched.zoneConstraints.side,
        area: enriched.zoneConstraints.area,
        description: positionDescription,
      },
      enrichedInstruction: enriched,
    });
  }

  return tasks;
}

/**
 * Trouve la meilleure zone correspondante dans l'analyse
 */
function findBestMatchingZone(
  analysis: ImageAnalysis,
  enriched: EnrichedInstruction
): { surface?: SurfaceInfo; object?: ObjectInfo } {
  const text = enriched.originalText.toLowerCase();
  const element = enriched.targetElement.toLowerCase();

  // Chercher dans les surfaces
  for (const surface of analysis.surfaces || []) {
    const nameLower = surface.name.toLowerCase();
    const idLower = surface.id.toLowerCase();
    const catLower = (surface.category || "").toLowerCase();

    // Match par mot-clé dans l'instruction
    if (
      (text.includes("toit") || text.includes("toiture") || element.includes("toit")) &&
      (catLower.includes("roof") || idLower.includes("roof") || nameLower.includes("toit"))
    ) {
      // Affiner par côté si spécifié
      if (enriched.zoneConstraints.side === "right" && 
          (nameLower.includes("avant") || nameLower.includes("front"))) {
        return { surface };
      }
      if (enriched.zoneConstraints.side === "left" && 
          (nameLower.includes("arrière") || nameLower.includes("rear"))) {
        return { surface };
      }
      // Si pas de côté spécifié ou pas de match exact, retourner quand même
      return { surface };
    }

    if (
      (text.includes("mur") || text.includes("wall")) &&
      (catLower === "wall" || idLower.includes("wall"))
    ) {
      return { surface };
    }

    if (
      (text.includes("sol") || text.includes("floor") || text.includes("parquet")) &&
      (catLower === "floor" || idLower.includes("floor"))
    ) {
      return { surface };
    }

    if (
      (text.includes("façade") || text.includes("facade")) &&
      (catLower.includes("facade") || idLower.includes("facade"))
    ) {
      return { surface };
    }
  }

  // Chercher dans les objets
  for (const obj of analysis.objects || []) {
    const nameLower = obj.name.toLowerCase();
    const catLower = (obj.category || "").toLowerCase();

    if (
      (text.includes("table") || element.includes("table")) &&
      (catLower.includes("table") || nameLower.includes("table"))
    ) {
      return { object: obj };
    }

    if (
      (text.includes("chaise") || element.includes("chaise")) &&
      (catLower.includes("chair") || nameLower.includes("chaise"))
    ) {
      return { object: obj };
    }

    // ... autres matchings
  }

  return {};
}

/**
 * Construit une description de positionnement détaillée pour le prompt
 */
function buildPositionDescription(enriched: EnrichedInstruction): string {
  const parts: string[] = [];

  // Quantité
  if (typeof enriched.quantity === "number") {
    parts.push(`EXACTEMENT ${enriched.quantity} élément(s)`);
  } else if (enriched.quantity === "all") {
    parts.push("TOUS les éléments / zone complète");
  } else if (enriched.quantity === "partial") {
    parts.push("UNE PARTIE seulement");
  }

  // Côté/Position
  const sideLabels: Record<string, string> = {
    left: "côté GAUCHE",
    right: "côté DROIT", 
    center: "au CENTRE",
    top: "partie HAUTE / SUPÉRIEURE",
    bottom: "partie BASSE / INFÉRIEURE",
  };

  if (enriched.zoneConstraints.side) {
    parts.push(`Position: ${sideLabels[enriched.zoneConstraints.side]}`);
  }

  // Zone
  if (enriched.targetZone) {
    parts.push(`Zone: ${enriched.targetZone}`);
  }

  // Contraintes supplémentaires
  if (enriched.zoneConstraints.description) {
    parts.push(`Détails: ${enriched.zoneConstraints.description}`);
  }

  return parts.join(" | ");
}
