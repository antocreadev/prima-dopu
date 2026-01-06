import type { APIRoute } from "astro";
import { isAdminUser } from "../../../lib/plans";
import { upsertSubscription, getSubscription } from "../../../lib/subscriptions";
import db from "../../../lib/db";

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
    const { userId, planType, creditsBalance } = data;

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

    // Valider les crédits
    const credits = parseInt(creditsBalance);
    if (isNaN(credits) || credits < 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Crédits invalides" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mettre à jour l'abonnement
    const updateData: Record<string, any> = {};
    
    if (planType) {
      updateData.plan_type = planType;
    }
    
    if (typeof credits === "number") {
      updateData.credits_balance = credits;
    }

    const subscription = upsertSubscription(userId, updateData);

    console.log(`[ADMIN] ${adminId} a modifié ${userId}: plan=${planType}, credits=${credits}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: {
          userId: subscription.user_id,
          planType: subscription.plan_type,
          creditsBalance: subscription.credits_balance
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ADMIN] Erreur update-user:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erreur serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
