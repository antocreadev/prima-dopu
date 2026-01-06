import type { PlanType } from "./db";
import { getSubscription, type Subscription } from "./subscriptions";

/**
 * Utilitaire pour déterminer le plan d'un utilisateur
 * basé sur les abonnements Stripe
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
  monthlyLimit: number | null;
  totalLimit: number | null;
  isPaid: boolean;
  isAdmin?: boolean;
}

// Plan admin avec générations illimitées
export const ADMIN_PLAN: UserPlanInfo = {
  planType: "pro",
  planName: "Admin",
  monthlyLimit: null, // Illimité
  totalLimit: null, // Illimité
  isPaid: true,
  isAdmin: true,
};

// Définition des plans
export const PLANS: Record<PlanType, UserPlanInfo> = {
  pro: {
    planType: "pro",
    planName: "Pro (50 projets/mois)",
    monthlyLimit: 50,
    totalLimit: null,
    isPaid: true,
  },
  standard: {
    planType: "standard",
    planName: "Standard (25 projets/mois)",
    monthlyLimit: 25,
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

// Plan gratuit par défaut
export const FREE_PLAN = PLANS.free;

/**
 * Récupère le plan d'un utilisateur depuis son abonnement Stripe
 */
function getStripeSubscriptionPlan(
  subscription: Subscription
): UserPlanInfo | null {
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
      return PLANS.pro;
    case "standard":
      return PLANS.standard;
    default:
      return null;
  }
}

/**
 * Détermine le plan d'un utilisateur en vérifiant:
 * 1. Si admin (illimité)
 * 2. Abonnement Stripe actif
 * 3. Plan gratuit par défaut
 */
export function getUserPlan(userId?: string | null): UserPlanInfo {
  // 1. Vérifier si l'utilisateur est admin
  if (userId && isAdminUser(userId)) {
    return ADMIN_PLAN;
  }

  // 2. Vérifier l'abonnement Stripe
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

  // 3. Par défaut, plan gratuit
  return FREE_PLAN;
}

/**
 * Obtenir les infos du plan par son type
 */
export function getPlanInfo(planType: PlanType): UserPlanInfo {
  return PLANS[planType] || FREE_PLAN;
}
