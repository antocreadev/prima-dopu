import type { APIRoute } from "astro";
import { isAdminUser } from "../../../lib/plans";
import db from "../../../lib/db";
import { stripe } from "../../../lib/stripe";
import { getSubscription } from "../../../lib/subscriptions";
import { createClerkClient } from "@clerk/astro/server";

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
    const { userId, confirmDelete } = data;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier la confirmation
    if (confirmDelete !== true) {
      return new Response(
        JSON.stringify({ success: false, error: "Confirmation requise" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Empêcher la suppression d'un admin
    if (isAdminUser(userId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Impossible de supprimer un administrateur",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[ADMIN] ${adminId} supprime l'utilisateur ${userId}`);

    // Statistiques avant suppression
    const stats = {
      generations: 0,
      instructions: 0,
      references: 0,
      folders: 0,
      credits: false,
      subscription: false,
      purchases: 0,
      stripeSubscriptionCanceled: false,
      stripeCustomerDeleted: false,
      clerkUserDeleted: false,
    };

    // ==========================================
    // 1. SUPPRESSION STRIPE (abonnement + client)
    // ==========================================
    const subscription = getSubscription(userId);

    // Annuler l'abonnement Stripe si existant
    if (subscription?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        stats.stripeSubscriptionCanceled = true;
        console.log(
          `[ADMIN] Abonnement Stripe ${subscription.stripe_subscription_id} annulé`
        );
      } catch (stripeError: any) {
        // Ignorer si l'abonnement n'existe plus
        if (stripeError.code !== "resource_missing") {
          console.warn(
            `[ADMIN] Erreur annulation abonnement Stripe:`,
            stripeError.message
          );
        }
      }
    }

    // Supprimer le client Stripe si existant
    if (subscription?.stripe_customer_id) {
      try {
        await stripe.customers.del(subscription.stripe_customer_id);
        stats.stripeCustomerDeleted = true;
        console.log(
          `[ADMIN] Client Stripe ${subscription.stripe_customer_id} supprimé`
        );
      } catch (stripeError: any) {
        // Ignorer si le client n'existe plus
        if (stripeError.code !== "resource_missing") {
          console.warn(
            `[ADMIN] Erreur suppression client Stripe:`,
            stripeError.message
          );
        }
      }
    }

    // ==========================================
    // 2. SUPPRESSION CLERK
    // ==========================================
    try {
      const clerkClient = createClerkClient({
        secretKey: import.meta.env.CLERK_SECRET_KEY,
      });
      await clerkClient.users.deleteUser(userId);
      stats.clerkUserDeleted = true;
      console.log(`[ADMIN] Utilisateur Clerk ${userId} supprimé`);
    } catch (clerkError: any) {
      // Ignorer si l'utilisateur n'existe plus dans Clerk
      if (clerkError.status !== 404) {
        console.warn(
          `[ADMIN] Erreur suppression utilisateur Clerk:`,
          clerkError.message
        );
      }
    }

    // ==========================================
    // 3. SUPPRESSION BASE DE DONNÉES (CASCADE)
    // ==========================================

    // 3a. Supprimer les instructions des générations de cet utilisateur
    const generations = db
      .prepare("SELECT id FROM generations WHERE user_id = ?")
      .all(userId) as Array<{ id: string }>;

    for (const gen of generations) {
      const result = db
        .prepare("DELETE FROM instructions WHERE generation_id = ?")
        .run(gen.id);
      stats.instructions += result.changes;
    }

    // 3b. Supprimer les générations
    const genResult = db
      .prepare("DELETE FROM generations WHERE user_id = ?")
      .run(userId);
    stats.generations = genResult.changes;

    // 3d. Supprimer les références (material_refs)
    const refResult = db
      .prepare("DELETE FROM material_refs WHERE user_id = ?")
      .run(userId);
    stats.references = refResult.changes;

    // 3e. Supprimer les dossiers
    const folderResult = db
      .prepare("DELETE FROM folders WHERE user_id = ?")
      .run(userId);
    stats.folders = folderResult.changes;

    // 3f. Supprimer les crédits utilisateur
    const creditsResult = db
      .prepare("DELETE FROM user_credits WHERE user_id = ?")
      .run(userId);
    stats.credits = creditsResult.changes > 0;

    // 3g. Supprimer les achats de crédits
    const purchasesResult = db
      .prepare("DELETE FROM credit_purchases WHERE user_id = ?")
      .run(userId);
    stats.purchases = purchasesResult.changes;

    // 3h. Supprimer l'abonnement (dans la DB)
    const subResult = db
      .prepare("DELETE FROM subscriptions WHERE user_id = ?")
      .run(userId);
    stats.subscription = subResult.changes > 0;

    console.log(`[ADMIN] Utilisateur ${userId} supprimé:`, stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Utilisateur supprimé avec succès",
        stats,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ADMIN] Erreur delete-user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erreur serveur",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
