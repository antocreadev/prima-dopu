import type { APIRoute } from "astro";
import { isAdminUser } from "../../../lib/plans";
import {
  upsertSubscription,
  getSubscription,
} from "../../../lib/subscriptions";
import { getUserCredits, updateUserCredits } from "../../../lib/db";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Vérifier l'authentification admin
    const auth = locals.auth();
    const adminId = auth.userId;

    if (!adminId || !isAdminUser(adminId)) {
      return new Response(
        JSON.stringify({ success: false, error: "Accès non autorisé" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await request.json();
    const {
      userId,
      planType,
      creditsBalance, // Crédits bonus (supplémentaires)
      monthlyGenerations, // Générations ce mois (pour abonnés)
      totalGenerations, // Générations totales (compteur global / gratuits)
    } = data;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Valider le plan
    const validPlans = ["free", "standard", "pro"];
    if (planType && !validPlans.includes(planType)) {
      return new Response(
        JSON.stringify({ success: false, error: "Plan invalide" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // 1. Mettre à jour l'abonnement (plan + crédits bonus)
    // ==========================================
    const subscriptionUpdate: Record<string, any> = {};

    if (planType) {
      subscriptionUpdate.plan_type = planType;
    }

    if (typeof creditsBalance === "number" && creditsBalance >= 0) {
      subscriptionUpdate.credits_balance = creditsBalance;
    }

    const subscription = upsertSubscription(userId, subscriptionUpdate);

    // ==========================================
    // 2. Mettre à jour les compteurs de crédits (user_credits)
    // ==========================================
    const creditsUpdate: {
      monthly_generations?: number;
      total_generations?: number;
    } = {};

    if (typeof monthlyGenerations === "number" && monthlyGenerations >= 0) {
      creditsUpdate.monthly_generations = monthlyGenerations;
    }

    if (typeof totalGenerations === "number" && totalGenerations >= 0) {
      creditsUpdate.total_generations = totalGenerations;
    }

    let userCredits = getUserCredits(userId);
    if (Object.keys(creditsUpdate).length > 0) {
      userCredits = updateUserCredits(userId, creditsUpdate);
    }

    console.log(`[ADMIN] ${adminId} a modifié ${userId}:`, {
      plan: planType,
      bonusCredits: creditsBalance,
      monthlyGen: monthlyGenerations,
      totalGen: totalGenerations,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          userId: subscription.user_id,
          planType: subscription.plan_type,
          creditsBalance: subscription.credits_balance,
          monthlyGenerations: userCredits.monthly_generations,
          totalGenerations: userCredits.total_generations,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ADMIN] Erreur update-user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erreur serveur",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
