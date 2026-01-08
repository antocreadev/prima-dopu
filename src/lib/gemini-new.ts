// ============================================================================
// FICHIER DE RÉTROCOMPATIBILITÉ - gemini.ts
// ============================================================================
// Ce fichier re-exporte tout depuis le nouveau module refactorisé
// pour maintenir la compatibilité avec le code existant
// ============================================================================

// Re-export de tout le module gemini refactorisé
export * from "./gemini/index";

// Export par défaut pour compatibilité
export {
  generateBeforeAfter,
  generateBeforeAfterWithProgress,
  analyzeImage,
  validateReference,
} from "./gemini/index";
