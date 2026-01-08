// ============================================================================
// AGENT INPAINTING - ÉDITION D'IMAGE AVEC IMAGEN 3 (VERTEX AI)
// ============================================================================
// Utilise l'API Vertex AI Imagen 3 pour l'inpainting (insertion d'objets)
// Documentation: https://cloud.google.com/vertex-ai/generative-ai/docs/image/edit-insert-objects
// ============================================================================

import { GoogleAuth } from "google-auth-library";
import { saveBuffer } from "../../storage";
import type { PreparedImage, ReferenceAnalysis, ModificationTask, ImageAnalysis } from "../types";

// Configuration Vertex AI
const VERTEX_AI_REGION = import.meta.env.VERTEX_AI_REGION || process.env.VERTEX_AI_REGION || "europe-west1";
const GOOGLE_PROJECT_ID = import.meta.env.AI_GOOGLE_NAME || process.env.AI_GOOGLE_NAME || "";

// Debug: afficher le project ID au chargement
console.log(`[Inpainting] Project ID configuré: ${GOOGLE_PROJECT_ID}`);

// Modèle Imagen 3 pour l'édition
const IMAGEN_MODEL = "imagen-3.0-capability-001";

// Client d'authentification Google (singleton)
let authClient: GoogleAuth | null = null;

/**
 * Obtient un token d'accès OAuth pour Vertex AI via Application Default Credentials
 */
async function getAccessToken(): Promise<string> {
  if (!authClient) {
    authClient = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }
  
  const client = await authClient.getClient();
  const tokenResponse = await client.getAccessToken();
  
  if (!tokenResponse.token) {
    throw new Error(
      "Impossible d'obtenir un token OAuth pour Vertex AI. " +
      "Assurez-vous d'avoir configuré GOOGLE_APPLICATION_CREDENTIALS ou d'être authentifié via gcloud."
    );
  }
  
  return tokenResponse.token;
}

/**
 * Configuration pour l'inpainting
 */
export interface InpaintingConfig {
  /** Dilatation du masque (0-1, recommandé 0.01-0.03) */
  maskDilation?: number;
  /** Nombre d'étapes de sampling (35-75, recommandé 35-50) */
  editSteps?: number;
  /** Nombre d'images à générer (1-4) */
  sampleCount?: number;
  /** Mode d'édition */
  editMode?: "EDIT_MODE_INPAINT_INSERTION" | "EDIT_MODE_INPAINT_REMOVAL";
}

/**
 * Contexte complet pour construire un prompt d'inpainting riche
 */
export interface InpaintingContext {
  /** Instruction utilisateur originale */
  userInstruction: string;
  /** Analyse de l'image de référence */
  referenceAnalysis?: ReferenceAnalysis;
  /** Tâche de modification du plan */
  task?: ModificationTask;
  /** Analyse de l'image originale */
  imageAnalysis?: ImageAnalysis;
}

/**
 * Résultat de l'inpainting
 */
export interface InpaintingResult {
  imagePath: string;
  mimeType: string;
  allResults?: Array<{
    imagePath: string;
    mimeType: string;
  }>;
}

/**
 * Appelle l'API Vertex AI Imagen 3 pour l'inpainting
 * @param baseImage - Image de base à modifier
 * @param maskImage - Masque (blanc = zone à modifier)
 * @param prompt - Prompt de génération (doit contenir la description détaillée de la référence)
 * @param config - Configuration
 */
async function callVertexAIImagen(
  baseImage: PreparedImage,
  maskImage: PreparedImage,
  prompt: string,
  config: InpaintingConfig = {}
): Promise<Array<{ bytesBase64Encoded: string; mimeType: string }>> {
  const {
    maskDilation = 0.02,
    editSteps = 50,
    sampleCount = 1,
    editMode = "EDIT_MODE_INPAINT_INSERTION",
  } = config;

  console.log(`   🎨 Appel Vertex AI Imagen 3 (${IMAGEN_MODEL})`);
  console.log(`   📍 Région: ${VERTEX_AI_REGION}`);
  console.log(`   📝 Prompt (${prompt.length} chars): ${prompt.substring(0, 150)}...`);
  console.log(`   ⚙️ Config: dilation=${maskDilation}, steps=${editSteps}, samples=${sampleCount}`);

  // Construction des images de référence (RAW + MASK uniquement, pas de STYLE)
  // Note: REFERENCE_TYPE_STYLE n'est pas supporté pour l'inpainting
  const referenceImages: any[] = [
    // Image de base (à modifier)
    {
      referenceType: "REFERENCE_TYPE_RAW",
      referenceId: 1,
      referenceImage: {
        bytesBase64Encoded: baseImage.base64,
      },
    },
    // Masque
    {
      referenceType: "REFERENCE_TYPE_MASK",
      referenceId: 2,
      referenceImage: {
        bytesBase64Encoded: maskImage.base64,
      },
      maskImageConfig: {
        maskMode: "MASK_MODE_USER_PROVIDED",
        dilation: maskDilation,
      },
    },
  ];

  // Construction du corps de la requête selon la doc Vertex AI
  const requestBody = {
    instances: [
      {
        prompt: prompt,
        referenceImages: referenceImages,
      },
    ],
    parameters: {
      editConfig: {
        baseSteps: editSteps,
      },
      editMode: editMode,
      sampleCount: sampleCount,
    },
  };

  // URL de l'API Vertex AI
  const apiUrl = `https://${VERTEX_AI_REGION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT_ID}/locations/${VERTEX_AI_REGION}/publishers/google/models/${IMAGEN_MODEL}:predict`;

  console.log(`   🌐 URL: ${apiUrl}`);
  
  // Obtenir le token OAuth2 via Application Default Credentials
  const accessToken = await getAccessToken();
  console.log(`   🔐 Authentification: OAuth2 Token`);
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Erreur API Vertex AI: ${response.status}`);
      console.error(`   📄 Détails: ${errorText.substring(0, 500)}`);
      throw new Error(`Erreur Vertex AI (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (!result.predictions || result.predictions.length === 0) {
      throw new Error("Aucune image générée par Vertex AI Imagen");
    }

    console.log(`   ✅ ${result.predictions.length} image(s) générée(s)`);

    return result.predictions.map((pred: any) => ({
      bytesBase64Encoded: pred.bytesBase64Encoded,
      mimeType: pred.mimeType || "image/png",
    }));
  } catch (error: any) {
    console.error(`   ❌ Erreur lors de l'appel Vertex AI:`, error.message);
    throw error;
  }
}

/**
 * Agent Inpainting - Génère une image avec inpainting via Imagen 3
 * 
 * @param originalImage - Image originale à modifier
 * @param maskImage - Masque noir/blanc (blanc = zone à modifier)
 * @param prompt - Prompt complet de génération (construit par buildInpaintingPromptFromContext)
 * @param generationId - ID de génération pour le nommage du fichier
 * @param styleReferenceImage - Image de référence pour le style (optionnel mais recommandé)
 * @param config - Configuration optionnelle
 */
export async function generateWithInpainting(
  originalImage: PreparedImage,
  maskImage: PreparedImage,
  prompt: string,
  generationId: string,
  config: InpaintingConfig = {}
): Promise<InpaintingResult> {
  console.log("\n" + "─".repeat(60));
  console.log("🖌️  AGENT INPAINTING - IMAGEN 3 (VERTEX AI)");
  console.log("─".repeat(60));
  console.log(`   📐 Image originale: ${((originalImage.sizeBytes || originalImage.base64.length) / 1024).toFixed(0)} KB`);
  console.log(`   🎭 Masque: ${((maskImage.sizeBytes || maskImage.base64.length) / 1024).toFixed(0)} KB`);

  // Appel à l'API Vertex AI (la description de la référence est dans le prompt)
  const predictions = await callVertexAIImagen(
    originalImage,
    maskImage,
    prompt,
    config
  );

  // Sauvegarder la première image (principale)
  const mainPrediction = predictions[0];
  const extension = mainPrediction.mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const fileName = `inpainted_${generationId}.${extension}`;
  const imageBuffer = Buffer.from(mainPrediction.bytesBase64Encoded, "base64");

  const imagePath = await saveBuffer(imageBuffer, fileName, "generated");

  console.log(`   💾 Sauvegardé: ${fileName} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);

  // Sauvegarder les images supplémentaires si demandées
  const allResults: Array<{ imagePath: string; mimeType: string }> = [
    { imagePath, mimeType: mainPrediction.mimeType },
  ];

  for (let i = 1; i < predictions.length; i++) {
    const pred = predictions[i];
    const ext = pred.mimeType.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const altFileName = `inpainted_${generationId}_alt${i}.${ext}`;
    const altBuffer = Buffer.from(pred.bytesBase64Encoded, "base64");
    const altPath = await saveBuffer(altBuffer, altFileName, "generated");
    allResults.push({ imagePath: altPath, mimeType: pred.mimeType });
    console.log(`   💾 Alternative ${i}: ${altFileName}`);
  }

  console.log("─".repeat(60) + "\n");

  return {
    imagePath,
    mimeType: mainPrediction.mimeType,
    allResults: allResults.length > 1 ? allResults : undefined,
  };
}

/**
 * Construit un prompt complet et optimisé pour l'inpainting
 * en utilisant TOUT le contexte d'analyse disponible
 */
export function buildInpaintingPromptFromContext(context: InpaintingContext): string {
  const { userInstruction, referenceAnalysis, task, imageAnalysis } = context;
  
  const lines: string[] = [];
  
  // === INSTRUCTION PRINCIPALE ===
  lines.push(`INSTRUCTION: ${userInstruction}`);
  
  // === DESCRIPTION DE L'ÉLÉMENT À INSÉRER ===
  if (referenceAnalysis) {
    lines.push("");
    lines.push("ÉLÉMENT À INSÉRER:");
    
    if (referenceAnalysis.description) {
      lines.push(`- Description: ${referenceAnalysis.description}`);
    }
    if (referenceAnalysis.category) {
      lines.push(`- Type: ${referenceAnalysis.category}`);
    }
    if (referenceAnalysis.material) {
      lines.push(`- Matériau: ${referenceAnalysis.material}`);
    }
    if (referenceAnalysis.mainColor) {
      lines.push(`- Couleur principale: ${referenceAnalysis.mainColor}`);
    }
    if (referenceAnalysis.secondaryColors && referenceAnalysis.secondaryColors.length > 0) {
      lines.push(`- Couleurs secondaires: ${referenceAnalysis.secondaryColors.join(", ")}`);
    }
    if (referenceAnalysis.style) {
      lines.push(`- Style: ${referenceAnalysis.style}`);
    }
    if (referenceAnalysis.finish) {
      lines.push(`- Finition: ${referenceAnalysis.finish}`);
    }
    if (referenceAnalysis.pattern) {
      lines.push(`- Motif/Pattern: ${referenceAnalysis.pattern}`);
    }
    if (referenceAnalysis.dimensions) {
      lines.push(`- Dimensions estimées: ${referenceAnalysis.dimensions}`);
    }
  }
  
  // === CONTEXTE DE LA TÂCHE ===
  if (task) {
    lines.push("");
    lines.push("DÉTAILS DE LA MODIFICATION:");
    
    if (task.actionType) {
      const actionLabels: Record<string, string> = {
        "add_element": "Ajouter un nouvel élément",
        "replace_object": "Remplacer un objet existant",
        "apply_texture": "Appliquer une texture/matériau",
      };
      lines.push(`- Action: ${actionLabels[task.actionType] || task.actionType}`);
    }
    
    if (task.quantity && task.quantity > 1) {
      lines.push(`- Quantité: ${task.quantity} élément(s)`);
    }
    
    if (task.quantityText) {
      lines.push(`- Description quantité: ${task.quantityText}`);
    }
    
    if (task.specificInstructions) {
      lines.push(`- Instructions: ${task.specificInstructions}`);
    }
    
    if (task.positionConstraints) {
      if (task.positionConstraints.side) {
        lines.push(`- Côté: ${task.positionConstraints.side}`);
      }
      if (task.positionConstraints.description) {
        lines.push(`- Zone: ${task.positionConstraints.description}`);
      }
    }
    
    if (task.targetZone) {
      lines.push(`- Zone cible: ${task.targetZone}`);
    }
    
    // Surface cible
    if (task.targetSurface) {
      lines.push("");
      lines.push("SURFACE CIBLE:");
      lines.push(`- Nom: ${task.targetSurface.name}`);
      if (task.targetSurface.boundaries) {
        lines.push(`- Limites: ${task.targetSurface.boundaries}`);
      }
      if (task.targetSurface.currentMaterial) {
        lines.push(`- Matériau actuel à remplacer: ${task.targetSurface.currentMaterial}`);
      }
    }
    
    // Objet cible
    if (task.targetObject) {
      lines.push("");
      lines.push("OBJET CIBLE:");
      lines.push(`- Nom: ${task.targetObject.name}`);
      if (task.targetObject.position) {
        lines.push(`- Position: ${task.targetObject.position}`);
      }
      if (task.targetObject.style) {
        lines.push(`- Style actuel: ${task.targetObject.style}`);
      }
      if (task.targetObject.estimatedDimensions) {
        lines.push(`- Dimensions: ${task.targetObject.estimatedDimensions}`);
      }
    }
  }
  
  // === CONTEXTE DE L'IMAGE ORIGINALE ===
  if (imageAnalysis) {
    lines.push("");
    lines.push("CONTEXTE DE LA SCÈNE:");
    lines.push(`- Type d'espace: ${imageAnalysis.spaceType}`);
    lines.push(`- Environnement: ${imageAnalysis.environment === "interior" ? "Intérieur" : imageAnalysis.environment === "exterior" ? "Extérieur" : "Mixte"}`);
    
    if (imageAnalysis.lighting) {
      lines.push(`- Éclairage: ${imageAnalysis.lighting.type || "naturel"}, direction ${imageAnalysis.lighting.direction || "diffuse"}`);
      if (imageAnalysis.lighting.temperature) {
        lines.push(`- Température couleur: ${imageAnalysis.lighting.temperature}`);
      }
    }
    
    if (imageAnalysis.perspective) {
      if (imageAnalysis.perspective.viewType) {
        lines.push(`- Perspective: ${imageAnalysis.perspective.viewType}`);
      }
      if (imageAnalysis.perspective.cameraHeight) {
        lines.push(`- Hauteur caméra: ${imageAnalysis.perspective.cameraHeight}`);
      }
      if (imageAnalysis.perspective.description) {
        lines.push(`- Description: ${imageAnalysis.perspective.description}`);
      }
    }
  }
  
  // === CONSEILS D'INTÉGRATION ===
  if (referenceAnalysis?.integrationTips && referenceAnalysis.integrationTips.length > 0) {
    lines.push("");
    lines.push("CONSEILS D'INTÉGRATION:");
    for (const tip of referenceAnalysis.integrationTips) {
      lines.push(`- ${tip}`);
    }
  }
  
  // === INSTRUCTIONS DE QUALITÉ ===
  lines.push("");
  lines.push("EXIGENCES DE QUALITÉ:");
  lines.push("- Rendu PHOTORÉALISTE, indiscernable d'une vraie photo");
  lines.push("- Intégration NATURELLE avec l'éclairage existant de la scène");
  lines.push("- Respecter la PERSPECTIVE exacte de l'image originale");
  lines.push("- Générer des OMBRES cohérentes avec la source de lumière");
  lines.push("- L'élément doit sembler PHOTOGRAPHIÉ dans la scène, pas ajouté numériquement");
  lines.push("- Conserver le MÊME CADRAGE que l'image originale (pas de zoom/recadrage)");
  
  return lines.join("\n");
}

/**
 * Génère un prompt simplifié pour l'inpainting (fallback)
 * @deprecated Préférer buildInpaintingPromptFromContext
 */
export function buildInpaintingPrompt(
  userInstruction: string,
  referenceDescription?: string,
  referenceStyle?: string,
  referenceColor?: string
): string {
  let prompt = userInstruction;

  // Ajouter les détails de la référence si disponibles
  if (referenceDescription) {
    prompt += `. L'élément doit ressembler à: ${referenceDescription}`;
  }

  if (referenceStyle) {
    prompt += `. Style: ${referenceStyle}`;
  }

  if (referenceColor) {
    prompt += `. Couleur dominante: ${referenceColor}`;
  }

  // Ajouter des instructions de qualité
  prompt += ". Rendu photoréaliste, intégration naturelle avec l'éclairage et la perspective de l'image originale.";

  return prompt;
}

/**
 * Vérifie si une instruction possède un masque valide pour l'inpainting
 */
export function canUseInpainting(instruction: { maskImagePath?: string }): boolean {
  return !!instruction.maskImagePath && instruction.maskImagePath.length > 0;
}
