// ============================================================================
// MODULE GEMINI - POINT D'ENTRÉE PRINCIPAL
// ============================================================================
// Système agentique polyvalent pour la visualisation avant/après
// Couvre TOUS les métiers du bâtiment et de l'aménagement
// ============================================================================

import { GoogleGenAI } from "@google/genai";
import { GENERATION_CONFIG, MODELS } from "./config";
import { prepareImageForAPI, sleep } from "./utils/image";
import { analyzeImageWithAgent } from "./agents/analyzer";
import { planModificationsWithAgent } from "./agents/planner";
import { generateWithNanoBanana } from "./agents/generator";
import { buildSimplifiedRetryPrompt } from "./prompts/builder";

// Re-export des types
export * from "./types";
export { MODELS, IMAGE_CONFIG, GENERATION_CONFIG } from "./config";

// Import des types nécessaires
import type {
  GenerationInstruction,
  GenerationResult,
  GenerationOptions,
  ProgressCallback,
  ProgressEvent,
  PreparedImage,
} from "./types";

// Client AI partagé
const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.AI_GOOGLE_API_KEY || process.env.AI_GOOGLE_API_KEY || "",
});

// ============================================================================
// FONCTION PRINCIPALE: ORCHESTRATION AGENTIQUE
// ============================================================================

/**
 * Génère une image avant/après avec le système agentique
 */
export async function generateBeforeAfter(
  originalImagePath: string,
  instructions: GenerationInstruction[],
  outputDir: string,
  generationId: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const startTime = Date.now();

  console.log("\n" + "═".repeat(70));
  console.log("🤖 SYSTÈME AGENTIQUE DE GÉNÉRATION AVANT/APRÈS");
  console.log("   Couvre tous les métiers du bâtiment et de l'aménagement");
  console.log("═".repeat(70));
  console.log(`📋 ${instructions.length} instruction(s) de l'utilisateur:`);
  console.log(`🆔 ID: ${generationId}`);
  console.log("");

  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    console.log(`   📌 Instruction ${i + 1}:`);
    console.log(`      └─ Emplacement: "${instr.location}"`);
    console.log(`      └─ Nom: ${instr.referenceName || "(sans nom)"}`);
    console.log(`      └─ Image: ${instr.referenceImagePath}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHARGEMENT DES IMAGES
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n📸 Chargement des images...");
  const originalImage = await prepareImageForAPI(originalImagePath);
  console.log(
    `   ✓ Original: ${(originalImage.base64.length / 1024).toFixed(0)} KB`
  );

  const referenceImages: PreparedImage[] = [];
  for (let i = 0; i < instructions.length; i++) {
    const refImage = await prepareImageForAPI(
      instructions[i].referenceImagePath
    );
    referenceImages.push(refImage);
    console.log(
      `   ✓ Référence ${i + 1}: ${(refImage.base64.length / 1024).toFixed(
        0
      )} KB`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: ANALYSE AGENTIQUE
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n🔬 PHASE 1: Analyse intelligente multi-métiers");
  console.log("─".repeat(50));

  const analysis = await analyzeImageWithAgent(originalImage);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: PLANIFICATION DES MODIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n📊 PHASE 2: Planification et mapping des éléments");
  console.log("─".repeat(50));

  const plan = await planModificationsWithAgent(
    analysis,
    instructions,
    referenceImages
  );

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: GÉNÉRATION AVEC RETRY
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n🎨 PHASE 3: Génération photoréaliste");
  console.log("─".repeat(50));

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= GENERATION_CONFIG.maxRetries; attempt++) {
    console.log(`\n🔄 Tentative ${attempt}/${GENERATION_CONFIG.maxRetries}`);

    try {
      // Premier essai: prompt complet. Retries: prompt simplifié
      const prompt =
        attempt === 1
          ? plan.globalPrompt
          : buildSimplifiedRetryPrompt(instructions, plan.tasks, attempt);

      const result = await generateWithNanoBanana(
        originalImage,
        referenceImages,
        prompt,
        outputDir,
        generationId
      );

      const duration = Date.now() - startTime;

      console.log("\n" + "═".repeat(70));
      console.log("✅ GÉNÉRATION RÉUSSIE!");
      console.log(`   📁 ${result.imagePath}`);
      console.log(`   ⏱️  Durée: ${(duration / 1000).toFixed(1)}s`);
      console.log(`   🔢 Tentatives: ${attempt}`);
      console.log("═".repeat(70) + "\n");

      return {
        imagePath: result.imagePath,
        description: result.description,
        attempts: attempt,
        analysisDetails: analysis,
        duration,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`   ❌ Échec: ${lastError.message.substring(0, 200)}`);

      if (attempt < GENERATION_CONFIG.maxRetries) {
        const delay = Math.min(
          GENERATION_CONFIG.initialDelayMs *
            Math.pow(GENERATION_CONFIG.backoffMultiplier, attempt - 1),
          GENERATION_CONFIG.maxDelayMs
        );
        console.log(`   ⏳ Nouveau essai dans ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Échec après ${GENERATION_CONFIG.maxRetries} tentatives. ${lastError?.message}`
  );
}

// ============================================================================
// FONCTION AVEC PROGRESS CALLBACK POUR STREAMING SSE
// ============================================================================

/**
 * Génère une image avec callbacks de progression pour le streaming SSE
 */
export async function generateBeforeAfterWithProgress(
  originalImagePath: string,
  instructions: GenerationInstruction[],
  outputDir: string,
  generationId: string,
  onProgress: ProgressCallback,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const startTime = Date.now();

  const log = (icon: string, message: string) => {
    console.log(`${icon} ${message}`);
    onProgress({ type: "log", icon, message });
  };

  const setStep = (
    step: string,
    status: "pending" | "loading" | "done" | "error"
  ) => {
    onProgress({ type: "step", step, status });
  };

  log("🤖", "SYSTÈME AGENTIQUE DE GÉNÉRATION AVANT/APRÈS");
  log("🏗️", "Couvre tous les métiers du bâtiment et de l'aménagement");
  log("📋", `${instructions.length} instruction(s) de l'utilisateur`);
  log("🆔", `ID: ${generationId}`);

  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    log(
      "📌",
      `Instruction ${i + 1}: "${instr.location}" - ${
        instr.referenceName || "(sans nom)"
      }`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHARGEMENT DES IMAGES
  // ═══════════════════════════════════════════════════════════════════════

  setStep("upload", "loading");
  log("📸", "Chargement des images depuis S3...");

  const originalImage = await prepareImageForAPI(originalImagePath);
  log("✓", `Original: ${(originalImage.base64.length / 1024).toFixed(0)} KB`);

  const referenceImages: PreparedImage[] = [];
  for (let i = 0; i < instructions.length; i++) {
    const refImage = await prepareImageForAPI(
      instructions[i].referenceImagePath
    );
    referenceImages.push(refImage);
    log(
      "✓",
      `Référence ${i + 1}: ${(refImage.base64.length / 1024).toFixed(0)} KB`
    );
  }

  // Charger les masques s'ils existent
  const maskImages: (PreparedImage | null)[] = [];
  const combinedMaskImages: (PreparedImage | null)[] = [];
  let hasMasks = false;

  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    if (instr.maskImagePath) {
      try {
        log("🎭", `Chargement masque ${i + 1}...`);
        const maskImage = await prepareImageForAPI(instr.maskImagePath);
        maskImages.push(maskImage);
        hasMasks = true;

        // Créer le masque combiné (référence dans la zone du masque)
        const { createCombinedMaskImage } = await import("./utils/image");
        const combinedMask = await createCombinedMaskImage(
          originalImage,
          maskImage,
          referenceImages[i]
        );
        combinedMaskImages.push(combinedMask);
        
        // Stocker dans l'instruction pour utilisation ultérieure
        instructions[i].combinedMaskBase64 = combinedMask.base64;
        
        log("✓", `Masque combiné ${i + 1}: ${(combinedMask.base64.length / 1024).toFixed(0)} KB`);
      } catch (error) {
        console.warn(`⚠️ Impossible de charger le masque ${i + 1}:`, error);
        maskImages.push(null);
        combinedMaskImages.push(null);
      }
    } else {
      maskImages.push(null);
      combinedMaskImages.push(null);
    }
  }

  if (hasMasks) {
    log("🎯", `${maskImages.filter(m => m !== null).length} masque(s) chargé(s) et combiné(s)`);
  }

  setStep("upload", "done");

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: ANALYSE AGENTIQUE
  // ═══════════════════════════════════════════════════════════════════════

  setStep("analyze", "loading");
  log("🔬", "PHASE 1: Analyse intelligente multi-métiers");
  log("🧠", "Identification des surfaces, objets, équipements, végétation...");

  const analysis = await analyzeImageWithAgent(originalImage);

  log(
    "✓",
    `Analyse: ${analysis.spaceType} (${analysis.environment}) - ${
      analysis.surfaces?.length || 0
    } surfaces, ${(analysis.objects || []).length} objets`
  );
  
  if (analysis.technicalEquipment && analysis.technicalEquipment.length > 0) {
    log("⚙️", `${analysis.technicalEquipment.length} équipement(s) technique(s) identifié(s)`);
  }
  
  if (analysis.vegetation && analysis.vegetation.length > 0) {
    log("🌿", `${analysis.vegetation.length} élément(s) végétal(aux) identifié(s)`);
  }

  setStep("analyze", "done");

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: PLANIFICATION DES MODIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  setStep("plan", "loading");
  log("📊", "PHASE 2: Planification et mapping des éléments");
  log("🗺️", "Analyse des références et création du plan...");

  // Passer les masques au planner si disponibles
  const plan = await planModificationsWithAgent(
    analysis,
    instructions,
    referenceImages,
    hasMasks ? originalImage : undefined,
    hasMasks ? maskImages : undefined
  );

  log("✓", `Plan créé: ${plan.tasks?.length || 0} tâche(s) de modification`);
  if (plan.tasks && plan.tasks.length > 0) {
    for (const task of plan.tasks) {
      const targetName = task.targetSurface?.name || task.targetObject?.name || "Cible";
      const actionEmoji =
        task.actionType === "replace_object"
          ? "🔄"
          : task.actionType === "add_element"
          ? "➕"
          : "🎨";
      log(
        "📍",
        `${actionEmoji} ${task.actionType}: ${targetName} → ${task.targetMaterial.substring(0, 40)}`
      );
    }
  }

  if (plan.warnings && plan.warnings.length > 0) {
    for (const warning of plan.warnings) {
      onProgress({ type: "warning", message: warning });
    }
  }

  setStep("plan", "done");

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: GÉNÉRATION AVEC RETRY
  // ═══════════════════════════════════════════════════════════════════════

  setStep("generate", "loading");
  log("🎨", "PHASE 3: Génération photoréaliste avec Gemini");
  log("🖼️", "Contraintes: cadrage identique, insertion réaliste, ombres cohérentes");

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= GENERATION_CONFIG.maxRetries; attempt++) {
    log("🔄", `Tentative ${attempt}/${GENERATION_CONFIG.maxRetries}`);

    try {
      const prompt =
        attempt === 1
          ? plan.globalPrompt
          : buildSimplifiedRetryPrompt(instructions, plan.tasks, attempt);

      log("📝", `Envoi du prompt (${prompt.length} caractères)...`);

      // Passer les masques combinés si disponibles
      const result = await generateWithNanoBanana(
        originalImage,
        referenceImages,
        prompt,
        outputDir,
        generationId,
        hasMasks ? combinedMaskImages : undefined
      );

      const duration = Date.now() - startTime;

      setStep("generate", "done");
      log("✅", `GÉNÉRATION RÉUSSIE en ${(duration / 1000).toFixed(1)}s!`);
      log("📁", `Image sauvegardée: ${result.imagePath}`);

      if (result.thoughtCount > 0) {
        log("🧠", `Mode Thinking: ${result.thoughtCount} image(s) intermédiaire(s)`);
      }

      // Sauvegarder les masques combinés pour debug si présents
      const combinedMaskPaths: string[] = [];
      if (hasMasks && combinedMaskImages) {
        const { saveBuffer } = await import("../storage");
        for (let maskIdx = 0; maskIdx < combinedMaskImages.length; maskIdx++) {
          const combinedMask = combinedMaskImages[maskIdx];
          if (combinedMask) {
            try {
              const maskFileName = `combined_mask_${generationId}_${maskIdx}.png`;
              const maskBuffer = Buffer.from(combinedMask.base64, "base64");
              const maskPath = await saveBuffer(maskBuffer, maskFileName, "generated");
              combinedMaskPaths.push(maskPath);
              log("🎭", `Masque combiné ${maskIdx + 1} sauvegardé pour debug`);
            } catch (e) {
              console.warn(`Impossible de sauvegarder le masque combiné ${maskIdx}:`, e);
            }
          }
        }
      }

      return {
        imagePath: result.imagePath,
        description: result.description,
        attempts: attempt,
        analysisDetails: analysis,
        duration,
        combinedMaskPaths: combinedMaskPaths.length > 0 ? combinedMaskPaths : undefined,
      };
    } catch (error) {
      lastError = error as Error;
      log(
        "❌",
        `Échec: ${(lastError?.message || "Erreur inconnue").substring(0, 150)}`
      );

      if (attempt < GENERATION_CONFIG.maxRetries) {
        const delay = Math.min(
          GENERATION_CONFIG.initialDelayMs *
            Math.pow(GENERATION_CONFIG.backoffMultiplier, attempt - 1),
          GENERATION_CONFIG.maxDelayMs
        );
        log("⏳", `Nouveau essai dans ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  setStep("generate", "error");
  onProgress({
    type: "error",
    message: `Échec après ${GENERATION_CONFIG.maxRetries} tentatives: ${lastError?.message}`,
  });

  throw new Error(
    `Échec après ${GENERATION_CONFIG.maxRetries} tentatives. ${lastError?.message}`
  );
}

// ============================================================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ============================================================================

/**
 * Analyse une image pour identifier les zones modifiables
 */
export async function analyzeImage(imagePath: string): Promise<string> {
  const imageData = await prepareImageForAPI(imagePath);

  const response = await ai.models.generateContent({
    model: MODELS.analyzer,
    contents: [
      {
        text: `Analyse cette image d'un espace et identifie TOUS les éléments modifiables.

Couvre TOUS les métiers: rénovation, décoration, menuiserie, plomberie, électricité, 
chauffage, énergie (solaire, PAC), paysagisme, toiture, façade, piscine, etc.

Pour chaque élément:
1. **Nom**: Description précise (ex: "Mur nord", "Fenêtre principale", "Radiateur")
2. **Catégorie**: Type d'élément (surface, meuble, équipement technique, végétation...)
3. **État actuel**: Type de revêtement ou équipement actuel
4. **Modifications possibles**: Alternatives envisageables

Sois EXHAUSTIF et couvre tous les éléments visibles.`,
      },
      { inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } },
    ],
  });

  return (
    response.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Analyse non disponible"
  );
}

/**
 * Valide une image de référence
 */
export async function validateReference(imagePath: string): Promise<{
  valid: boolean;
  type?: string;
  category?: string;
  quality?: string;
  suggestions?: string;
}> {
  const imageData = await prepareImageForAPI(imagePath);

  const response = await ai.models.generateContent({
    model: MODELS.analyzer,
    contents: [
      {
        text: `Cette image doit servir de référence pour une modification d'espace.

Analyse et détermine:
1. Type: texture/matériau OU objet/produit OU végétation OU équipement technique
2. Catégorie précise
3. Qualité de l'image pour une intégration photoréaliste

Réponds avec ce JSON (sans markdown):
{
  "valid": true ou false,
  "type": "texture | product | plant | equipment | architectural | other",
  "category": "catégorie précise",
  "quality": "excellente" | "bonne" | "moyenne" | "insuffisante",
  "suggestions": "conseils pour améliorer l'intégration si nécessaire"
}`,
      },
      { inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } },
    ],
  });

  try {
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn("Parsing validation échoué:", e);
  }

  return { valid: true, type: "unknown", category: "Élément", quality: "inconnue" };
}
