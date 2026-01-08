// ============================================================================
// AGENT PLANIFICATEUR - CRÉATION DU PLAN DE MODIFICATION
// ============================================================================
// Analyse les instructions utilisateur et les références pour créer
// un plan de modification précis avec mapping des zones/objets
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
 * Agent Planificateur - Crée le plan de modification
 */
export async function planModificationsWithAgent(
  analysis: ImageAnalysis,
  instructions: GenerationInstruction[],
  referenceImages: PreparedImage[]
): Promise<ModificationPlan> {
  console.log("   📋 Agent Planificateur: Analyse des modifications...");

  // 1. Analyser chaque image de référence
  console.log("\n   🔍 Étape 1: Analyse des images de référence...");
  const referenceAnalyses: ReferenceAnalysis[] = [];
  for (let i = 0; i < referenceImages.length; i++) {
    console.log(`   📷 Analyse référence ${i + 1}/${referenceImages.length}...`);
    const refAnalysis = await analyzeReferenceImage(referenceImages[i]);
    referenceAnalyses.push(refAnalysis);
  }

  // 2. Construire le contexte pour le planificateur
  const surfacesContext = (analysis.surfaces || [])
    .map(
      (s) =>
        `- SURFACE | ID: "${s.id}" | Nom: "${s.name}" | Catégorie: ${s.category} | Matériau: ${s.currentMaterial}`
    )
    .join("\n");

  const objectsContext = (analysis.objects || [])
    .map(
      (o) =>
        `- OBJET | ID: "${o.id}" | Nom: "${o.name}" | Catégorie: ${o.category} | Style: ${o.style} | Position: ${o.position}`
    )
    .join("\n");

  const technicalContext = (analysis.technicalEquipment || [])
    .map(
      (e) =>
        `- ÉQUIPEMENT | ID: "${e.id}" | Type: "${e.type}" | Catégorie: ${e.category} | Position: ${e.position}`
    )
    .join("\n");

  const vegetationContext = (analysis.vegetation || [])
    .map(
      (v) =>
        `- VÉGÉTATION | ID: "${v.id}" | Type: "${v.type}" | Catégorie: ${v.category} | Position: ${v.position}`
    )
    .join("\n");

  const referencesContext = instructions
    .map((instr, i) => {
      const refAnalysis = referenceAnalyses[i];
      return `${i + 1}. Instruction utilisateur: "${instr.location}"
     → Référence: ${instr.referenceName || "image " + (i + 1)}
     → Type détecté: ${refAnalysis?.type?.toUpperCase() || "INCONNU"} (${refAnalysis?.category || "non analysé"})
     → Action suggérée: ${refAnalysis?.action || "apply_texture"}
     → Style: ${refAnalysis?.style || "non spécifié"} | Matériau: ${refAnalysis?.material || "non spécifié"}`;
    })
    .join("\n\n");

  const planningPrompt = `Tu es un expert en aménagement qui doit créer un PLAN DE MODIFICATION précis.

ÉLÉMENTS IDENTIFIÉS DANS L'IMAGE ORIGINALE:

SURFACES (murs, sols, plafonds, façades, toitures):
${surfacesContext || "Aucune surface identifiée"}

OBJETS (meubles, luminaires, équipements, décorations):
${objectsContext || "Aucun objet identifié"}

ÉQUIPEMENTS TECHNIQUES (électricité, plomberie, chauffage):
${technicalContext || "Aucun équipement technique identifié"}

VÉGÉTATION (plantes, arbres):
${vegetationContext || "Aucune végétation identifiée"}

INSTRUCTIONS DE L'UTILISATEUR AVEC ANALYSE DES RÉFÉRENCES:
${referencesContext}

Ta mission: Créer un PLAN DE MODIFICATION INTELLIGENT.

RÈGLES DE MAPPING:

1. Si la référence est un MATÉRIAU/TEXTURE:
   → action = "apply_texture"
   → Mapper sur les SURFACES correspondantes (murs, sol, plafond, façade)

2. Si la référence est un OBJET/PRODUIT:
   → action = "replace_object" si un objet similaire existe
   → action = "add_element" si c'est un ajout
   → Mapper sur l'OBJET correspondant par catégorie

3. MATCHING PAR MOTS-CLÉS:
   - "mur", "wall" → surfaces de type wall
   - "sol", "floor", "parquet", "carrelage" → surfaces de type floor
   - "plafond", "ceiling" → surfaces de type ceiling
   - "façade", "facade" → surfaces de type facade
   - "table" → objets de catégorie table/dining_table
   - "chaise" → objets de catégorie chair
   - "canapé", "sofa" → objets de catégorie sofa
   - "lampe", "luminaire", "lustre" → objets de catégorie lighting
   - "plante" → végétation
   - "fenêtre", "window" → objets de type window
   - "porte", "door" → objets de type door
   - "radiateur" → équipements de type radiator
   - "panneau solaire", "solar" → équipements de type solar_panel
   - "tous les murs" → TOUTES les surfaces de type wall

Réponds avec ce JSON (sans markdown):
{
  "mappings": [
    {
      "instructionIndex": 0,
      "action": "apply_texture | replace_object | add_element",
      "targetType": "surface | object | equipment | vegetation",
      "targetIds": ["wall_north", "wall_south"],
      "interpretation": "Description claire de ce qui sera fait",
      "confidence": 0.95
    }
  ],
  "warnings": ["Avertissement si quelque chose n'est pas clair"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.analyzer,
      contents: [{ text: planningPrompt }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const mapping = JSON.parse(jsonMatch[0]);
      const tasks = buildTasksFromMapping(
        mapping,
        analysis,
        instructions,
        referenceAnalyses
      );

      console.log(`\n   ✓ ${tasks.length} tâches de modification planifiées:`);
      for (const task of tasks) {
        const targetName =
          task.targetSurface?.name || task.targetObject?.name || "Cible";
        const emoji =
          task.actionType === "replace_object"
            ? "🔄"
            : task.actionType === "add_element"
            ? "➕"
            : "🎨";
        console.log(
          `      ${emoji} ${task.actionType}: ${targetName} → ${task.targetMaterial}`
        );
      }

      // Importer buildOptimizedPrompt dynamiquement pour éviter la dépendance circulaire
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
        warnings: mapping.warnings,
      };
    }
  } catch (error) {
    console.warn("   ⚠️ Planification échouée, utilisation du mapping direct");
    console.error("   Erreur:", error);
  }

  // Fallback: mapping direct
  const tasks = buildDirectMapping(analysis, instructions, referenceAnalyses);
  const { buildOptimizedPrompt } = await import("../prompts/builder");

  return {
    originalAnalysis: analysis,
    tasks,
    globalPrompt: buildOptimizedPrompt(
      analysis,
      tasks,
      instructions,
      referenceAnalyses
    ),
  };
}

/**
 * Construit les tâches à partir du mapping de l'IA
 */
function buildTasksFromMapping(
  mapping: any,
  analysis: ImageAnalysis,
  instructions: GenerationInstruction[],
  referenceAnalyses: ReferenceAnalysis[]
): ModificationTask[] {
  const tasks: ModificationTask[] = [];

  for (const m of mapping.mappings || []) {
    const instruction = instructions[m.instructionIndex];
    const refAnalysis = referenceAnalyses[m.instructionIndex];
    const actionType = m.action || refAnalysis?.action || "apply_texture";

    for (const targetId of m.targetIds || []) {
      if (m.targetType === "surface") {
        const surface = (analysis.surfaces || []).find((s) => s.id === targetId);
        if (surface) {
          tasks.push({
            priority: m.instructionIndex,
            targetSurface: surface,
            targetMaterial:
              instruction.referenceName ||
              refAnalysis?.category ||
              "matériau de référence",
            referenceIndex: m.instructionIndex,
            specificInstructions: m.interpretation || instruction.location,
            actionType: actionType,
            referenceAnalysis: refAnalysis,
            elementCategory: surface.category,
            matchConfidence: m.confidence,
          });
        }
      } else if (
        m.targetType === "object" ||
        m.targetType === "equipment" ||
        m.targetType === "vegetation"
      ) {
        // Chercher dans les objets
        let targetObj = (analysis.objects || []).find((o) => o.id === targetId);

        // Chercher dans les équipements techniques
        if (!targetObj && analysis.technicalEquipment) {
          const equipment = analysis.technicalEquipment.find(
            (e) => e.id === targetId
          );
          if (equipment) {
            targetObj = {
              id: equipment.id,
              name: equipment.type,
              category: equipment.category,
              description: equipment.type,
              position: equipment.position,
              style: "",
              material: "",
              color: "",
            };
          }
        }

        // Chercher dans la végétation
        if (!targetObj && analysis.vegetation) {
          const veg = analysis.vegetation.find((v) => v.id === targetId);
          if (veg) {
            targetObj = {
              id: veg.id,
              name: veg.type,
              category: veg.category,
              description: veg.type,
              position: veg.position,
              style: "",
              material: "végétal",
              color: "vert",
            };
          }
        }

        if (targetObj) {
          tasks.push({
            priority: m.instructionIndex,
            targetObject: targetObj,
            targetMaterial:
              instruction.referenceName ||
              refAnalysis?.category ||
              "élément de référence",
            referenceIndex: m.instructionIndex,
            specificInstructions: m.interpretation || instruction.location,
            actionType: actionType === "apply_texture" ? "replace_object" : actionType,
            referenceAnalysis: refAnalysis,
            elementCategory: targetObj.category,
            matchConfidence: m.confidence,
          });
        }
      }
    }
  }

  // Résolution des conflits (même élément assigné plusieurs fois)
  const elementAssignments = new Map<string, ModificationTask>();
  for (const task of tasks) {
    const id = task.targetSurface?.id || task.targetObject?.id || "";
    const existing = elementAssignments.get(id);
    if (existing) {
      // Garder la tâche avec la plus haute priorité (index le plus élevé = plus récent)
      if (task.referenceIndex > existing.referenceIndex) {
        elementAssignments.set(id, task);
      }
    } else {
      elementAssignments.set(id, task);
    }
  }

  return Array.from(elementAssignments.values());
}

/**
 * Mapping direct basé sur les mots-clés (fallback)
 */
function buildDirectMapping(
  analysis: ImageAnalysis,
  instructions: GenerationInstruction[],
  referenceAnalyses: ReferenceAnalysis[]
): ModificationTask[] {
  const tasks: ModificationTask[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    const location = instr.location.toLowerCase();
    const refAnalysis = referenceAnalyses[i];
    const actionType = refAnalysis?.action || "apply_texture";

    // Détection par mots-clés
    const matchedSurfaces: SurfaceInfo[] = [];
    const matchedObjects: ObjectInfo[] = [];

    // Matcher les surfaces
    for (const surface of analysis.surfaces || []) {
      const nameLower = surface.name.toLowerCase();
      const idLower = surface.id.toLowerCase();

      if (
        (location.includes("mur") || location.includes("wall")) &&
        (idLower.includes("wall") || surface.category === "wall")
      ) {
        matchedSurfaces.push(surface);
      } else if (
        (location.includes("sol") || location.includes("floor") || location.includes("parquet")) &&
        (idLower.includes("floor") || surface.category === "floor")
      ) {
        matchedSurfaces.push(surface);
      } else if (
        (location.includes("plafond") || location.includes("ceiling")) &&
        (idLower.includes("ceiling") || surface.category === "ceiling")
      ) {
        matchedSurfaces.push(surface);
      } else if (
        (location.includes("façade") || location.includes("facade")) &&
        (idLower.includes("facade") || surface.category === "facade")
      ) {
        matchedSurfaces.push(surface);
      } else if (location.includes("tous les murs") && surface.category === "wall") {
        matchedSurfaces.push(surface);
      }
    }

    // Matcher les objets
    for (const obj of analysis.objects || []) {
      const nameLower = obj.name.toLowerCase();
      const catLower = (obj.category || "").toLowerCase();

      if (
        location.includes("table") &&
        (catLower.includes("table") || nameLower.includes("table"))
      ) {
        matchedObjects.push(obj);
      } else if (
        location.includes("chaise") &&
        (catLower.includes("chair") || nameLower.includes("chaise"))
      ) {
        matchedObjects.push(obj);
      } else if (
        (location.includes("lampe") ||
          location.includes("luminaire") ||
          location.includes("lustre")) &&
        (catLower.includes("light") ||
          catLower.includes("lamp") ||
          catLower.includes("chandelier"))
      ) {
        matchedObjects.push(obj);
      } else if (
        (location.includes("canapé") || location.includes("sofa")) &&
        (catLower.includes("sofa") || catLower.includes("couch"))
      ) {
        matchedObjects.push(obj);
      } else if (
        location.includes("fenêtre") &&
        (catLower.includes("window") || nameLower.includes("fenêtre"))
      ) {
        matchedObjects.push(obj);
      } else if (
        location.includes("porte") &&
        (catLower.includes("door") || nameLower.includes("porte"))
      ) {
        matchedObjects.push(obj);
      } else if (
        location.includes("radiateur") &&
        (catLower.includes("radiator") || nameLower.includes("radiateur"))
      ) {
        matchedObjects.push(obj);
      }
    }

    // Créer les tâches
    if (actionType === "apply_texture" && matchedSurfaces.length > 0) {
      for (const surface of matchedSurfaces) {
        tasks.push({
          priority: i,
          targetSurface: surface,
          targetMaterial: instr.referenceName || refAnalysis?.category || "référence",
          referenceIndex: i,
          specificInstructions: instr.location,
          actionType: "apply_texture",
          referenceAnalysis: refAnalysis,
          elementCategory: surface.category,
        });
      }
    } else if (matchedObjects.length > 0) {
      for (const obj of matchedObjects) {
        tasks.push({
          priority: i,
          targetObject: obj,
          targetMaterial: instr.referenceName || refAnalysis?.category || "référence",
          referenceIndex: i,
          specificInstructions: instr.location,
          actionType: actionType === "apply_texture" ? "replace_object" : actionType,
          referenceAnalysis: refAnalysis,
          elementCategory: obj.category,
        });
      }
    } else if (matchedSurfaces.length > 0) {
      for (const surface of matchedSurfaces) {
        tasks.push({
          priority: i,
          targetSurface: surface,
          targetMaterial: instr.referenceName || refAnalysis?.category || "référence",
          referenceIndex: i,
          specificInstructions: instr.location,
          actionType: "apply_texture",
          referenceAnalysis: refAnalysis,
          elementCategory: surface.category,
        });
      }
    } else {
      // Fallback: première surface disponible
      const defaultSurface = (analysis.surfaces || [])[0];
      if (defaultSurface) {
        tasks.push({
          priority: i,
          targetSurface: defaultSurface,
          targetMaterial: instr.referenceName || refAnalysis?.category || "référence",
          referenceIndex: i,
          specificInstructions: instr.location,
          actionType: "apply_texture",
          referenceAnalysis: refAnalysis,
        });
      }
    }
  }

  console.log(`   ✓ ${tasks.length} tâches (mapping direct)`);
  return tasks;
}
