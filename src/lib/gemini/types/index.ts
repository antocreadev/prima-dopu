// ============================================================================
// TYPES & INTERFACES POUR LE SYSTÈME DE GÉNÉRATION AVANT/APRÈS
// ============================================================================

import type {
  ElementCategory,
  ModificationType,
  ModificationAction,
  ReferenceType,
  ReferenceAction,
} from "./categories";

// Re-export des catégories
export * from "./categories";

// ============================================================================
// INSTRUCTIONS DE GÉNÉRATION
// ============================================================================

/**
 * Instruction de modification fournie par l'utilisateur
 */
export interface GenerationInstruction {
  /** Description de la zone ou élément à modifier */
  location: string;
  /** Chemin vers l'image de référence */
  referenceImagePath: string;
  /** Chemin vers l'image de masque noir/blanc (optionnel) */
  maskImagePath?: string;
  /** Chemin vers le masque combiné (référence dans la zone) - généré côté serveur */
  combinedMaskPath?: string;
  /** Données du masque combiné en base64 (pour envoi à l'IA) */
  combinedMaskBase64?: string;
  /** Nom donné à la référence par l'utilisateur */
  referenceName?: string;
  /** Type de modification demandée */
  modificationType?: ModificationType;
  /** Détails supplémentaires sur la modification */
  additionalDetails?: string;
  /** Catégorie de l'élément cible (optionnel, détecté automatiquement) */
  targetCategory?: ElementCategory;
  /** Analyse du masque par l'IA */
  maskAnalysis?: MaskAnalysisInfo;
  /** Instruction améliorée basée sur l'analyse du masque */
  improvedLocation?: string;
}

/**
 * Informations sur l'analyse du masque
 */
export interface MaskAnalysisInfo {
  /** Description de la zone délimitée par le masque */
  zoneDescription: string;
  /** Type d'élément couvert */
  elementType: "surface" | "object" | "area" | "multiple";
  /** Éléments identifiés dans le masque */
  elementsInMask: string[];
  /** Position dans l'image */
  position: {
    horizontal: "left" | "center" | "right" | "full-width";
    vertical: "top" | "middle" | "bottom" | "full-height";
  };
  /** Pourcentage de couverture */
  coveragePercent: number;
  /** Zone partielle ou totale */
  isPartial: boolean;
  /** Corrections suggérées */
  instructionCorrections: string[];
}

/**
 * Options de génération d'image
 */
export interface GenerationOptions {
  /** Ratio d'aspect de l'image générée */
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  /** Qualité de l'image générée */
  quality?: "standard" | "high" | "ultra";
  /** Style de rendu */
  renderStyle?: "photorealistic" | "artistic" | "technical";
}

/**
 * Résultat de la génération
 */
export interface GenerationResult {
  /** Chemin vers l'image générée */
  imagePath: string;
  /** Description de l'image générée */
  description: string;
  /** Nombre de tentatives effectuées */
  attempts: number;
  /** Détails de l'analyse initiale */
  analysisDetails?: ImageAnalysis;
  /** Durée totale de génération en ms */
  duration?: number;
  /** Chemins vers les masques combinés (pour debug) */
  combinedMaskPaths?: string[];
}

// ============================================================================
// ANALYSE D'IMAGE
// ============================================================================

/**
 * Résultat de l'analyse d'une image par l'agent analyste
 */
export interface ImageAnalysis {
  /** Type d'espace identifié */
  spaceType: string;
  /** Indique si c'est un espace intérieur ou extérieur */
  environment: "interior" | "exterior" | "mixed";
  /** Zones/surfaces identifiées */
  surfaces: SurfaceInfo[];
  /** Objets identifiés */
  objects: ObjectInfo[];
  /** Description de l'éclairage */
  lighting: LightingInfo;
  /** Perspective et cadrage */
  perspective: PerspectiveInfo;
  /** Matériaux existants détectés */
  existingMaterials: MaterialInfo[];
  /** Équipements techniques visibles */
  technicalEquipment?: TechnicalEquipmentInfo[];
  /** Végétation visible */
  vegetation?: VegetationInfo[];
  /** Métiers potentiellement concernés */
  relevantTrades?: string[];
}

/**
 * Information sur une surface identifiée
 */
export interface SurfaceInfo {
  /** ID unique de la surface */
  id: string;
  /** Nom descriptif */
  name: string;
  /** Description détaillée */
  description: string;
  /** Délimitations de la surface */
  boundaries: string;
  /** Matériau actuel */
  currentMaterial: string;
  /** Catégorie d'élément */
  category: ElementCategory;
  /** État de la surface */
  condition?: "excellent" | "good" | "fair" | "poor" | "damaged";
  /** Estimation de la surface visible (%) */
  visiblePercentage?: number;
}

/**
 * Information sur un objet identifié
 */
export interface ObjectInfo {
  /** ID unique de l'objet */
  id: string;
  /** Nom de l'objet */
  name: string;
  /** Catégorie d'élément */
  category: ElementCategory;
  /** Sous-catégorie plus précise */
  subcategory?: string;
  /** Description détaillée */
  description: string;
  /** Position dans l'image */
  position: string;
  /** Style de l'objet */
  style: string;
  /** Matériau principal */
  material: string;
  /** Couleur dominante */
  color: string;
  /** Dimensions estimées */
  estimatedDimensions?: string;
  /** Marque identifiée (si visible) */
  brand?: string;
  /** État de l'objet */
  condition?: "new" | "good" | "used" | "worn" | "damaged";
}

/**
 * Information sur l'éclairage
 */
export interface LightingInfo {
  /** Type d'éclairage principal */
  type: "natural" | "artificial" | "mixed";
  /** Direction de la lumière principale */
  direction: string;
  /** Intensité lumineuse */
  intensity: "low" | "medium" | "high";
  /** Température de couleur estimée */
  temperature: "warm" | "neutral" | "cool";
  /** Présence d'ombres marquées */
  shadows: "soft" | "medium" | "hard";
  /** Heure estimée (pour lumière naturelle) */
  estimatedTimeOfDay?: string;
}

/**
 * Information sur la perspective
 */
export interface PerspectiveInfo {
  /** Type de vue */
  viewType: "frontal" | "angular" | "overhead" | "low_angle" | "eye_level";
  /** Description de la perspective */
  description: string;
  /** Hauteur estimée de la caméra */
  cameraHeight: "floor_level" | "eye_level" | "elevated" | "aerial";
  /** Largeur de champ estimée */
  fieldOfView: "narrow" | "normal" | "wide" | "ultra_wide";
  /** Point de fuite identifiable */
  vanishingPoint?: string;
}

/**
 * Information sur un matériau existant
 */
export interface MaterialInfo {
  /** Zone concernée */
  zone: string;
  /** Type de matériau */
  type: string;
  /** Couleur */
  color: string;
  /** Texture */
  texture: string;
  /** Finition */
  finish?: "matte" | "satin" | "glossy" | "textured";
  /** État */
  condition?: string;
}

/**
 * Information sur un équipement technique
 */
export interface TechnicalEquipmentInfo {
  /** ID unique */
  id: string;
  /** Type d'équipement */
  type: string;
  /** Catégorie */
  category: ElementCategory;
  /** Position */
  position: string;
  /** Marque/Modèle si visible */
  brandModel?: string;
  /** État apparent */
  condition?: string;
}

/**
 * Information sur la végétation
 */
export interface VegetationInfo {
  /** ID unique */
  id: string;
  /** Type de végétation */
  type: string;
  /** Catégorie */
  category: ElementCategory;
  /** Position */
  position: string;
  /** Taille estimée */
  size?: "small" | "medium" | "large";
  /** État de santé */
  health?: "healthy" | "fair" | "poor";
}

// ============================================================================
// ANALYSE DE RÉFÉRENCE
// ============================================================================

/**
 * Résultat de l'analyse d'une image de référence
 */
export interface ReferenceAnalysis {
  /** Type de référence identifié */
  type: ReferenceType;
  /** Catégorie principale */
  category: string;
  /** Sous-catégorie */
  subcategory?: string;
  /** Description détaillée */
  description: string;
  /** Couleur principale */
  mainColor: string;
  /** Couleurs secondaires */
  secondaryColors?: string[];
  /** Style */
  style: string;
  /** Matériau principal */
  material: string;
  /** Matériaux secondaires */
  secondaryMaterials?: string[];
  /** Action recommandée */
  action: ReferenceAction;
  /** Finition */
  finish?: string;
  /** Pattern/Motif identifié */
  pattern?: string;
  /** Dimensions si identifiables */
  dimensions?: string;
  /** Marque si identifiable */
  brand?: string;
  /** Qualité de l'image de référence */
  imageQuality: "excellent" | "good" | "acceptable" | "poor";
  /** Conseils pour une meilleure intégration */
  integrationTips?: string[];
}

// ============================================================================
// PLAN DE MODIFICATION
// ============================================================================

/**
 * Plan de modification généré par l'agent planificateur
 */
export interface ModificationPlan {
  /** Analyse originale de l'image */
  originalAnalysis: ImageAnalysis;
  /** Tâches de modification à effectuer */
  tasks: ModificationTask[];
  /** Prompt global construit */
  globalPrompt: string;
  /** Avertissements ou notes */
  warnings?: string[];
  /** Instructions enrichies avec compréhension du langage naturel */
  enrichedInstructions?: EnrichedInstruction[];
}

/**
 * Instruction enrichie après parsing intelligent
 */
export interface EnrichedInstruction {
  /** Texte original de l'instruction */
  originalText: string;
  /** Action identifiée */
  action: "add" | "replace" | "apply_texture" | "remove" | "modify";
  /** Quantité demandée */
  quantity: number | "all" | "some" | "partial";
  /** Texte de quantité (ex: "3 panneaux solaires") */
  quantityText: string;
  /** Élément cible identifié */
  targetElement: string;
  /** Zone cible identifiée */
  targetZone: string;
  /** Contraintes de zone */
  zoneConstraints: {
    side?: "left" | "right" | "center" | "top" | "bottom";
    area?: "partial" | "full" | "specific";
    description: string;
  };
  /** Style demandé */
  style?: string;
  /** Couleur demandée */
  color?: string;
  /** Notes additionnelles */
  additionalNotes: string[];
}

/**
 * Contraintes de positionnement
 */
export interface PositionConstraints {
  /** Côté ciblé */
  side?: "left" | "right" | "center" | "top" | "bottom";
  /** Type de zone */
  area?: "partial" | "full" | "specific";
  /** Description textuelle */
  description: string;
}

/**
 * Tâche de modification individuelle
 */
export interface ModificationTask {
  /** Priorité de la tâche (ordre d'exécution) */
  priority: number;
  /** Surface cible (pour les modifications de surface) */
  targetSurface?: SurfaceInfo;
  /** Objet cible (pour les remplacements d'objet) */
  targetObject?: ObjectInfo;
  /** Zone cible textuelle (si pas de surface/objet précis) */
  targetZone?: string;
  /** Nouveau matériau/élément à appliquer */
  targetMaterial: string;
  /** Index de l'image de référence */
  referenceIndex: number;
  /** Instructions spécifiques */
  specificInstructions: string;
  /** Type d'action */
  actionType: ReferenceAction;
  /** Analyse de la référence */
  referenceAnalysis?: ReferenceAnalysis;
  /** Catégorie de l'élément modifié */
  elementCategory?: ElementCategory;
  /** Confidence de la correspondance (0-1) */
  matchConfidence?: number;
  /** Quantité d'éléments à ajouter/modifier */
  quantity?: number;
  /** Texte de quantité */
  quantityText?: string;
  /** Contraintes de positionnement */
  positionConstraints?: PositionConstraints;
  /** Instruction enrichie associée */
  enrichedInstruction?: EnrichedInstruction;
  /** Indique si un masque est associé à cette tâche */
  hasMask?: boolean;
  /** Analyse du masque associé */
  maskAnalysis?: MaskAnalysisInfo;
  /** Image du masque combiné en base64 */
  combinedMaskBase64?: string;
}

// ============================================================================
// DONNÉES D'IMAGE
// ============================================================================

/**
 * Données d'image préparées pour l'API
 */
export interface PreparedImage {
  /** Image encodée en base64 */
  base64: string;
  /** Type MIME de l'image */
  mimeType: string;
  /** Taille en octets */
  sizeBytes?: number;
  /** Dimensions originales */
  originalDimensions?: { width: number; height: number };
}

// ============================================================================
// CALLBACKS & EVENTS
// ============================================================================

/**
 * Événement de progression
 */
export interface ProgressEvent {
  /** Type d'événement */
  type: "log" | "step" | "error" | "warning";
  /** Icône associée */
  icon?: string;
  /** Message */
  message?: string;
  /** Étape en cours */
  step?: string;
  /** Statut de l'étape */
  status?: "pending" | "loading" | "done" | "error";
  /** Données additionnelles */
  data?: Record<string, unknown>;
}

/**
 * Callback de progression
 */
export type ProgressCallback = (event: ProgressEvent) => void;

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration du système de génération
 */
export interface GenerationConfig {
  /** Nombre maximum de tentatives */
  maxRetries: number;
  /** Délai initial entre les tentatives (ms) */
  initialDelayMs: number;
  /** Délai maximum entre les tentatives (ms) */
  maxDelayMs: number;
  /** Multiplicateur de backoff */
  backoffMultiplier: number;
  /** Taille maximum d'image en octets */
  maxImageSizeBytes: number;
}

/**
 * Configuration des modèles AI
 */
export interface ModelConfig {
  /** Modèle pour l'analyse */
  analyzer: string;
  /** Modèle pour la génération d'image */
  generator: string;
}

/**
 * Configuration d'image générée
 */
export interface ImageConfig {
  /** Ratio d'aspect */
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  /** Taille de l'image */
  imageSize: "1K" | "2K" | "4K";
}
