// ============================================================================
// CONFIGURATION DU SYSTÈME DE GÉNÉRATION
// ============================================================================

import type { GenerationConfig, ModelConfig, ImageConfig } from "./types";

/**
 * Modèles AI utilisés
 */
export const MODELS: ModelConfig = {
  analyzer: "gemini-2.5-flash",
  generator: "gemini-3-pro-image-preview",
};

/**
 * Configuration d'image par défaut
 */
export const IMAGE_CONFIG: ImageConfig = {
  aspectRatio: "4:3",
  imageSize: "2K",
};

/**
 * Configuration des retries et limites
 */
export const GENERATION_CONFIG: GenerationConfig = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 15000,
  backoffMultiplier: 2,
  maxImageSizeBytes: 4 * 1024 * 1024,
};

/**
 * Formats Apple nécessitant une conversion
 */
export const APPLE_FORMATS = ["heic", "heif", "hif"];

/**
 * Types MIME supportés
 */
export const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};
