import type { PlanType } from "./db";
import { getSubscription, type Subscription } from "./subscriptions";

/**
 * Utilitaire pour déterminer le plan d'un utilisateur
 * basé sur les abonnements Stripe OU les features/plans Clerk Billing
 */

// IDs des utilisateurs admin (générations illimitées)
// Définir dans .env: ADMIN_USER_IDS=user_xxx,user_yyy
const ADMIN_USER_IDS_RAW =
  typeof process !== "undefined" && process.env?.ADMIN_USER_IDS
    ? process.env.ADMIN_USER_IDS
    : typeof import.meta !== "undefined" && import.meta.env?.ADMIN_USER_IDS
    ? import.meta.env.ADMIN_USER_IDS
    : "";

const ADMIN_USER_IDS = ADMIN_USER_IDS_RAW.split(",")
  .map((id: string) => id.trim())
  .filter(Boolean);

export function isAdminUser(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

export interface UserPlanInfo {
  planType: PlanType;
  planName: string;
  planKey: string; // Clé Clerk
  monthlyLimit: number | null;
  totalLimit: number | null;
  isPaid: boolean;
  isAdmin?: boolean;
}

// Plan admin avec générations illimitées
export const ADMIN_PLAN: UserPlanInfo = {
  planType: "pro",
  planName: "Admin",
  planKey: "admin",
  monthlyLimit: null, // Illimité
  totalLimit: null, // Illimité
  isPaid: true,
  isAdmin: true,
};

// Mapping des plans Clerk vers notre système
// Clés Clerk: free_user, abonnement_50, abonnement_100
export const CLERK_PLAN_MAPPING: Record<string, UserPlanInfo> = {
  abonnement_100: {
    planType: "pro",
    planName: "Pro",
    planKey: "abonnement_100",
    monthlyLimit: 50,
    totalLimit: null,
    isPaid: true,
  },
  abonnement_50: {
    planType: "standard",
    planName: "Standard",
    planKey: "abonnement_50",
    monthlyLimit: 20,
    totalLimit: null,
    isPaid: true,
  },
  free_user: {
    planType: "free",
    planName: "Gratuit",
    planKey: "free_user",
    monthlyLimit: null,
    totalLimit: 3,
    isPaid: false,
  },
};

// Alias pour compatibilité
export const PLAN_BY_TYPE: Record<PlanType, UserPlanInfo> = {
  pro: CLERK_PLAN_MAPPING.abonnement_100,
  standard: CLERK_PLAN_MAPPING.abonnement_50,
  free: CLERK_PLAN_MAPPING.free_user,
};

/**
 * Type pour la fonction has() de Clerk
 */
type HasFunction = (params: Record<string, unknown>) => boolean;

/**
 * Mapping du plan_type Stripe vers notre système
 */
function getStripeSubscriptionPlan(subscription: Subscription): UserPlanInfo | null {
  // Vérifier si l'abonnement est actif
  if (subscription.status !== "active") {
    return null;
  }

  // Vérifier si dans la période de validité
  if (subscription.current_period_end) {
    const endDate = new Date(subscription.current_period_end);
    if (endDate < new Date()) {
      return null; // Période expirée
    }
  }

  // Mapper le plan_type vers notre système
  switch (subscription.plan_type) {
    case "pro":
      return {
        planType: "pro",
        planName: "Pro (50 projets/mois)",
        planKey: "stripe_pro",
        monthlyLimit: 50,
        totalLimit: null,
        isPaid: true,
      };
    case "standard":
      return {
        planType: "standard",
        planName: "Standard (25 projets/mois)",
        planKey: "stripe_standard",
        monthlyLimit: 25,
        totalLimit: null,
        isPaid: true,
      };
    default:
      return null;
  }
}

/**
 * Détermine le plan d'un utilisateur en vérifiant:
 * 1. Si admin (illimité)
 * 2. Abonnement Stripe actif (prioritaire)
 * 3. Plan Clerk (fallback/legacy)
 */
export function getUserPlanFromAuth(
  has: HasFunction | undefined,
  userId?: string | null
): UserPlanInfo {
  // 1. Vérifier si l'utilisateur est admin
  if (userId && isAdminUser(userId)) {
    return ADMIN_PLAN;
  }

  // 2. Vérifier l'abonnement Stripe (prioritaire)
  if (userId) {
    try {
      const stripeSubscription = getSubscription(userId);
      if (stripeSubscription) {
        const stripePlan = getStripeSubscriptionPlan(stripeSubscription);
        if (stripePlan) {
          return stripePlan;
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification abonnement Stripe:", error);
    }
  }

  // 3. Fallback vers Clerk (legacy)
  if (!has) {
    return CLERK_PLAN_MAPPING.free_user;
  }

  // Vérifier dans l'ordre de priorité (du plus élevé au plus bas)
  try {
    if (has({ plan: "abonnement_100" })) {
      return CLERK_PLAN_MAPPING.abonnement_100;
    }

    if (has({ plan: "abonnement_50" })) {
      return CLERK_PLAN_MAPPING.abonnement_50;
    }
  } catch {
    // Si has() échoue (Billing pas encore configuré), retourner le plan gratuit
  }

  // Par défaut, plan gratuit
  return CLERK_PLAN_MAPPING.free_user;
}

/**
 * Obtenir les infos du plan par son type
 */
export function getPlanInfo(planType: PlanType): UserPlanInfo {
  return PLAN_BY_TYPE[planType] || CLERK_PLAN_MAPPING.free_user;
}
