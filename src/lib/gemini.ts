import { GoogleGenAI } from "@google/genai";
import heicConvert from "heic-convert";
import sharp from "sharp";
import { getImageBuffer, saveBuffer } from "./storage";

// ============================================================================
// SYSTÈME AGENTIQUE POLYVALENT POUR VISUALISATION AVANT/APRÈS
// ============================================================================
// Architecture Multi-Agent pour tous métiers d'aménagement :
// - Rénovation intérieure/extérieure
// - Décoration et agencement
// - Ameublement et mobilier
// - Jardinage et paysagisme
// - Électricité et équipements
// ============================================================================
// 1. Agent Analyste (Gemini Flash) - Comprend l'image (surfaces ET objets)
// 2. Agent Planificateur (Gemini Flash) - Classifie et mappe les modifications
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

// Type d'élément dans l'image
export type ElementCategory =
  | "surface" // Murs, sols, plafonds, façades
  | "furniture" // Meubles (tables, chaises, canapés, lits, armoires)
  | "lighting" // Luminaires (lustres, lampes, spots, appliques)
  | "decoration" // Déco (tableaux, miroirs, vases, rideaux, tapis)
  | "equipment" // Équipements (prises, interrupteurs, radiateurs)
  | "outdoor" // Extérieur (plantes, pergolas, clôtures, terrasses)
  | "fixture" // Éléments fixes (éviers, baignoires, sanitaires)
  | "appliance"; // Électroménager (cuisine, buanderie)

// Type de modification à effectuer
export type ModificationAction =
  | "replace_material" // Changer le matériau d'une surface (peinture, carrelage)
  | "replace_object" // Remplacer un objet entier par un autre
  | "add_element" // Ajouter un nouvel élément
  | "remove_element" // Retirer un élément
  | "modify_style"; // Modifier le style (couleur, finition)

export type ModificationType =
  | "floor"
  | "wall"
  | "ceiling"
  | "furniture"
  | "add_element"
  | "facade"
  | "outdoor"
  | "lighting"
  | "decoration"
  | "equipment"
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
  // Nouvelles propriétés pour une analyse plus complète
  visibleObjects?: ObjectInfo[]; // Objets identifiés (meubles, déco, plantes)
}

interface ObjectInfo {
  id: string;
  name: string;
  category: string; // table, chaise, canapé, lampe, plante, tableau, etc.
  description: string;
  position: string; // où dans l'image
  style: string; // moderne, classique, industriel, etc.
  material: string; // bois, métal, tissu, etc.
  color: string;
}

interface ZoneInfo {
  id: string;
  name: string;
  description: string;
  boundaries: string;
  currentMaterial: string;
  // Nouvelles propriétés pour distinguer surfaces et objets
  elementType?: "surface" | "object"; // surface = mur/sol, object = meuble/déco
  objectCategory?: string; // table, chaise, lampe, plante, tableau, etc.
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
  zone?: ZoneInfo; // Pour les surfaces
  targetObject?: ObjectInfo; // Pour les objets à remplacer
  targetMaterial: string;
  referenceIndex: number;
  specificInstructions: string;
  // Nouvelles propriétés pour distinguer le type d'action
  actionType: "apply_texture" | "replace_object" | "add_element";
  referenceAnalysis?: ReferenceAnalysis;
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
  let buffer: Buffer;
  try {
    buffer = await getImageBuffer(imagePath);
  } catch (error: any) {
    console.error(`Erreur lecture image S3: ${imagePath}`, error);
    throw new Error(`Image introuvable sur S3: ${imagePath}. ${error?.message || ''}`);
  }
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

  const analysisPrompt = `Tu es un expert en aménagement intérieur/extérieur, décoration, et design d'espace.
Analyse cette image de manière EXHAUSTIVE pour identifier:
1. TOUTES les SURFACES modifiables (murs, sols, plafonds, façades)
2. TOUS les OBJETS présents (meubles, luminaires, décorations, plantes, équipements)

Réponds UNIQUEMENT avec ce JSON valide (sans markdown, sans backticks):
{
  "roomType": "type d'espace (salon, chambre, cuisine, terrasse, jardin, bureau...)",
  "visibleZones": [
    {
      "id": "wall_left",
      "name": "Mur de gauche",
      "description": "Mur vertical situé sur le côté gauche de l'image",
      "boundaries": "Du coin inférieur gauche jusqu'au plafond",
      "currentMaterial": "Peinture blanche mate",
      "elementType": "surface"
    },
    {
      "id": "floor_main",
      "name": "Sol",
      "description": "Surface horizontale au sol",
      "boundaries": "Toute la surface visible du sol",
      "currentMaterial": "Parquet bois clair",
      "elementType": "surface"
    }
  ],
  "visibleObjects": [
    {
      "id": "table_dining",
      "name": "Table à manger",
      "category": "table",
      "description": "Grande table rectangulaire avec plateau en bois",
      "position": "Centre de la pièce",
      "style": "moderne",
      "material": "bois massif",
      "color": "chêne naturel"
    },
    {
      "id": "chairs_dining",
      "name": "Chaises de salle à manger",
      "category": "chaise",
      "description": "Ensemble de 4 chaises assorties",
      "position": "Autour de la table",
      "style": "scandinave",
      "material": "bois et tissu",
      "color": "blanc et gris"
    },
    {
      "id": "lamp_ceiling",
      "name": "Suspension luminaire",
      "category": "luminaire",
      "description": "Lustre moderne au-dessus de la table",
      "position": "Au plafond, centre",
      "style": "industriel",
      "material": "métal",
      "color": "noir"
    },
    {
      "id": "plant_corner",
      "name": "Plante verte",
      "category": "plante",
      "description": "Grande plante d'intérieur en pot",
      "position": "Coin gauche",
      "style": "naturel",
      "material": "végétal",
      "color": "vert"
    }
  ],
  "lighting": "Lumière naturelle venant de la fenêtre à droite",
  "perspective": "Vue en légère plongée depuis l'entrée",
  "existingMaterials": [
    {"zone": "Sol", "type": "parquet", "color": "chêne clair", "texture": "bois veiné"}
  ]
}

CATÉGORIES D'OBJETS À IDENTIFIER:
- Meubles: table, chaise, canapé, fauteuil, lit, armoire, buffet, bureau, étagère, commode
- Luminaires: lustre, suspension, lampadaire, lampe de table, applique, spot
- Décoration: tableau, miroir, vase, sculpture, coussin, rideau, tapis, horloge
- Plantes: plante d'intérieur, arbre, arbuste, fleurs, jardinière
- Équipements: radiateur, climatiseur, télévision, ordinateur
- Cuisine: plan de travail, crédence, évier, robinet, électroménager
- Salle de bain: lavabo, baignoire, douche, toilettes, miroir

RÈGLES D'IDENTIFICATION:
- Identifie CHAQUE surface visible séparément
- Identifie CHAQUE objet/meuble visible
- Sois PRÉCIS sur les matériaux, couleurs, styles
- Utilise des IDs uniques et descriptifs`;

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
      console.log(`   ✓ ${analysis.visibleZones.length} surfaces identifiées:`);
      for (const zone of analysis.visibleZones) {
        console.log(
          `      - ${zone.name} (${zone.id}): ${zone.currentMaterial}`
        );
      }
      if (analysis.visibleObjects && analysis.visibleObjects.length > 0) {
        console.log(
          `   ✓ ${analysis.visibleObjects.length} objets identifiés:`
        );
        for (const obj of analysis.visibleObjects) {
          console.log(
            `      - ${obj.name} (${obj.category}): ${obj.style} ${obj.material}`
          );
        }
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
        elementType: "surface",
      },
      {
        id: "wall_right",
        name: "Mur droit",
        description: "Mur côté droit",
        boundaries: "droite de l'image",
        currentMaterial: "inconnu",
        elementType: "surface",
      },
      {
        id: "wall_back",
        name: "Mur du fond",
        description: "Mur face",
        boundaries: "fond de l'image",
        currentMaterial: "inconnu",
        elementType: "surface",
      },
      {
        id: "floor_main",
        name: "Sol",
        description: "Surface au sol",
        boundaries: "partie basse",
        currentMaterial: "inconnu",
        elementType: "surface",
      },
    ],
    visibleObjects: [],
    lighting: "éclairage standard",
    perspective: "vue frontale",
    existingMaterials: [],
  };
}

// ============================================================================
// AGENT 1B: ANALYSE DE LA RÉFÉRENCE (Matériau vs Objet)
// ============================================================================
// Détermine si l'image de référence est un matériau/texture ou un objet complet

interface ReferenceAnalysis {
  type: "material" | "object";
  category: string; // "carrelage", "peinture", "table", "chaise", etc.
  description: string;
  mainColor: string;
  style: string; // moderne, classique, industriel, etc.
  material: string; // bois, métal, tissu, etc.
  action: "apply_texture" | "replace_object" | "add_element";
}

async function analyzeReferenceImage(imageData: {
  base64: string;
  mimeType: string;
}): Promise<ReferenceAnalysis> {
  console.log("   🎨 Analyse de l'image de référence...");

  const referencePrompt = `Tu es un expert en design d'intérieur et décoration.
Analyse cette image de RÉFÉRENCE et détermine ce qu'elle représente.

QUESTION PRINCIPALE: Est-ce un MATÉRIAU/TEXTURE ou un OBJET COMPLET?

MATÉRIAU/TEXTURE = échantillon de surface sans forme définie
Exemples: carrelage, parquet, peinture, béton ciré, pierre, tissu, papier peint, brique

OBJET COMPLET = élément avec une forme et structure propre
Exemples: table, chaise, canapé, lampe, plante, tableau, lit, bureau, luminaire

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans backticks):
{
  "type": "material" ou "object",
  "category": "catégorie précise (ex: table à manger, parquet chevron, lustre moderne)",
  "description": "description détaillée de ce que montre l'image",
  "mainColor": "couleur dominante",
  "style": "style déco (moderne, scandinave, industriel, classique, bohème, minimaliste)",
  "material": "matière principale (bois, métal, verre, tissu, céramique, etc.)",
  "action": "apply_texture" si matériau, "replace_object" si objet existant à remplacer, "add_element" si ajout
}

INDICES pour identifier un MATÉRIAU:
- Image en gros plan de texture
- Pas de forme reconnaissable d'objet
- Pattern répétitif
- Échantillon sans contexte

INDICES pour identifier un OBJET:
- Forme complète visible (meuble, luminaire, plante)
- Objet photographié en entier ou partiellement
- Élément avec structure 3D
- Produit identifiable

Sois PRÉCIS dans ta classification, c'est CRUCIAL pour la génération.`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.ANALYZER,
      contents: [
        { text: referencePrompt },
        {
          inlineData: { mimeType: imageData.mimeType, data: imageData.base64 },
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]) as ReferenceAnalysis;
      console.log(`   ✓ Type de référence: ${analysis.type.toUpperCase()}`);
      console.log(`   ✓ Catégorie: ${analysis.category}`);
      console.log(`   ✓ Action: ${analysis.action}`);
      console.log(
        `   ✓ Style: ${analysis.style}, Matière: ${analysis.material}`
      );
      return analysis;
    }
  } catch (error) {
    console.warn("   ⚠️ Analyse de référence échouée, fallback matériau");
  }

  // Fallback: on suppose que c'est un matériau
  return {
    type: "material",
    category: "matériau",
    description: "Image de référence non analysée",
    mainColor: "inconnu",
    style: "neutre",
    material: "inconnu",
    action: "apply_texture",
  };
}

// ============================================================================
// AGENT 2: PLANIFICATEUR INTELLIGENT (Gemini Flash - Texte)
// ============================================================================
// Interprète les instructions utilisateur, analyse les références, et crée le plan

async function planModificationsWithAgent(
  analysis: ImageAnalysis,
  instructions: GenerationInstruction[],
  referenceImages: { base64: string; mimeType: string }[]
): Promise<ModificationPlan> {
  console.log(
    "   📋 Agent Planificateur: Analyse intelligente des modifications..."
  );

  // 1. Analyser chaque image de référence
  console.log("\n   🔍 Étape 1: Analyse des images de référence...");
  const referenceAnalyses: ReferenceAnalysis[] = [];
  for (let i = 0; i < referenceImages.length; i++) {
    console.log(
      `   📷 Analyse référence ${i + 1}/${referenceImages.length}...`
    );
    const refAnalysis = await analyzeReferenceImage(referenceImages[i]);
    referenceAnalyses.push(refAnalysis);
  }

  // 2. Contexte des zones (surfaces) identifiées
  const zonesContext = analysis.visibleZones
    .map(
      (z) =>
        `- SURFACE | ID: "${z.id}" | Nom: "${z.name}" | Type: ${
          z.elementType || "surface"
        } | Matériau: ${z.currentMaterial}`
    )
    .join("\n");

  // 3. Contexte des objets identifiés
  const objectsContext = (analysis.visibleObjects || [])
    .map(
      (o) =>
        `- OBJET | ID: "${o.id}" | Nom: "${o.name}" | Catégorie: ${o.category} | Style: ${o.style} | Position: ${o.position}`
    )
    .join("\n");

  // 4. Contexte des références avec leur type
  const referencesContext = instructions
    .map((instr, i) => {
      const refAnalysis = referenceAnalyses[i];
      return `${i + 1}. Instruction: "${instr.location}"
     → Référence: ${instr.referenceName || "image " + (i + 1)}
     → Type détecté: ${refAnalysis?.type?.toUpperCase() || "INCONNU"} (${
        refAnalysis?.category || "non analysé"
      })
     → Action: ${refAnalysis?.action || "apply_texture"}`;
    })
    .join("\n");

  const planningPrompt = `Tu es un expert en aménagement et décoration d'intérieur/extérieur.

ÉLÉMENTS IDENTIFIÉS DANS L'IMAGE ORIGINALE:

SURFACES (murs, sols, plafonds):
${zonesContext || "Aucune surface identifiée"}

OBJETS (meubles, luminaires, déco, plantes):
${objectsContext || "Aucun objet identifié"}

INSTRUCTIONS DE L'UTILISATEUR AVEC ANALYSE DES RÉFÉRENCES:
${referencesContext}

Ta mission: Créer un plan de modification INTELLIGENT.

RÈGLES CRUCIALES:
1. Si la référence est un MATÉRIAU → action = "apply_texture" sur une SURFACE
2. Si la référence est un OBJET → action = "replace_object" pour remplacer un objet similaire
3. Matcher la catégorie de l'objet de référence avec les objets dans l'image
   - Référence = table → chercher les tables dans l'image
   - Référence = lampe → chercher les luminaires dans l'image
   - Référence = plante → chercher les plantes dans l'image

EXEMPLES:
- "table" + référence type OBJET (table moderne) → replace_object sur table_dining
- "mur" + référence type MATÉRIAU (peinture) → apply_texture sur wall_*
- "luminaire" + référence type OBJET (lustre) → replace_object sur lamp_ceiling

Réponds avec ce JSON (sans markdown):
{
  "mappings": [
    {
      "instructionIndex": 0,
      "action": "apply_texture | replace_object | add_element",
      "targetType": "surface | object",
      "targetIds": ["wall_left", "wall_right"],
      "interpretation": "Appliquer la peinture bleue sur les murs"
    },
    {
      "instructionIndex": 1,
      "action": "replace_object",
      "targetType": "object",
      "targetIds": ["table_dining"],
      "interpretation": "Remplacer la table actuelle par la table moderne de référence"
    }
  ],
  "warnings": []
}`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.ANALYZER,
      contents: [{ text: planningPrompt }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const mapping = JSON.parse(jsonMatch[0]);
      let tasks: ModificationTask[] = [];

      for (const m of mapping.mappings || []) {
        const instruction = instructions[m.instructionIndex];
        const refAnalysis = referenceAnalyses[m.instructionIndex];
        const actionType = m.action || refAnalysis?.action || "apply_texture";

        for (const targetId of m.targetIds || []) {
          if (m.targetType === "object" || actionType === "replace_object") {
            // C'est un remplacement d'objet
            const targetObj = (analysis.visibleObjects || []).find(
              (o) => o.id === targetId
            );
            if (targetObj) {
              tasks.push({
                priority: m.instructionIndex,
                targetObject: targetObj,
                targetMaterial:
                  instruction.referenceName ||
                  refAnalysis?.category ||
                  "objet de référence",
                referenceIndex: m.instructionIndex,
                specificInstructions: m.interpretation || instruction.location,
                actionType: "replace_object",
                referenceAnalysis: refAnalysis,
              });
            }
          } else {
            // C'est une application de matériau sur surface
            const zone = analysis.visibleZones.find((z) => z.id === targetId);
            if (zone) {
              tasks.push({
                priority: m.instructionIndex,
                zone: zone,
                targetMaterial:
                  instruction.referenceName ||
                  refAnalysis?.category ||
                  "matériau de référence",
                referenceIndex: m.instructionIndex,
                specificInstructions: m.interpretation || instruction.location,
                actionType: "apply_texture",
                referenceAnalysis: refAnalysis,
              });
            }
          }
        }
      }

      // Résolution des conflits
      const elementAssignments = new Map<string, ModificationTask>();
      for (const task of tasks) {
        const id = task.zone?.id || task.targetObject?.id || "";
        const existing = elementAssignments.get(id);
        if (existing) {
          if (task.referenceIndex > existing.referenceIndex) {
            elementAssignments.set(id, task);
          }
        } else {
          elementAssignments.set(id, task);
        }
      }
      tasks = Array.from(elementAssignments.values());

      console.log(`\n   ✓ ${tasks.length} tâches de modification planifiées:`);
      for (const task of tasks) {
        const targetName = task.zone?.name || task.targetObject?.name || "?";
        const emoji = task.actionType === "replace_object" ? "🔄" : "🎨";
        console.log(
          `      ${emoji} ${task.actionType}: ${targetName} → ${task.targetMaterial}`
        );
      }

      const globalPrompt = buildOptimizedPrompt(
        analysis,
        tasks,
        instructions,
        referenceAnalyses
      );
      return { originalAnalysis: analysis, tasks, globalPrompt };
    }
  } catch (error) {
    console.warn("   ⚠️ Planification échouée, utilisation du mapping direct");
  }

  // Fallback: mapping direct basé sur les mots-clés et l'analyse de référence
  const tasks: ModificationTask[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const instr = instructions[i];
    const location = instr.location.toLowerCase();
    const refAnalysis = referenceAnalyses[i];

    // Déterminer le type d'action basé sur l'analyse de référence
    const actionType = refAnalysis?.action || "apply_texture";

    if (actionType === "replace_object" && analysis.visibleObjects) {
      // Chercher un objet correspondant
      const matchedObjects: ObjectInfo[] = [];
      for (const obj of analysis.visibleObjects) {
        const objLower = obj.name.toLowerCase();
        const catLower = obj.category.toLowerCase();

        // Matcher par catégorie ou nom
        if (
          location.includes("table") &&
          (catLower.includes("table") || objLower.includes("table"))
        ) {
          matchedObjects.push(obj);
        } else if (
          location.includes("chaise") &&
          (catLower.includes("chaise") || catLower.includes("chair"))
        ) {
          matchedObjects.push(obj);
        } else if (
          location.includes("lampe") ||
          location.includes("luminaire") ||
          location.includes("lustre")
        ) {
          if (
            catLower.includes("lum") ||
            catLower.includes("lamp") ||
            catLower.includes("light")
          ) {
            matchedObjects.push(obj);
          }
        } else if (location.includes("plante")) {
          if (catLower.includes("plant") || catLower.includes("végét")) {
            matchedObjects.push(obj);
          }
        } else if (location.includes("canapé") || location.includes("sofa")) {
          if (
            catLower.includes("canap") ||
            catLower.includes("sofa") ||
            catLower.includes("fauteuil")
          ) {
            matchedObjects.push(obj);
          }
        }
      }

      for (const obj of matchedObjects) {
        tasks.push({
          priority: i,
          targetObject: obj,
          targetMaterial:
            instr.referenceName || refAnalysis?.category || "référence",
          referenceIndex: i,
          specificInstructions: instr.location,
          actionType: "replace_object",
          referenceAnalysis: refAnalysis,
        });
      }
    } else {
      // Application de matériau sur surfaces
      const matchedZones: ZoneInfo[] = [];

      for (const zone of analysis.visibleZones) {
        const zoneLower = zone.name.toLowerCase();
        const zoneIdLower = zone.id.toLowerCase();

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
        } else if (location.includes("mur") && zoneIdLower.includes("wall")) {
          matchedZones.push(zone);
        }
      }

      // Si aucune correspondance, utiliser la première zone
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
          targetMaterial:
            instr.referenceName || refAnalysis?.category || "référence",
          referenceIndex: i,
          specificInstructions: instr.location,
          actionType: "apply_texture",
          referenceAnalysis: refAnalysis,
        });
      }
    }
  }

  console.log(`   ✓ ${tasks.length} tâches (fallback)`);

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

// ============================================================================
// CONSTRUCTION DU PROMPT OPTIMISÉ (POLYVALENT: MATÉRIAUX ET OBJETS)
// ============================================================================

function buildOptimizedPrompt(
  analysis: ImageAnalysis,
  tasks: ModificationTask[],
  instructions: GenerationInstruction[],
  referenceAnalyses?: ReferenceAnalysis[]
): string {
  // Séparer les tâches par type d'action
  const materialTasks = tasks.filter(
    (t) => t.actionType === "apply_texture" || !t.actionType
  );
  const objectTasks = tasks.filter((t) => t.actionType === "replace_object");
  const addTasks = tasks.filter((t) => t.actionType === "add_element");

  // Construire les blocs de modification par type
  const modificationBlocks: string[] = [];

  // BLOC 1: Applications de matériaux sur surfaces
  if (materialTasks.length > 0) {
    modificationBlocks.push(`
## 🎨 MODIFICATIONS DE SURFACES (Application de matériaux)
`);
    const groupedMaterials = new Map<number, ModificationTask[]>();
    for (const task of materialTasks) {
      if (!groupedMaterials.has(task.referenceIndex)) {
        groupedMaterials.set(task.referenceIndex, []);
      }
      groupedMaterials.get(task.referenceIndex)!.push(task);
    }

    groupedMaterials.forEach((zoneTasks, refIndex) => {
      const instruction = instructions[refIndex];
      const refAnalysis = referenceAnalyses?.[refIndex];
      const materialName =
        instruction.referenceName ||
        refAnalysis?.category ||
        "matériau de référence";

      const zoneDescriptions = zoneTasks
        .map((t) => {
          if (t.zone) {
            return `   • **${t.zone.name}**: ${t.zone.description}
      - Limites: ${t.zone.boundaries}
      - Matériau actuel: ${t.zone.currentMaterial}`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");

      modificationBlocks.push(`
### SURFACE ${refIndex + 1}: Appliquer "${materialName}"
**Image de référence**: IMAGE ${refIndex + 2}
**Style**: ${refAnalysis?.style || "non spécifié"} | **Couleur**: ${
        refAnalysis?.mainColor || "non spécifiée"
      }

**Zones ciblées**:
${zoneDescriptions}

**Instructions**:
1. Examiner l'IMAGE ${
        refIndex + 2
      } pour comprendre: texture, couleur, motifs, reflets
2. APPLIQUER ce matériau sur 100% de chaque surface listée
3. Aucune trace de l'ancien matériau ne doit rester
4. Adapter les ombres et reflets à l'éclairage ambiant`);
    });
  }

  // BLOC 2: Remplacements d'objets
  if (objectTasks.length > 0) {
    modificationBlocks.push(`
## 🔄 REMPLACEMENTS D'OBJETS (Substitution complète)
`);
    for (const task of objectTasks) {
      const instruction = instructions[task.referenceIndex];
      const refAnalysis = task.referenceAnalysis;
      const objectName =
        instruction.referenceName ||
        refAnalysis?.category ||
        "objet de référence";
      const targetObj = task.targetObject;

      modificationBlocks.push(`
### OBJET: Remplacer "${targetObj?.name || "objet"}" par "${objectName}"
**Image de référence**: IMAGE ${task.referenceIndex + 2}
**Type d'objet**: ${refAnalysis?.category || "meuble/décoration"}
**Style**: ${refAnalysis?.style || "non spécifié"} | **Matière**: ${
        refAnalysis?.material || "non spécifiée"
      } | **Couleur**: ${refAnalysis?.mainColor || "non spécifiée"}

**Objet à remplacer**:
   • **${targetObj?.name || "Objet cible"}**
   - Catégorie: ${targetObj?.category || "meuble"}
   - Position: ${targetObj?.position || "dans l'image"}
   - Style actuel: ${targetObj?.style || "non spécifié"}

**Instructions CRITIQUES**:
1. SUPPRIMER COMPLÈTEMENT l'objet actuel (${targetObj?.name})
2. INSÉRER l'objet visible dans l'IMAGE ${
        task.referenceIndex + 2
      } À LA MÊME POSITION
3. Conserver les MÊMES DIMENSIONS approximatives (adapter à l'espace)
4. Adapter l'éclairage et les ombres pour intégration réaliste
5. L'objet de remplacement doit respecter la perspective de la scène`);
    }
  }

  // BLOC 3: Ajouts d'éléments
  if (addTasks.length > 0) {
    modificationBlocks.push(`
## ➕ AJOUTS D'ÉLÉMENTS (Nouveaux éléments)
`);
    for (const task of addTasks) {
      const instruction = instructions[task.referenceIndex];
      const refAnalysis = task.referenceAnalysis;
      const elementName =
        instruction.referenceName || refAnalysis?.category || "élément";

      modificationBlocks.push(`
### AJOUT: Insérer "${elementName}"
**Image de référence**: IMAGE ${task.referenceIndex + 2}
**Position demandée**: ${instruction.location}

**Instructions**:
1. Examiner l'élément dans l'IMAGE ${task.referenceIndex + 2}
2. L'INSÉRER à la position indiquée
3. Adapter taille et perspective à la scène
4. Intégrer naturellement avec ombres appropriées`);
    }
  }

  // Construction du contexte des objets visibles
  const objectsListing = (analysis.visibleObjects || [])
    .map((o) => `   - ${o.name} (${o.category}) - ${o.position}`)
    .join("\n");

  return `# MISSION: TRANSFORMATION D'ESPACE PHOTORÉALISTE

Tu es un moteur de rendu IA spécialisé en visualisation d'aménagement intérieur et extérieur.
Tu peux réaliser TOUS types de modifications: changement de matériaux, remplacement de meubles, ajout de décoration, modification de luminaires, ajout de plantes, etc.

## ANALYSE DE L'IMAGE ORIGINALE (IMAGE 1)
- **Type d'espace**: ${analysis.roomType}
- **Éclairage**: ${analysis.lighting}
- **Perspective caméra**: ${analysis.perspective}

**Surfaces identifiées**: ${analysis.visibleZones.map((z) => z.name).join(", ")}

**Objets identifiés**:
${objectsListing || "   - Aucun objet spécifique identifié"}

## IMAGES FOURNIES
- **IMAGE 1**: Photo originale de l'espace (AVANT transformation)
- **IMAGES 2, 3, ...**: Éléments de RÉFÉRENCE (matériaux OU objets à utiliser)

${modificationBlocks.join("\n")}

## RÈGLES ABSOLUES

### POUR LES MATÉRIAUX (surfaces):
- Appliquer la texture/couleur sur 100% de la surface indiquée
- Aucune trace de l'ancien matériau ne doit subsister
- Respecter la perspective et l'éclairage existants

### POUR LES OBJETS (meubles, déco, luminaires, plantes):
- REMPLACER INTÉGRALEMENT l'objet existant par celui de la référence
- Conserver la MÊME POSITION dans l'espace
- Adapter les dimensions pour un rendu réaliste
- Intégrer parfaitement avec ombres et reflets cohérents

### COHÉRENCE GLOBALE:
- Perspective IDENTIQUE à l'image originale
- Éclairage cohérent sur tous les éléments
- Qualité photoréaliste professionnelle

### NE PAS MODIFIER:
- Les éléments non mentionnés dans les instructions
- La structure architecturale (murs, plafond, fenêtres) sauf si demandé
- Les équipements techniques (prises, interrupteurs) sauf si demandé

## ACTION FINALE
Génère UNE image photoréaliste montrant l'espace APRÈS toutes les transformations demandées.`;
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
  type: "log" | "step" | "error";
  icon?: string;
  message?: string;
  step?: string;
  status?: "pending" | "loading" | "done" | "error";
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
    onProgress({ type: "log", icon, message });
  };

  const setStep = (
    step: string,
    status: "pending" | "loading" | "done" | "error"
  ) => {
    onProgress({ type: "step", step, status });
  };

  log("🤖", "SYSTÈME AGENTIQUE DE GÉNÉRATION AVANT/APRÈS");
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

  const referenceImages: { base64: string; mimeType: string }[] = [];
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

  setStep("upload", "done");

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: ANALYSE AGENTIQUE
  // ═══════════════════════════════════════════════════════════════════════

  setStep("analyze", "loading");
  log("🔬", "PHASE 1: Analyse intelligente de l'image");
  log("🧠", "Identification des éléments de la pièce...");

  const analysis = await analyzeImageWithAgent(originalImage);

  log(
    "✓",
    `Analyse terminée: ${analysis.roomType} - ${
      analysis.visibleZones.length
    } surfaces, ${(analysis.visibleObjects || []).length} objets`
  );
  setStep("analyze", "done");

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: PLANIFICATION DES MODIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  setStep("plan", "loading");
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
      const targetName = task.zone?.name || task.targetObject?.name || "Cible";
      const actionEmoji = task.actionType === "replace_object" ? "🔄" : "🎨";
      log(
        "📍",
        `${actionEmoji} ${
          task.actionType
        }: ${targetName} → ${task.targetMaterial.substring(0, 40)}`
      );
    }
  }
  setStep("plan", "done");

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: GÉNÉRATION AVEC RETRY
  // ═══════════════════════════════════════════════════════════════════════

  setStep("generate", "loading");
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

      setStep("generate", "done");
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
      log(
        "❌",
        `Échec: ${(lastError?.message || "Erreur inconnue").substring(0, 150)}`
      );

      if (attempt < CONFIG.maxRetries) {
        const delay = Math.min(
          CONFIG.initialDelayMs *
            Math.pow(CONFIG.backoffMultiplier, attempt - 1),
          CONFIG.maxDelayMs
        );
        log("⏳", `Nouveau essai dans ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  setStep("generate", "error");
  onProgress({
    type: "error",
    message: `Échec après ${CONFIG.maxRetries} tentatives: ${lastError?.message}`,
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
      const zones = relevantTasks
        .map((t) => t.zone?.name || t.targetObject?.name || "cible")
        .join(", ");
      const action =
        relevantTasks[0]?.actionType === "replace_object"
          ? "Remplacer par l'objet de"
          : "Appliquer le matériau de";
      return `${i + 1}. Cibles: ${zones || instr.location}
   ${action} l'IMAGE ${i + 2}${
        instr.referenceName ? ` (${instr.referenceName})` : ""
      }`;
    })
    .join("\n\n");

  return `Génère une image APRÈS TRANSFORMATION basée sur l'IMAGE 1.

MODIFICATIONS REQUISES:
${mods}

RÈGLES:
- Pour les MATÉRIAUX: appliquer sur 100% de la surface
- Pour les OBJETS: remplacer intégralement l'objet existant
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
