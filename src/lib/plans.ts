import type { PlanType } from "./db";

/**
 * Utilitaire pour déterminer le plan d'un utilisateur
 * basé sur les features/plans Clerk Billing
 */

export interface UserPlanInfo {
  planType: PlanType;
  planName: string;
  monthlyLimit: number | null;
  totalLimit: number | null;
  isPaid: boolean;
}

// Mapping des plans Clerk vers notre système
export const CLERK_PLAN_MAPPING: Record<string, UserPlanInfo> = {
  pro: {
    planType: "pro",
    planName: "Pro",
    monthlyLimit: 50,
    totalLimit: null,
    isPaid: true,
  },
  standard: {
    planType: "standard",
    planName: "Standard",
    monthlyLimit: 20,
    totalLimit: null,
    isPaid: true,
  },
  free: {
    planType: "free",
    planName: "Gratuit",
    monthlyLimit: null,
    totalLimit: 3,
    isPaid: false,
  },
};

/**
 * Type pour la fonction has() de Clerk
 */
type HasFunction = (params: Record<string, unknown>) => boolean;

/**
 * Détermine le plan d'un utilisateur en utilisant la fonction has() de Clerk
 * Cette fonction doit être appelée côté serveur avec l'objet auth
 */
export function getUserPlanFromAuth(
  has: HasFunction | undefined
): UserPlanInfo {
  if (!has) {
    return CLERK_PLAN_MAPPING.free;
  }

  // Vérifier dans l'ordre de priorité (du plus élevé au plus bas)
  try {
    if (has({ plan: "pro" })) {
      return CLERK_PLAN_MAPPING.pro;
    }

    if (has({ plan: "standard" })) {
      return CLERK_PLAN_MAPPING.standard;
    }
  } catch {
    // Si has() échoue (Billing pas encore configuré), retourner le plan gratuit
  }

  // Par défaut, plan gratuit
  return CLERK_PLAN_MAPPING.free;
}

/**
 * Obtenir les infos du plan par son type
 */
export function getPlanInfo(planType: PlanType): UserPlanInfo {
  return CLERK_PLAN_MAPPING[planType] || CLERK_PLAN_MAPPING.free;
}
