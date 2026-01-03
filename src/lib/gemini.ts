import { GoogleGenAI } from "@google/genai";
import heicConvert from "heic-convert";
import sharp from "sharp";
import { getImageBuffer, saveBuffer } from "./storage";

// ============================================================================
// SYSTÈME AGENTIQUE STATE-OF-THE-ART POUR RÉNOVATION AVANT/APRÈS
// ============================================================================
// Architecture Multi-Agent:
// 1. Agent Analyste (Gemini Flash) - Comprend l'image en profondeur
// 2. Agent Planificateur (Gemini Flash) - Mappe les instructions sur les zones
// 3. Agent Générateur (Nano Banana) - Génère l'image avec précision
// ============================================================================

const ai = new GoogleGenAI({
  apiKey:
    import.meta.env.AI_GOOGLE_API_KEY || process.env.AI_GOOGLE_API_KEY || "",
});

// Modèles utilisés dans l'architecture agentique
const MODELS = {
  ANALYZER: "gemini-2.5-flash", // Agent analyste & planificateur (texte)
  GENERATOR: "gemini-3-pro-image-preview", // Nano Banana Pro - meilleure qualité, thinking, 4K
} as const;

// Configuration de génération d'image (Nano Banana Pro)
const IMAGE_CONFIG = {
  aspectRatio: "4:3" as const, // Aspect ratio pour photos de pièces
  imageSize: "2K" as const, // Résolution: "1K", "2K", ou "4K"
} as const;

// Configuration robuste avec retry
const CONFIG = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 15000,
  backoffMultiplier: 2,
  maxImageSizeBytes: 4 * 1024 * 1024,
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ModificationType =
  | "floor"
  | "wall"
  | "ceiling"
  | "furniture"
  | "add_element"
  | "facade"
  | "outdoor"
  | "custom";

export interface GenerationInstruction {
  location: string;
  referenceImagePath: string;
  referenceName?: string;
  modificationType?: ModificationType;
  additionalDetails?: string;
}

export interface GenerationResult {
  imagePath: string;
  description: string;
  attempts: number;
  analysisDetails?: ImageAnalysis;
}

export interface GenerationOptions {
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}

// Résultat de l'analyse agentique de l'image
interface ImageAnalysis {
  roomType: string;
  visibleZones: ZoneInfo[];
  lighting: string;
  perspective: string;
  existingMaterials: MaterialInfo[];
}

interface ZoneInfo {
  id: string;
  name: string;
  description: string;
  boundaries: string;
  currentMaterial: string;
}

interface MaterialInfo {
  zone: string;
  type: string;
  color: string;
  texture: string;
}

// Plan de modification généré par l'agent planificateur
interface ModificationPlan {
  originalAnalysis: ImageAnalysis;
  tasks: ModificationTask[];
  globalPrompt: string;
}

interface ModificationTask {
  priority: number;
  zone: ZoneInfo;
  targetMaterial: string;
  referenceIndex: number;
  specificInstructions: string;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

// Formats Apple nécessitant une conversion
const APPLE_FORMATS = ["heic", "heif", "hif"];

function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[ext || ""] || "image/jpeg";
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Prépare une image pour l'API Gemini
 * - Lit l'image depuis S3
 * - Convertit les formats Apple (HEIC, HEIF) en JPEG via heic-convert
 * - Optimise les images trop volumineuses (>4MB) via sharp
 */
async function prepareImageForAPI(
  imagePath: string
): Promise<{ base64: string; mimeType: string }> {
  const ext = imagePath.toLowerCase().split(".").pop() || "";
  let buffer: Buffer = await getImageBuffer(imagePath);
  let mimeType = getMimeType(imagePath);

  // Conversion des formats Apple (HEIC, HEIF) avec heic-convert
  if (APPLE_FORMATS.includes(ext)) {
    console.log(`   🔄 Conversion ${ext.toUpperCase()} → JPEG pour API...`);
    try {
      const converted = await heicConvert({
        buffer: buffer,
        format: "JPEG",
        quality: 0.9,
      });
      buffer = Buffer.from(converted);
      mimeType = "image/jpeg";
      console.log(
        `   ✓ Converti pour API: ${(buffer.length / 1024).toFixed(0)} KB`
      );
    } catch (error) {
      console.error(`   ❌ Erreur conversion ${ext}:`, error);
      throw new Error(
        `Impossible de convertir ${ext.toUpperCase()}. Format non supporté.`
      );
    }
  }

  // Optimisation si l'image est trop volumineuse (>4MB) avec sharp
  if (buffer.length > CONFIG.maxImageSizeBytes) {
    console.log(
      `   📐 Image trop volumineuse (${(buffer.length / 1024 / 1024).toFixed(
        1
      )}MB), optimisation...`
    );
    try {
      // Réduire la qualité et/ou les dimensions
      buffer = Buffer.from(
        await sharp(buffer)
          .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
      );
      mimeType = "image/jpeg";
      console.log(`   ✓ Optimisé: ${(buffer.length / 1024).toFixed(0)} KB`);
    } catch (error) {
      console.warn(
        `   ⚠️ Optimisation échouée, utilisation de l'image originale`
      );
    }
  }

  return { base64: buffer.toString("base64"), mimeType };
}

// ============================================================================
// AGENT 1: ANALYSTE D'IMAGE (Gemini Flash - Texte)
// ============================================================================
// Analyse l'image en profondeur pour identifier toutes les zones modifiables

async function analyzeImageWithAgent(imageData: {
  base64: string;
  mimeType: string;
}): Promise<ImageAnalysis> {
  console.log("   🔍 Agent Analyste: Analyse intelligente de l'image...");

  const analysisPrompt = `Tu es un expert en architecture et rénovation d'intérieur/extérieur.
Analyse cette image de manière EXHAUSTIVE pour identifier TOUTES les surfaces modifiables.

Réponds UNIQUEMENT avec ce JSON valide (sans markdown, sans backticks):
{
  "roomType": "type d'espace (salon, chambre, cuisine, terrasse, façade...)",
  "visibleZones": [
    {
      "id": "wall_left",
      "name": "Mur de gauche",
      "description": "Mur vertical situé sur le côté gauche de l'image",
      "boundaries": "Du coin inférieur gauche jusqu'au plafond, de la porte au coin",
      "currentMaterial": "Peinture blanche mate"
    },
    {
      "id": "wall_right", 
      "name": "Mur de droite",
      "description": "Mur vertical situé sur le côté droit de l'image",
      "boundaries": "Du coin droit jusqu'à la fenêtre",
      "currentMaterial": "Peinture blanche"
    },
    {
      "id": "wall_back",
      "name": "Mur du fond",
      "description": "Mur face à la caméra",
      "boundaries": "Mur entier visible entre les murs latéraux",
      "currentMaterial": "Peinture beige"
    },
    {
      "id": "floor_main",
      "name": "Sol",
      "description": "Surface horizontale au sol",
      "boundaries": "Toute la surface visible du sol",
      "currentMaterial": "Parquet bois clair"
    }
  ],
  "lighting": "Lumière naturelle venant de la fenêtre à droite, éclairage doux",
  "perspective": "Vue en légère plongée depuis l'entrée de la pièce",
  "existingMaterials": [
    {"zone": "Sol", "type": "parquet", "color": "chêne clair", "texture": "bois veiné"}
  ]
}

RÈGLES D'IDENTIFICATION:
- Identifie CHAQUE mur visible séparément (gauche, droite, fond, etc.)
- Identifie le sol en entier
- Identifie le plafond si visible
- Utilise des IDs uniques: wall_left, wall_right, wall_back, floor_main, ceiling, etc.
- Sois PRÉCIS sur les délimitations physiques de chaque zone`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.ANALYZER,
      contents: [
        { text: analysisPrompt },
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
      console.log(`   ✓ Type: ${analysis.roomType}`);
      console.log(`   ✓ ${analysis.visibleZones.length} zones identifiées:`);
      for (const zone of analysis.visibleZones) {
        console.log(
          `      - ${zone.name} (${zone.id}): ${zone.currentMaterial}`
        );
      }
      return analysis;
    }
  } catch (error) {
    console.warn("   ⚠️ Parsing de l'analyse échoué, utilisation du fallback");
  }

  // Fallback avec des zones génériques
  return {
    roomType: "espace intérieur",
    visibleZones: [
      {
        id: "wall_left",
        name: "Mur gauche",
        description: "Mur côté gauche",
        boundaries: "gauche de l'image",
        currentMaterial: "inconnu",
      },
      {
        id: "wall_right",
        name: "Mur droit",
        description: "Mur côté droit",
        boundaries: "droite de l'image",
        currentMaterial: "inconnu",
      },
      {
        id: "wall_back",
        name: "Mur du fond",
        description: "Mur face",
        boundaries: "fond de l'image",
        currentMaterial: "inconnu",
      },
      {
        id: "floor_main",
        name: "Sol",
        description: "Surface au sol",
        boundaries: "partie basse",
        currentMaterial: "inconnu",
      },
    ],
    lighting: "éclairage standard",
    perspective: "vue frontale",
    existingMaterials: [],
  };
}

// ============================================================================
// AGENT 2: PLANIFICATEUR (Gemini Flash - Texte)
// ============================================================================
// Interprète les instructions utilisateur et les mappe sur les zones identifiées

async function planModificationsWithAgent(
  analysis: ImageAnalysis,
  instructions: GenerationInstruction[],
  referenceImages: { base64: string; mimeType: string }[]
): Promise<ModificationPlan> {
  console.log("   📋 Agent Planificateur: Mapping des instructions...");

  // Contexte des zones identifiées
  const zonesContext = analysis.visibleZones
    .map(
      (z) =>
        `- ID: "${z.id}" | Nom: "${z.name}" | Description: ${z.description} | Limites: ${z.boundaries}`
    )
    .join("\n");

  // Contexte des instructions utilisateur
  const instructionsContext = instructions
    .map(
      (instr, i) =>
        `${i + 1}. Instruction: "${instr.location}" → Appliquer: ${
          instr.referenceName || "référence " + (i + 1)
        }`
    )
    .join("\n");

  const planningPrompt = `Tu es un expert en interprétation d'instructions de rénovation.

ZONES IDENTIFIÉES DANS L'IMAGE:
${zonesContext}

INSTRUCTIONS DE L'UTILISATEUR:
${instructionsContext}

Ta mission: Mapper PRÉCISÉMENT chaque instruction utilisateur sur les zones identifiées.

ATTENTION - RÈGLES CRITIQUES DE PRIORITÉ:
1. CHAQUE ZONE NE PEUT ÊTRE ASSIGNÉE QU'À UNE SEULE INSTRUCTION
2. Les instructions SPÉCIFIQUES ont PRIORITÉ sur les instructions GÉNÉRIQUES
   - "crédence" est SPÉCIFIQUE → assigner UNIQUEMENT à la crédence
   - "mur" est GÉNÉRIQUE → assigner aux murs SAUF crédence
   - "sol" est SPÉCIFIQUE → assigner uniquement au sol
3. Si l'utilisateur donne une instruction pour "crédence" ET une pour "mur":
   - La crédence va à l'instruction "crédence"
   - Les murs (sans la crédence) vont à l'instruction "mur"

Réponds avec ce JSON (sans markdown):
{
  "mappings": [
    {
      "instructionIndex": 0,
      "targetZoneIds": ["wall_left", "wall_right"],
      "interpretation": "Explication du mapping",
      "coverage": "Description de la couverture"
    }
  ],
  "warnings": ["zone X en conflit, priorité donnée à instruction Y"],
  "conflicts_resolved": [
    {"zone": "credence", "kept_instruction": 4, "removed_from": [3]}
  ]
}

RÈGLES DE MAPPING:
- "mur" sans précision → TOUS les murs (wall_*) SAUF crédence/splashback
- "crédence" ou "credence" → UNIQUEMENT les zones splashback/tiled/credence
- "sol" → ["floor_main"]
- "meuble" ou "cuisine" → zones cabinet/furniture
- "évier" → zones sink/countertop`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.ANALYZER,
      contents: [{ text: planningPrompt }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const mapping = JSON.parse(jsonMatch[0]);

      // Construire les tâches
      let tasks: ModificationTask[] = [];

      for (const m of mapping.mappings || []) {
        const instruction = instructions[m.instructionIndex];

        for (const zoneId of m.targetZoneIds || []) {
          const zone = analysis.visibleZones.find((z) => z.id === zoneId);
          if (zone) {
            tasks.push({
              priority: m.instructionIndex,
              zone: zone,
              targetMaterial: instruction.referenceName || "image de référence",
              referenceIndex: m.instructionIndex,
              specificInstructions: m.coverage || instruction.location,
            });
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // RÉSOLUTION DES CONFLITS DE ZONES
      // Une zone ne peut avoir qu'UN SEUL matériau - on garde la dernière instruction
      // (l'utilisateur qui dit "crédence" après "mur" veut que crédence gagne)
      // ═══════════════════════════════════════════════════════════════════════
      const zoneAssignments = new Map<string, ModificationTask>();
      const conflicts: string[] = [];

      for (const task of tasks) {
        const existing = zoneAssignments.get(task.zone.id);
        if (existing) {
          // Conflit détecté! La dernière instruction (index plus élevé) gagne
          if (task.referenceIndex > existing.referenceIndex) {
            conflicts.push(
              `Zone "${task.zone.name}": "${existing.targetMaterial}" remplacé par "${task.targetMaterial}"`
            );
            zoneAssignments.set(task.zone.id, task);
          } else {
            conflicts.push(
              `Zone "${task.zone.name}": "${task.targetMaterial}" ignoré, "${existing.targetMaterial}" conservé`
            );
          }
        } else {
          zoneAssignments.set(task.zone.id, task);
        }
      }

      // Reconstruire la liste de tâches sans doublons
      tasks = Array.from(zoneAssignments.values());

      console.log(
        `   ✓ ${tasks.length} tâches de modification (après résolution conflits):`
      );
      for (const task of tasks) {
        console.log(
          `      - ${task.zone.name} → ${task.targetMaterial} [Réf ${
            task.referenceIndex + 1
          }]`
        );
      }

      if (conflicts.length > 0) {
        console.log(`   ⚠️ ${conflicts.length} conflit(s) de zone résolu(s):`);
        for (const c of conflicts) {
          console.log(`      ${c}`);
        }
      }

      if (mapping.warnings?.length > 0) {
        for (const w of mapping.warnings) {
          console.log(`   ⚠️ ${w}`);
        }
      }

      // Générer le prompt optimisé
      const globalPrompt = buildOptimizedPrompt(analysis, tasks, instructions);

      return { originalAnalysis: analysis, tasks, globalPrompt };
    }
  } catch (error) {
    console.warn("   ⚠️ Planification échouée, utilisation du mapping direct");
  }

  // Fallback: mapping direct basé sur les mots-clés
  const tasks: ModificationTask[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    const location = instr.location.toLowerCase();

    // Mapping par mots-clés
    const matchedZones: ZoneInfo[] = [];

    for (const zone of analysis.visibleZones) {
      const zoneLower = zone.name.toLowerCase();
      const zoneIdLower = zone.id.toLowerCase();

      // Vérifier si la zone correspond
      if (
        location.includes("gauche") &&
        (zoneLower.includes("gauche") || zoneIdLower.includes("left"))
      ) {
        matchedZones.push(zone);
      } else if (
        location.includes("droit") &&
        (zoneLower.includes("droit") || zoneIdLower.includes("right"))
      ) {
        matchedZones.push(zone);
      } else if (
        (location.includes("fond") || location.includes("face")) &&
        (zoneLower.includes("fond") || zoneIdLower.includes("back"))
      ) {
        matchedZones.push(zone);
      } else if (
        location.includes("sol") &&
        (zoneLower.includes("sol") || zoneIdLower.includes("floor"))
      ) {
        matchedZones.push(zone);
      } else if (
        location.includes("plafond") &&
        (zoneLower.includes("plafond") || zoneIdLower.includes("ceiling"))
      ) {
        matchedZones.push(zone);
      } else if (
        location.includes("tous les murs") &&
        zoneIdLower.includes("wall")
      ) {
        matchedZones.push(zone);
      }
    }

    // Si aucune correspondance, utiliser la première zone de type mur ou sol
    if (matchedZones.length === 0) {
      const defaultZone =
        analysis.visibleZones.find(
          (z) => z.id.includes("wall") || z.id.includes("floor")
        ) || analysis.visibleZones[0];
      if (defaultZone) matchedZones.push(defaultZone);
    }

    for (const zone of matchedZones) {
      tasks.push({
        priority: i,
        zone: zone,
        targetMaterial: instr.referenceName || "référence",
        referenceIndex: i,
        specificInstructions: instr.location,
      });
    }
  }

  console.log(`   ✓ ${tasks.length} tâches (fallback)`);

  return {
    originalAnalysis: analysis,
    tasks,
    globalPrompt: buildOptimizedPrompt(analysis, tasks, instructions),
  };
}

// ============================================================================
// CONSTRUCTION DU PROMPT OPTIMISÉ (BEST PRACTICES NANO BANANA)
// ============================================================================

function buildOptimizedPrompt(
  analysis: ImageAnalysis,
  tasks: ModificationTask[],
  instructions: GenerationInstruction[]
): string {
  // Grouper les tâches par référence
  const groupedTasks = new Map<number, ModificationTask[]>();
  for (const task of tasks) {
    if (!groupedTasks.has(task.referenceIndex)) {
      groupedTasks.set(task.referenceIndex, []);
    }
    groupedTasks.get(task.referenceIndex)!.push(task);
  }

  // Construire les blocs de modification
  const modificationBlocks: string[] = [];

  groupedTasks.forEach((zoneTasks, refIndex) => {
    const instruction = instructions[refIndex];
    const materialName = instruction.referenceName || "image de référence";

    const zoneDescriptions = zoneTasks
      .map(
        (t) =>
          `• **${t.zone.name}**: ${t.zone.description}
        Limites: ${t.zone.boundaries}
        Matériau actuel: ${t.zone.currentMaterial}`
      )
      .join("\n");

    modificationBlocks.push(`
### MODIFICATION ${refIndex + 1}: Appliquer "${materialName}"
**Image de référence**: IMAGE ${refIndex + 2}

**Zones à modifier**:
${zoneDescriptions}

**Instructions d'application**:
1. Examiner attentivement l'IMAGE ${
      refIndex + 2
    } pour comprendre: texture, couleur, motifs, brillance
2. Appliquer ce matériau sur CHAQUE zone listée ci-dessus
3. Couvrir 100% de chaque surface - aucune zone ne doit garder l'ancien matériau
4. Respecter le sens de pose naturel du matériau
5. Adapter les ombres et reflets selon l'éclairage (${analysis.lighting})`);
  });

  return `# MISSION: VISUALISATION PROFESSIONNELLE APRÈS RÉNOVATION

Tu es un moteur de rendu photoréaliste de niveau professionnel pour le secteur BTP.
Tu génères UNE image montrant l'espace APRÈS les modifications demandées.

## ANALYSE DE L'IMAGE ORIGINALE (IMAGE 1)
- **Type d'espace**: ${analysis.roomType}
- **Éclairage**: ${analysis.lighting}
- **Perspective caméra**: ${analysis.perspective}
- **Zones identifiées**: ${analysis.visibleZones.map((z) => z.name).join(", ")}

## IMAGES FOURNIES
- **IMAGE 1**: Photo originale AVANT rénovation (l'espace à transformer)
- **IMAGES 2, 3, ...**: Échantillons de matériaux de RÉFÉRENCE

## MODIFICATIONS À EFFECTUER
${modificationBlocks.join("\n")}

## RÈGLES CRITIQUES À RESPECTER

### 1. COUVERTURE INTÉGRALE
Pour CHAQUE zone mentionnée dans les modifications:
- Appliquer le nouveau matériau sur 100% de la surface
- Aucune trace de l'ancien matériau ne doit rester visible
- Couvrir du bord à bord, des limites indiquées

### 2. COHÉRENCE GÉOMÉTRIQUE
- Perspective IDENTIQUE à l'image originale (même angle de caméra)
- Proportions et dimensions préservées
- Lignes de fuite cohérentes

### 3. RÉALISME DES MATÉRIAUX
- Reproduire fidèlement la texture visible dans chaque image de référence
- Adapter les reflets et ombres à l'éclairage existant
- Transitions naturelles aux bords et coins

### 4. PRÉSERVATION STRICTE
Ne PAS modifier les éléments suivants:
- Portes, fenêtres, poignées
- Prises électriques, interrupteurs
- Meubles (sauf si explicitement demandé)
- Tous éléments non mentionnés dans les modifications

## ACTION
Génère maintenant l'image photoréaliste de l'espace APRÈS rénovation avec TOUTES les modifications appliquées.`;
}

// ============================================================================
// AGENT 3: GÉNÉRATEUR D'IMAGE (NANO BANANA PRO)
// ============================================================================

async function generateWithNanoBanana(
  originalImage: { base64: string; mimeType: string },
  referenceImages: { base64: string; mimeType: string }[],
  prompt: string,
  outputDir: string,
  generationId: string
): Promise<{ imagePath: string; description: string }> {
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

  // Construire le contenu selon la documentation officielle Nano Banana Pro
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

  // Appel avec configuration avancée Nano Banana Pro
  const response = await ai.models.generateContent({
    model: MODELS.GENERATOR,
    contents: contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: IMAGE_CONFIG.aspectRatio,
        imageSize: IMAGE_CONFIG.imageSize,
      },
    },
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
  };
}

// ============================================================================
// FONCTION PRINCIPALE: ORCHESTRATION AGENTIQUE
// ============================================================================

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
  // CHARGEMENT DES IMAGES (les erreurs S3 seront gérées lors du chargement)
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n📸 Chargement des images...");
  const originalImage = await prepareImageForAPI(originalImagePath);
  console.log(
    `   ✓ Original: ${(originalImage.base64.length / 1024).toFixed(0)} KB`
  );

  const referenceImages: { base64: string; mimeType: string }[] = [];
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

  console.log("\n🔬 PHASE 1: Analyse intelligente de l'image");
  console.log("─".repeat(50));

  const analysis = await analyzeImageWithAgent(originalImage);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: PLANIFICATION DES MODIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n📊 PHASE 2: Planification et mapping des zones");
  console.log("─".repeat(50));

  const plan = await planModificationsWithAgent(
    analysis,
    instructions,
    referenceImages
  );

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: GÉNÉRATION AVEC RETRY
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n🎨 PHASE 3: Génération de l'image");
  console.log("─".repeat(50));

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    console.log(`\n🔄 Tentative ${attempt}/${CONFIG.maxRetries}`);

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

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log("\n" + "═".repeat(70));
      console.log("✅ GÉNÉRATION RÉUSSIE!");
      console.log(`   📁 ${result.imagePath}`);
      console.log(`   ⏱️  Durée: ${duration}s`);
      console.log(`   🔢 Tentatives: ${attempt}`);
      console.log("═".repeat(70) + "\n");

      return {
        imagePath: result.imagePath,
        description: result.description,
        attempts: attempt,
        analysisDetails: analysis,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`   ❌ Échec: ${lastError.message.substring(0, 200)}`);

      if (attempt < CONFIG.maxRetries) {
        const delay = Math.min(
          CONFIG.initialDelayMs *
            Math.pow(CONFIG.backoffMultiplier, attempt - 1),
          CONFIG.maxDelayMs
        );
        console.log(`   ⏳ Nouveau essai dans ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Échec après ${CONFIG.maxRetries} tentatives. ${lastError?.message}`
  );
}

// ============================================================================
// FONCTION AVEC PROGRESS CALLBACK POUR STREAMING SSE
// ============================================================================

export type ProgressCallback = (event: {
  type: 'log' | 'step' | 'error';
  icon?: string;
  message?: string;
  step?: string;
  status?: 'pending' | 'loading' | 'done' | 'error';
}) => void;

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
    onProgress({ type: 'log', icon, message });
  };

  const setStep = (step: string, status: 'pending' | 'loading' | 'done' | 'error') => {
    onProgress({ type: 'step', step, status });
  };

  log("🤖", "SYSTÈME AGENTIQUE DE GÉNÉRATION AVANT/APRÈS");
  log("📋", `${instructions.length} instruction(s) de l'utilisateur`);
  log("🆔", `ID: ${generationId}`);

  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    log("📌", `Instruction ${i + 1}: "${instr.location}" - ${instr.referenceName || "(sans nom)"}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHARGEMENT DES IMAGES
  // ═══════════════════════════════════════════════════════════════════════

  setStep('upload', 'loading');
  log("📸", "Chargement des images depuis S3...");
  
  const originalImage = await prepareImageForAPI(originalImagePath);
  log("✓", `Original: ${(originalImage.base64.length / 1024).toFixed(0)} KB`);

  const referenceImages: { base64: string; mimeType: string }[] = [];
  for (let i = 0; i < instructions.length; i++) {
    const refImage = await prepareImageForAPI(instructions[i].referenceImagePath);
    referenceImages.push(refImage);
    log("✓", `Référence ${i + 1}: ${(refImage.base64.length / 1024).toFixed(0)} KB`);
  }
  
  setStep('upload', 'done');

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: ANALYSE AGENTIQUE
  // ═══════════════════════════════════════════════════════════════════════

  setStep('analyze', 'loading');
  log("🔬", "PHASE 1: Analyse intelligente de l'image");
  log("🧠", "Identification des éléments de la pièce...");

  const analysis = await analyzeImageWithAgent(originalImage);
  
  log("✓", `Analyse terminée: ${(analysis.description || 'Analyse complète').substring(0, 100)}...`);
  setStep('analyze', 'done');

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: PLANIFICATION DES MODIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  setStep('plan', 'loading');
  log("📊", "PHASE 2: Planification et mapping des zones");
  log("🗺️", "Création du plan de modification...");

  const plan = await planModificationsWithAgent(
    analysis,
    instructions,
    referenceImages
  );

  log("✓", `Plan créé: ${plan.tasks?.length || 0} tâche(s) de modification`);
  if (plan.tasks && plan.tasks.length > 0) {
    for (const task of plan.tasks) {
      log("📍", `Zone: ${task.zoneName || 'Zone'} - ${(task.actionDescription || 'Modification').substring(0, 60)}`);
    }
  }
  setStep('plan', 'done');

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: GÉNÉRATION AVEC RETRY
  // ═══════════════════════════════════════════════════════════════════════

  setStep('generate', 'loading');
  log("🎨", "PHASE 3: Génération de l'image avec Gemini");

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    log("🔄", `Tentative ${attempt}/${CONFIG.maxRetries}`);

    try {
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

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      setStep('generate', 'done');
      log("✅", `GÉNÉRATION RÉUSSIE en ${duration}s!`);
      log("📁", `Image sauvegardée: ${result.imagePath}`);

      return {
        imagePath: result.imagePath,
        description: result.description,
        attempts: attempt,
        analysisDetails: analysis,
      };
    } catch (error) {
      lastError = error as Error;
      log("❌", `Échec: ${(lastError?.message || 'Erreur inconnue').substring(0, 150)}`);

      if (attempt < CONFIG.maxRetries) {
        const delay = Math.min(
          CONFIG.initialDelayMs * Math.pow(CONFIG.backoffMultiplier, attempt - 1),
          CONFIG.maxDelayMs
        );
        log("⏳", `Nouveau essai dans ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  setStep('generate', 'error');
  onProgress({ 
    type: 'error', 
    message: `Échec après ${CONFIG.maxRetries} tentatives: ${lastError?.message}` 
  });
  
  throw new Error(
    `Échec après ${CONFIG.maxRetries} tentatives. ${lastError?.message}`
  );
}

// Prompt simplifié pour les retries
function buildSimplifiedRetryPrompt(
  instructions: GenerationInstruction[],
  tasks: ModificationTask[],
  attempt: number
): string {
  const mods = instructions
    .map((instr, i) => {
      const relevantTasks = tasks.filter((t) => t.referenceIndex === i);
      const zones = relevantTasks.map((t) => t.zone.name).join(", ");
      return `${i + 1}. Zones: ${zones || instr.location}
   Appliquer le matériau de l'IMAGE ${i + 2}${
        instr.referenceName ? ` (${instr.referenceName})` : ""
      }`;
    })
    .join("\n\n");

  return `Génère une image APRÈS RÉNOVATION basée sur l'IMAGE 1.

MODIFICATIONS REQUISES:
${mods}

RÈGLES:
- Appliquer chaque matériau sur 100% des zones indiquées
- Garder exactement la même perspective
- Rendu photoréaliste professionnel

Génère l'image maintenant.`;
}

// ============================================================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ============================================================================

/**
 * Analyse une image pour identifier les zones modifiables (utilisable depuis l'UI)
 */
export async function analyzeImage(imagePath: string): Promise<string> {
  const imageData = await prepareImageForAPI(imagePath);

  const response = await ai.models.generateContent({
    model: MODELS.ANALYZER,
    contents: [
      {
        text: `Analyse cette image d'un espace et identifie TOUS les éléments modifiables.

Pour chaque élément:
1. **Nom**: Description précise (ex: "Mur gauche", "Sol parquet")
2. **État actuel**: Type de revêtement actuel
3. **Modifications possibles**: Alternatives (parquet, carrelage, peinture...)

Sois exhaustif.`,
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
 * Valide une image de référence (matériau)
 */
export async function validateReference(imagePath: string): Promise<{
  valid: boolean;
  material?: string;
  quality?: string;
  suggestions?: string;
}> {
  const imageData = await prepareImageForAPI(imagePath);

  const response = await ai.models.generateContent({
    model: MODELS.ANALYZER,
    contents: [
      {
        text: `Cette image doit servir de référence pour un matériau.

Réponds avec ce JSON (sans markdown):
{
  "valid": true ou false,
  "material": "nom du matériau identifié",
  "quality": "excellente", "bonne", "moyenne" ou "insuffisante",
  "suggestions": "conseils si qualité non excellente"
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

  return { valid: true, material: "Matériau", quality: "inconnue" };
}
