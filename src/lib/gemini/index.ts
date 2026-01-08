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
import {
  generateWithInpainting,
  buildInpaintingPromptFromContext,
  canUseInpainting,
  type InpaintingResult,
  type InpaintingContext,
} from "./agents/inpainting";
import { analyzeReferenceImage } from "./agents/reference-analyzer";

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
  const maskImages: (PreparedImage | null)[] = [];
  const hasAnyMask = instructions.some((instr) => canUseInpainting(instr));
  
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
    
    // Charger le masque si disponible
    if (instructions[i].maskImagePath) {
      const maskImage = await prepareImageForAPI(instructions[i].maskImagePath!);
      maskImages.push(maskImage);
      console.log(
        `   🎭 Masque ${i + 1}: ${(maskImage.base64.length / 1024).toFixed(0)} KB`
      );
    } else {
      maskImages.push(null);
    }
  }

  if (hasAnyMask) {
    console.log("\n🖌️ Mode INPAINTING activé (masques détectés)");
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
  // PHASE 3: GÉNÉRATION (INPAINTING OU GEMINI CLASSIQUE)
  // ═══════════════════════════════════════════════════════════════════════

  if (hasAnyMask) {
    console.log("\n🖌️ PHASE 3: INPAINTING avec Imagen 3 (Vertex AI)");
  } else {
    console.log("\n🎨 PHASE 3: Génération photoréaliste");
  }
  console.log("─".repeat(50));

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= GENERATION_CONFIG.maxRetries; attempt++) {
    console.log(`\n🔄 Tentative ${attempt}/${GENERATION_CONFIG.maxRetries}`);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // MODE INPAINTING (avec masques)
      // ─────────────────────────────────────────────────────────────────────
      if (hasAnyMask) {
        let currentImage = originalImage;
        let finalImagePath = "";
        let finalDescription = "";
        
        for (let i = 0; i < instructions.length; i++) {
          const instr = instructions[i];
          const mask = maskImages[i];
          const refImage = referenceImages[i];
          
          if (!mask) {
            console.log(`   ⏭️ Instruction ${i + 1}: pas de masque, ignorée`);
            continue;
          }
          
          console.log(`   🎯 Inpainting instruction ${i + 1}: "${instr.location}"`);
          
          // Récupérer la tâche correspondante du plan
          const task = plan.tasks.find((t) => t.referenceIndex === i);
          
          // Récupérer l'analyse de référence (déjà faite dans le planner)
          const refAnalysis = task?.referenceAnalysis;
          
          // Construire le prompt COMPLET avec tout le contexte
          const inpaintContext: InpaintingContext = {
            userInstruction: instr.location,
            referenceAnalysis: refAnalysis,
            task: task,
            imageAnalysis: analysis,
          };
          
          const inpaintPrompt = buildInpaintingPromptFromContext(inpaintContext);
          
          console.log("\n" + "─".repeat(50));
          console.log("📝 PROMPT INPAINTING COMPLET:");
          console.log("─".repeat(50));
          console.log(inpaintPrompt);
          console.log("─".repeat(50) + "\n");
          
          // Appeler l'API Imagen 3 (la description de la référence est dans le prompt)
          const inpaintResult = await generateWithInpainting(
            currentImage,
            mask,
            inpaintPrompt,
            `${generationId}_step${i}`,
            {
              maskDilation: 0.02,
              editSteps: 50,
              sampleCount: 1,
              editMode: "EDIT_MODE_INPAINT_INSERTION",
            }
          );
          
          finalImagePath = inpaintResult.imagePath;
          finalDescription = `Zone "${instr.location}" modifiée avec ${refAnalysis?.category || "référence"}`;
          
          // Pour les prochaines itérations, utiliser l'image modifiée
          if (i < instructions.length - 1) {
            currentImage = await prepareImageForAPI(finalImagePath);
          }
        }
        
        if (!finalImagePath) {
          throw new Error("Aucune image générée par inpainting");
        }
        
        const duration = Date.now() - startTime;
        
        console.log("\n" + "═".repeat(70));
        console.log("✅ INPAINTING RÉUSSI!");
        console.log(`   📁 ${finalImagePath}`);
        console.log(`   ⏱️  Durée: ${(duration / 1000).toFixed(1)}s`);
        console.log(`   🔢 Tentatives: ${attempt}`);
        console.log("═".repeat(70) + "\n");
        
        return {
          imagePath: finalImagePath,
          description: finalDescription,
          attempts: attempt,
          analysisDetails: analysis,
          duration,
        };
      }
      
      // ─────────────────────────────────────────────────────────────────────
      // MODE CLASSIQUE (sans masques)
      // ─────────────────────────────────────────────────────────────────────
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
  const maskImages: (PreparedImage | null)[] = [];
  
  // Vérifier si des masques sont disponibles pour l'inpainting
  const hasAnyMask = instructions.some((instr) => canUseInpainting(instr));
  
  for (let i = 0; i < instructions.length; i++) {
    const refImage = await prepareImageForAPI(
      instructions[i].referenceImagePath
    );
    referenceImages.push(refImage);
    log(
      "✓",
      `Référence ${i + 1}: ${(refImage.base64.length / 1024).toFixed(0)} KB`
    );
    
    // Charger le masque si disponible
    if (instructions[i].maskImagePath) {
      const maskImage = await prepareImageForAPI(instructions[i].maskImagePath!);
      maskImages.push(maskImage);
      log(
        "🎭",
        `Masque ${i + 1}: ${(maskImage.base64.length / 1024).toFixed(0)} KB`
      );
    } else {
      maskImages.push(null);
    }
  }

  if (hasAnyMask) {
    log("🖌️", "Mode INPAINTING activé (masques détectés)");
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

  const plan = await planModificationsWithAgent(
    analysis,
    instructions,
    referenceImages
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
  // PHASE 3: GÉNÉRATION (INPAINTING OU GEMINI CLASSIQUE)
  // ═══════════════════════════════════════════════════════════════════════

  setStep("generate", "loading");
  
  // Déterminer le mode de génération
  const useInpainting = hasAnyMask;
  
  if (useInpainting) {
    log("🖌️", "PHASE 3: INPAINTING avec Imagen 3 (Vertex AI)");
    log("🎭", "Utilisation des masques pour une édition précise");
  } else {
    log("🎨", "PHASE 3: Génération photoréaliste avec Gemini");
    log("🖼️", "Contraintes: cadrage identique, insertion réaliste, ombres cohérentes");
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= GENERATION_CONFIG.maxRetries; attempt++) {
    log("🔄", `Tentative ${attempt}/${GENERATION_CONFIG.maxRetries}`);

    try {
      // ─────────────────────────────────────────────────────────────────────
      // MODE INPAINTING (avec masques)
      // ─────────────────────────────────────────────────────────────────────
      if (useInpainting) {
        // Pour l'inpainting, on traite chaque instruction avec masque séquentiellement
        let currentImage = originalImage;
        let finalImagePath = "";
        let finalDescription = "";
        
        for (let i = 0; i < instructions.length; i++) {
          const instr = instructions[i];
          const mask = maskImages[i];
          const refImage = referenceImages[i];
          
          if (!mask) {
            log("⏭️", `Instruction ${i + 1}: pas de masque, ignorée pour inpainting`);
            continue;
          }
          
          log("🎯", `Inpainting instruction ${i + 1}: "${instr.location}"`);
          
          // Récupérer la tâche correspondante du plan (contient l'analyse de référence)
          const task = plan.tasks?.find((t) => t.referenceIndex === i);
          
          // Récupérer l'analyse de référence (déjà faite dans le planner)
          const refAnalysis = task?.referenceAnalysis;
          
          // Construire le prompt COMPLET avec tout le contexte
          const inpaintContext: InpaintingContext = {
            userInstruction: instr.location,
            referenceAnalysis: refAnalysis,
            task: task,
            imageAnalysis: analysis,
          };
          
          const inpaintPrompt = buildInpaintingPromptFromContext(inpaintContext);
          
          log("📝", `Prompt inpainting construit (${inpaintPrompt.length} chars)`);
          console.log("\n" + "─".repeat(50));
          console.log("📝 PROMPT INPAINTING COMPLET:");
          console.log("─".repeat(50));
          console.log(inpaintPrompt);
          console.log("─".repeat(50) + "\n");
          
          // Appeler l'API Imagen 3 (la description de la référence est dans le prompt)
          const inpaintResult = await generateWithInpainting(
            currentImage,
            mask,
            inpaintPrompt,
            `${generationId}_step${i}`,
            {
              maskDilation: 0.02,
              editSteps: 50,
              sampleCount: 1,
              editMode: "EDIT_MODE_INPAINT_INSERTION",
            }
          );
          
          finalImagePath = inpaintResult.imagePath;
          finalDescription = `Zone "${instr.location}" modifiée avec ${refAnalysis?.category || instr.referenceName || "référence"}`;
          
          // Pour les prochaines itérations, utiliser l'image modifiée
          if (i < instructions.length - 1) {
            currentImage = await prepareImageForAPI(finalImagePath);
          }
          
          log("✅", `Inpainting ${i + 1} terminé`);
        }
        
        if (!finalImagePath) {
          throw new Error("Aucune image générée par inpainting");
        }
        
        const duration = Date.now() - startTime;
        setStep("generate", "done");
        log("✅", `INPAINTING RÉUSSI en ${(duration / 1000).toFixed(1)}s!`);
        log("📁", `Image sauvegardée: ${finalImagePath}`);
        
        return {
          imagePath: finalImagePath,
          description: finalDescription,
          attempts: attempt,
          analysisDetails: analysis,
          duration,
        };
      }
      
      // ─────────────────────────────────────────────────────────────────────
      // MODE CLASSIQUE (sans masques - Gemini génératif)
      // ─────────────────────────────────────────────────────────────────────
      const prompt =
        attempt === 1
          ? plan.globalPrompt
          : buildSimplifiedRetryPrompt(instructions, plan.tasks, attempt);

      log("📝", `Envoi du prompt (${prompt.length} caractères)...`);

      const result = await generateWithNanoBanana(
        originalImage,
        referenceImages,
        prompt,
        outputDir,
        generationId
      );

      const duration = Date.now() - startTime;

      setStep("generate", "done");
      log("✅", `GÉNÉRATION RÉUSSIE en ${(duration / 1000).toFixed(1)}s!`);
      log("📁", `Image sauvegardée: ${result.imagePath}`);

      if (result.thoughtCount > 0) {
        log("🧠", `Mode Thinking: ${result.thoughtCount} image(s) intermédiaire(s)`);
      }

      return {
        imagePath: result.imagePath,
        description: result.description,
        attempts: attempt,
        analysisDetails: analysis,
        duration,
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
