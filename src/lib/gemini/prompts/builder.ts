// ============================================================================
// CONSTRUCTION DU PROMPT DE GÉNÉRATION
// ============================================================================
// Prompts optimisés avec:
// - Contraintes STRICTES anti-zoom/recadrage
// - Règles d'insertion photoréaliste
// - Couverture de tous les métiers du bâtiment
// ============================================================================

import type {
  ImageAnalysis,
  ModificationTask,
  GenerationInstruction,
  ReferenceAnalysis,
} from "../types";

/**
 * Contraintes ABSOLUES de cadrage - Anti-zoom RENFORCÉES
 */
const STRICT_FRAMING_RULES = `
## 🚨🚨🚨 CONTRAINTES ABSOLUES DE CADRAGE - RESPECT IMPÉRATIF 🚨🚨🚨

### ❌ INTERDICTIONS STRICTES - ÉCHEC SI NON RESPECTÉES:
- ❌ NE JAMAIS zoomer avant (rapprocher)
- ❌ NE JAMAIS zoomer arrière (éloigner)
- ❌ NE JAMAIS recadrer l'image
- ❌ NE JAMAIS modifier l'angle de vue
- ❌ NE JAMAIS changer les proportions (aspect ratio)
- ❌ NE JAMAIS rogner les bords de l'image
- ❌ NE JAMAIS ajouter de marges ou de bordures
- ❌ NE JAMAIS modifier la perspective de la caméra
- ❌ NE JAMAIS déplacer le point de vue
- ❌ NE JAMAIS montrer une version agrandie ou réduite de la scène
- ❌ NE JAMAIS "améliorer" le cadrage
- ❌ NE JAMAIS centrer différemment la composition
- ❌ NE JAMAIS inclure plus ou moins de la scène que l'original

### ✅ OBLIGATIONS IMPÉRATIVES - À RESPECTER PIXEL PAR PIXEL:
- ✅ Conserver EXACTEMENT le même cadrage que l'IMAGE 1
- ✅ Conserver EXACTEMENT la même perspective
- ✅ Conserver EXACTEMENT les mêmes proportions (aspect ratio)
- ✅ Conserver EXACTEMENT la même position de caméra
- ✅ Conserver EXACTEMENT la même distance focale apparente
- ✅ Les bords de l'image générée DOIVENT correspondre EXACTEMENT
- ✅ La composition spatiale doit être STRICTEMENT IDENTIQUE
- ✅ Les objets fixes (murs, fenêtres, portes) doivent être aux MÊMES positions
- ✅ L'horizon doit être à la MÊME hauteur
- ✅ Les lignes de fuite doivent converger au MÊME point

### 🔍 TEST DE VÉRIFICATION ABSOLU:
Imagine que l'on superpose l'image originale et l'image générée en transparence:
- Les contours architecturaux DOIVENT se superposer PARFAITEMENT
- Les angles des murs, plafonds, sols DOIVENT être IDENTIQUES
- Les positions des fenêtres, portes DOIVENT être les MÊMES
- Le plafond doit toucher le bord supérieur au MÊME endroit
- Le sol doit toucher le bord inférieur au MÊME endroit
- Les éléments NON modifiés doivent être IDENTIQUES pixel par pixel
- AUCUN décalage, AUCUN glissement ne doit être visible

### ⚠️ ERREURS FRÉQUENTES À ÉVITER:
- Zoomer légèrement pour "améliorer" la composition → INTERDIT
- Montrer un peu plus de la pièce → INTERDIT
- Recadrer pour mieux centrer l'objet modifié → INTERDIT
- Changer subtilement l'angle pour montrer plus → INTERDIT`;

/**
 * Règles d'insertion photoréaliste ULTRA-DÉTAILLÉES
 */
const PHOTOREALISTIC_INSERTION_RULES = `
## 🎨 RÈGLES D'INSERTION PHOTORÉALISTE - QUALITÉ PROFESSIONNELLE

### 📸 TYPES DE RÉFÉRENCES À INTÉGRER:
L'élément de référence peut provenir de:
- Photo de produit sur fond blanc/neutre (catalogue)
- Rendu 3D de meuble/équipement
- Capture de modèle 3D (SketchUp, Blender, 3ds Max)
- Image de catalogue de marque
- Photo détourée d'objet
- Visualisation architecturale
- Photo d'ambiance/inspiration

### 🔆 1. ADAPTATION DE L'ÉCLAIRAGE (CRITIQUE):

**Analyser la scène originale:**
- Identifier la source principale de lumière (fenêtre, luminaire, etc.)
- Noter la direction exacte des rayons lumineux
- Observer l'intensité (douce, dure, diffuse)
- Identifier les sources secondaires (réflexions, lumières d'appoint)

**Appliquer sur l'élément inséré:**
- Éclairer l'objet depuis la MÊME direction que la scène
- Créer des zones d'ombre et de lumière cohérentes sur l'objet
- Adapter la luminosité générale de l'objet à la scène
- Les parties face à la lumière doivent être plus claires
- Les parties opposées doivent être plus sombres
- Respecter le ratio de contraste de la scène

**Température de couleur:**
- Lumière naturelle = légèrement bleutée/neutre
- Lumière artificielle chaude = teintes orangées/jaunes
- Lumière LED = peut être chaude ou froide selon les sources
- L'objet inséré DOIT avoir la même dominante chromatique

### 📐 2. RESPECT DE LA PERSPECTIVE (GÉOMÉTRIE EXACTE):

**Analyser la perspective de la scène:**
- Identifier le ou les points de fuite
- Tracer mentalement les lignes de fuite principales
- Noter la hauteur de l'horizon (ligne des yeux)
- Comprendre si c'est une vue frontale, à 1 point, 2 points, ou 3 points

**Appliquer sur l'élément inséré:**
- L'objet DOIT respecter les mêmes lignes de fuite
- Les lignes horizontales de l'objet convergent vers le même point de fuite
- Les lignes verticales restent verticales (sauf perspective 3 points)
- La déformation perspective doit être cohérente avec la distance

**Échelle et proportions:**
- Comparer l'objet aux éléments de référence (porte ~2m, plan de travail ~90cm)
- L'échelle doit être RÉALISTE par rapport à l'environnement
- Un objet trop grand ou trop petit brise l'illusion

### 🌑 3. OMBRES & REFLETS (RÉALISME CRITIQUE):

**Types d'ombres à créer:**
1. **Ombre portée**: ombre projetée sur le sol/mur par l'objet
   - Direction identique aux ombres existantes dans la scène
   - Dureté identique (floue si lumière diffuse, nette si directionnelle)
   - Couleur légèrement teintée par l'environnement

2. **Ombre de contact (Ambient Occlusion)**: 
   - Zone sombre où l'objet touche le sol/support
   - ESSENTIELLE pour que l'objet ne flotte pas
   - Fine ligne sombre à la base de l'objet

3. **Ombres propres de l'objet**:
   - Parties de l'objet qui ne reçoivent pas de lumière directe
   - Cohérentes avec l'éclairage de la scène

**Reflets à gérer:**
- Si sol brillant (carrelage, parquet verni): reflet vertical de l'objet
- Si surfaces métalliques proches: reflets de l'environnement sur l'objet
- Si l'objet est brillant: reflets des fenêtres/lumières sur l'objet

### 🎨 4. INTÉGRATION CHROMATIQUE (COLOR GRADING):

**Analyse de l'ambiance colorimétrique:**
- Identifier la dominante de couleur de la scène (chaude, froide, neutre)
- Noter le niveau de saturation général
- Observer le contraste général (photo vintage = faible, moderne = fort)

**Application sur l'objet inséré:**
- Appliquer la même dominante de couleur
- Ajuster la saturation pour correspondre
- Unifier les noirs et les blancs avec ceux de la scène
- L'objet ne doit pas sembler "plus coloré" ou "moins coloré" que le reste

**Inter-réflexions (Color Bleeding):**
- Si mur rouge à côté, légère teinte rouge sur l'objet proche
- Si sol beige clair, lumière rebondie chaude sous l'objet
- Ces subtilités créent un réalisme avancé

### 🔬 5. FINITION & COHÉRENCE OPTIQUE:

**Profondeur de champ:**
- Si la scène a du flou (bokeh) en arrière-plan ou premier-plan
- Appliquer le même niveau de netteté/flou sur l'objet selon sa distance

**Grain & texture photo:**
- Si photo légèrement grainée, ajouter le même grain sur l'objet
- Cohérence de la qualité d'image globale

**Bords et détourage:**
- AUCUN bord dur visible autour de l'objet inséré
- AUCUN halo clair ou foncé sur les contours
- Les bords doivent se fondre naturellement avec le fond

**Résolution et netteté:**
- L'objet doit avoir la même netteté que le reste de la scène
- Pas de pixelisation, pas de flou artificiel

### 🧱 POUR LES MATÉRIAUX / TEXTURES SUR SURFACES:

**Application sur la surface:**
1. Appliquer sur 100% de la surface indiquée (du bord au bord)
2. AUCUNE trace de l'ancien matériau ne doit rester
3. Aucun effet "patch" ou "collage" visible

**Perspective du matériau:**
- Les lignes du carrelage/parquet suivent la perspective du sol
- Les motifs du papier peint sont verticaux sur les murs verticaux
- L'échelle du motif diminue avec la distance (perspective)

**Joints et raccords:**
- Joints de carrelage visibles et réguliers selon la perspective
- Lames de parquet dans la bonne direction
- Motifs de papier peint raccordés correctement

**Réflexion et brillance:**
- Si surface mate: pas de reflet spéculaire
- Si surface satinée: léger reflet diffus
- Si surface brillante: reflets nets des sources lumineuses
- Si surface miroir: reflet de l'environnement visible

### ✅ CHECKLIST QUALITÉ AVANT GÉNÉRATION:
□ L'éclairage de l'objet correspond à celui de la scène
□ Les ombres sont cohérentes avec les autres ombres de la scène
□ L'ombre de contact existe à la base de l'objet
□ La perspective de l'objet suit les lignes de fuite de la scène
□ L'échelle est réaliste par rapport à l'environnement
□ La température de couleur est unifiée
□ Aucun halo ou bord dur visible
□ L'objet semble photographié dans la scène, pas ajouté numériquement`;

/**
 * Construit le prompt optimisé pour la génération
 */
export function buildOptimizedPrompt(
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
## 🎨 MODIFICATIONS DE SURFACES (Application de matériaux/textures)
`);
    const groupedMaterials = new Map<number, ModificationTask[]>();
    for (const task of materialTasks) {
      if (!groupedMaterials.has(task.referenceIndex)) {
        groupedMaterials.set(task.referenceIndex, []);
      }
      groupedMaterials.get(task.referenceIndex)!.push(task);
    }

    groupedMaterials.forEach((surfaceTasks, refIndex) => {
      const instruction = instructions[refIndex];
      const refAnalysis = referenceAnalyses?.[refIndex];
      const materialName =
        instruction.referenceName ||
        refAnalysis?.category ||
        "matériau de référence";

      // Vérifier si un masque est présent pour cette référence
      const hasMaskForRef = surfaceTasks.some(t => t.hasMask);
      const maskAnalysisForRef = surfaceTasks.find(t => t.maskAnalysis)?.maskAnalysis;

      const surfaceDescriptions = surfaceTasks
        .map((t) => {
          if (t.targetSurface) {
            return `   • **${t.targetSurface.name}** (${t.targetSurface.category})
      - Limites: ${t.targetSurface.boundaries}
      - Matériau actuel à REMPLACER: ${t.targetSurface.currentMaterial}`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");

      // Informations sur le masque si présent
      const maskInfo = hasMaskForRef && maskAnalysisForRef
        ? `
### 🎭 ZONE DÉLIMITÉE PAR MASQUE (CRITIQUE - RESPECTER ABSOLUMENT)
⚠️ Un MASQUE COMBINÉ a été fourni montrant EXACTEMENT où appliquer ce matériau.
- **Zone identifiée**: ${maskAnalysisForRef.zoneDescription}
- **Position**: ${maskAnalysisForRef.position.horizontal} / ${maskAnalysisForRef.position.vertical}
- **Couverture**: ${maskAnalysisForRef.coveragePercent}% de l'image
- **Zone partielle**: ${maskAnalysisForRef.isPartial ? "OUI - appliquer QUE sur cette zone" : "NON - zone complète"}

� **INSTRUCTIONS MASQUE**:
1. REGARDER l'image du MASQUE COMBINÉ (montre le matériau dans la zone cible)
2. APPLIQUER le matériau UNIQUEMENT dans cette zone précise
3. NE PAS déborder en dehors de la zone masquée
4. La zone autour du masque = CONSERVER L'ASPECT ORIGINAL
`
        : "";

      modificationBlocks.push(`
### SURFACE ${refIndex + 1}: Appliquer "${materialName}"
**Image de référence**: IMAGE ${refIndex + 2}
**Type**: ${refAnalysis?.type || "matériau"} | **Style**: ${refAnalysis?.style || "non spécifié"}
**Couleur principale**: ${refAnalysis?.mainColor || "non spécifiée"} | **Finition**: ${refAnalysis?.finish || "non spécifiée"}
${refAnalysis?.pattern ? `**Motif**: ${refAnalysis.pattern}` : ""}
${maskInfo}
**Surfaces ciblées**:
${surfaceDescriptions}

**Instructions d'application**:
1. Examiner attentivement l'IMAGE ${refIndex + 2} pour comprendre: texture, couleur, motifs, reflets
2. ${hasMaskForRef ? "APPLIQUER ce matériau UNIQUEMENT dans la zone délimitée par le masque" : "APPLIQUER ce matériau sur 100% de chaque surface listée ci-dessus"}
3. AUCUNE trace de l'ancien matériau ne doit rester visible${hasMaskForRef ? " (dans la zone masquée)" : ""}
4. Adapter les ombres et reflets à l'éclairage de la scène
5. Respecter l'échelle du motif/texture selon la perspective`);
    });
  }

  // BLOC 2: Remplacements d'objets
  if (objectTasks.length > 0) {
    modificationBlocks.push(`
## 🔄 REMPLACEMENTS D'OBJETS (Substitution photoréaliste)
`);
    for (const task of objectTasks) {
      const instruction = instructions[task.referenceIndex];
      const refAnalysis = task.referenceAnalysis;
      const objectName =
        instruction.referenceName ||
        refAnalysis?.category ||
        "objet de référence";
      const targetObj = task.targetObject;

      const tips = refAnalysis?.integrationTips || [];
      const tipsText = tips.length > 0
        ? tips.map((tip) => `   - ${tip}`).join("\n")
        : "";

      modificationBlocks.push(`
### OBJET: Remplacer "${targetObj?.name || "objet existant"}" par "${objectName}"
**Image de référence**: IMAGE ${task.referenceIndex + 2}
**Type de référence**: ${refAnalysis?.type || "objet"}
**Style**: ${refAnalysis?.style || "non spécifié"} | **Matériau**: ${refAnalysis?.material || "non spécifié"} | **Couleur**: ${refAnalysis?.mainColor || "non spécifiée"}

**Objet à SUPPRIMER et REMPLACER**:
   • **${targetObj?.name || "Objet cible"}**
   - Catégorie: ${targetObj?.category || "objet"}
   - Position actuelle: ${targetObj?.position || "dans l'image"}
   - Style actuel: ${targetObj?.style || "non spécifié"}
   - Dimensions approximatives: ${targetObj?.estimatedDimensions || "à conserver"}

**Instructions de remplacement CRITIQUES**:
1. SUPPRIMER COMPLÈTEMENT l'objet actuel (${targetObj?.name})
2. INSÉRER l'objet visible dans l'IMAGE ${task.referenceIndex + 2} À LA MÊME POSITION EXACTE
3. Conserver des DIMENSIONS PROPORTIONNELLES à l'espace disponible
4. ADAPTER l'éclairage: observer la lumière de la scène et l'appliquer sur l'objet
5. GÉNÉRER des OMBRES RÉALISTES cohérentes avec l'éclairage ambiant
6. RESPECTER la perspective exacte de la scène
7. L'objet doit sembler PHOTOGRAPHIÉ dans la scène, pas ajouté numériquement
${tipsText ? `\n**Conseils d'intégration**:\n${tipsText}` : ""}`);
    }
  }

  // BLOC 3: Ajouts d'éléments
  if (addTasks.length > 0) {
    modificationBlocks.push(`
## ➕ AJOUTS D'ÉLÉMENTS (Nouvelles insertions photoréalistes)
`);
    for (const task of addTasks) {
      const instruction = instructions[task.referenceIndex];
      const refAnalysis = task.referenceAnalysis;
      const elementName =
        instruction.referenceName || refAnalysis?.category || "élément";

      const tips = refAnalysis?.integrationTips || [];
      const tipsText = tips.length > 0
        ? tips.map((tip) => `   - ${tip}`).join("\n")
        : "";

      // Construire les informations de quantité et position
      const quantityInfo = task.quantity 
        ? `**⚠️ QUANTITÉ PRÉCISE**: EXACTEMENT ${task.quantity} élément(s) - ${task.quantityText || ""}`
        : task.quantityText 
          ? `**Quantité**: ${task.quantityText}`
          : "";

      const positionInfo = task.positionConstraints
        ? `**⚠️ ZONE PRÉCISE**: ${task.positionConstraints.description}`
        : "";

      const sideInfo = task.positionConstraints?.side
        ? `**⚠️ POSITIONNEMENT**: Côté ${
            task.positionConstraints.side === "right" ? "DROIT" :
            task.positionConstraints.side === "left" ? "GAUCHE" :
            task.positionConstraints.side === "center" ? "CENTRE" :
            task.positionConstraints.side === "top" ? "HAUT" : "BAS"
          } UNIQUEMENT - NE PAS couvrir tout l'espace`
        : "";

      const areaInfo = task.positionConstraints?.area === "partial"
        ? `**⚠️ COUVERTURE**: PARTIELLE - seulement une section, PAS la totalité`
        : "";

      // Informations sur le masque si présent
      const maskInfo = task.hasMask && task.maskAnalysis
        ? `
### 🎭 ZONE DÉLIMITÉE PAR MASQUE (CRITIQUE - RESPECTER ABSOLUMENT)
⚠️ Un MASQUE COMBINÉ a été fourni montrant EXACTEMENT où placer cet élément.
- **Zone identifiée**: ${task.maskAnalysis.zoneDescription}
- **Type d'élément**: ${task.maskAnalysis.elementType}
- **Position**: ${task.maskAnalysis.position.horizontal} / ${task.maskAnalysis.position.vertical}
- **Couverture**: ${task.maskAnalysis.coveragePercent}% de l'image
- **Zone partielle**: ${task.maskAnalysis.isPartial ? "OUI - ne couvrir QUE cette zone" : "NON - zone complète"}

� **INSTRUCTIONS MASQUE**:
1. REGARDER l'image du MASQUE COMBINÉ fournie (montre la référence dans la zone cible)
2. APPLIQUER l'élément UNIQUEMENT dans cette zone précise
3. NE PAS déborder en dehors de la zone masquée
4. La zone noire autour = CONSERVER INTACT
5. La zone avec la référence visible = C'EST LÀ qu'il faut appliquer
`
        : "";

      modificationBlocks.push(`
### AJOUT: Insérer "${elementName}"
**Image de référence**: IMAGE ${task.referenceIndex + 2}
**Type**: ${refAnalysis?.type || "élément"}
**Instruction originale**: "${task.specificInstructions}"
${maskInfo}
${quantityInfo ? `${quantityInfo}\n` : ""}${sideInfo ? `${sideInfo}\n` : ""}${areaInfo ? `${areaInfo}\n` : ""}${positionInfo ? `${positionInfo}\n` : ""}
**Style**: ${refAnalysis?.style || "non spécifié"} | **Dimensions**: ${refAnalysis?.dimensions || "à adapter"}

**Instructions d'insertion CRITIQUES**:
1. Examiner l'élément dans l'IMAGE ${task.referenceIndex + 2}
2. ${task.quantity ? `PLACER EXACTEMENT ${task.quantity} éléments` : "Insérer l'élément"} à la position spécifiée${task.hasMask ? " (voir MASQUE COMBINÉ)" : ""}
3. ${task.positionConstraints?.side ? `POSITIONNER uniquement sur le côté ${task.positionConstraints.side === "right" ? "DROIT" : task.positionConstraints.side === "left" ? "GAUCHE" : task.positionConstraints.side.toUpperCase()} de la zone` : "Choisir un emplacement approprié"}
4. ${task.positionConstraints?.area === "partial" ? "NE PAS couvrir toute la surface - seulement une PARTIE" : "Intégrer naturellement dans l'espace"}
5. ADAPTER la taille et perspective à la scène existante
6. CRÉER des ombres réalistes cohérentes avec l'éclairage
7. INTÉGRER chromatiquement avec l'ambiance de la pièce
8. L'élément doit sembler APPARTENIR à la scène originale
${tipsText ? `\n**Conseils d'intégration**:\n${tipsText}` : ""}`);
    }
  }

  // Construction de la liste des objets identifiés
  const objectsListing = (analysis.objects || [])
    .map(
      (o) =>
        `   - ${o.name} (${o.category}) - Position: ${o.position} - Style: ${o.style}`
    )
    .join("\n");

  // Construction de la liste des surfaces
  const surfacesListing = (analysis.surfaces || [])
    .map(
      (s) =>
        `   - ${s.name} (${s.category}) - Matériau: ${s.currentMaterial}`
    )
    .join("\n");

  // Construction de la liste des équipements techniques
  const equipmentListing = (analysis.technicalEquipment || [])
    .map((e) => `   - ${e.type} (${e.category}) - Position: ${e.position}`)
    .join("\n");

  return `# 🎯 MISSION: TRANSFORMATION D'ESPACE PHOTORÉALISTE

Tu es un MOTEUR DE RENDU IA EXPERT spécialisé dans la visualisation de projets d'aménagement.
Tu peux réaliser TOUS types de modifications pour TOUS les métiers du bâtiment et de l'habitat:
• Décoration intérieure & extérieure
• Rénovation, architecture, agencement
• Menuiserie, fermetures, façades
• Plomberie, électricité, chauffage
• Énergies renouvelables (solaire, PAC)
• Paysagisme, piscine, spa
• Et tous autres métiers de l'habitat

${STRICT_FRAMING_RULES}

${PHOTOREALISTIC_INSERTION_RULES}

## 📊 ANALYSE DE L'IMAGE ORIGINALE (IMAGE 1)

**Type d'espace**: ${analysis.spaceType} (${analysis.environment})
**Éclairage**: ${analysis.lighting?.type || "non déterminé"} - ${analysis.lighting?.direction || ""}
**Intensité**: ${analysis.lighting?.intensity || "medium"} | **Température**: ${analysis.lighting?.temperature || "neutral"}
**Perspective**: ${analysis.perspective?.viewType || "frontale"} - ${analysis.perspective?.description || ""}
**Hauteur caméra**: ${analysis.perspective?.cameraHeight || "eye_level"}

### Surfaces identifiées:
${surfacesListing || "   Aucune surface spécifique identifiée"}

### Objets identifiés:
${objectsListing || "   Aucun objet spécifique identifié"}

### Équipements techniques:
${equipmentListing || "   Aucun équipement technique identifié"}

## 🖼️ IMAGES FOURNIES
- **IMAGE 1**: Photo originale de l'espace (AVANT transformation) - CADRAGE À RESPECTER ABSOLUMENT
- **IMAGES 2, 3, ...**: Éléments de RÉFÉRENCE (matériaux, objets, équipements à intégrer)

${modificationBlocks.join("\n")}

## 📋 RÈGLES FINALES ABSOLUES

### POUR TOUS LES TYPES DE MODIFICATIONS:
1. Le CADRAGE doit être STRICTEMENT IDENTIQUE à l'IMAGE 1
2. La PERSPECTIVE doit être EXACTEMENT la même
3. Les PROPORTIONS de l'image ne changent PAS
4. L'ÉCLAIRAGE des éléments modifiés doit être COHÉRENT avec la scène
5. Les OMBRES doivent être RÉALISTES et cohérentes
6. Le rendu doit être PHOTORÉALISTE de qualité professionnelle

### NE PAS MODIFIER (sauf si explicitement demandé):
- Les éléments non mentionnés dans les instructions
- La structure architecturale (position des murs, fenêtres, portes)
- L'éclairage naturel existant
- La perspective et le point de vue

### QUALITÉ ATTENDUE:
- Rendu indiscernable d'une vraie photographie
- Intégration parfaite des éléments modifiés
- Aucun artefact, halo, ou défaut visible
- Cohérence globale de la scène

## 🎬 ACTION FINALE
Génère UNE SEULE image photoréaliste montrant l'espace APRÈS toutes les transformations demandées.
L'image doit avoir EXACTEMENT le même cadrage, la même perspective, et les mêmes proportions que l'IMAGE 1.`;
}

/**
 * Prompt simplifié pour les retries
 */
export function buildSimplifiedRetryPrompt(
  instructions: GenerationInstruction[],
  tasks: ModificationTask[],
  attempt: number
): string {
  const mods = instructions
    .map((instr, i) => {
      const relevantTasks = tasks.filter((t) => t.referenceIndex === i);
      const targets = relevantTasks
        .map((t) => t.targetSurface?.name || t.targetObject?.name || "cible")
        .join(", ");
      const action =
        relevantTasks[0]?.actionType === "replace_object"
          ? "Remplacer par l'objet de"
          : relevantTasks[0]?.actionType === "add_element"
          ? "Ajouter l'élément de"
          : "Appliquer le matériau de";
      return `${i + 1}. Cibles: ${targets || instr.location}
   ${action} l'IMAGE ${i + 2}${instr.referenceName ? ` (${instr.referenceName})` : ""}`;
    })
    .join("\n\n");

  return `# TRANSFORMATION D'ESPACE - TENTATIVE ${attempt}

Génère une image APRÈS TRANSFORMATION basée sur l'IMAGE 1 (photo originale).

## MODIFICATIONS REQUISES:
${mods}

## RÈGLES ABSOLUES:
1. CADRAGE IDENTIQUE à l'IMAGE 1 - pas de zoom, pas de recadrage
2. PERSPECTIVE IDENTIQUE - même angle de vue, même point de vue
3. Pour les MATÉRIAUX: appliquer sur 100% de la surface indiquée
4. Pour les OBJETS: remplacer intégralement avec éclairage et ombres réalistes
5. Rendu PHOTORÉALISTE de qualité professionnelle

## ACTION:
Génère l'image maintenant avec le même cadrage exact que l'IMAGE 1.`;
}
