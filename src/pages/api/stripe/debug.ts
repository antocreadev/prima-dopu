import type { APIRoute } from "astro";
import { getSubscription } from "../../../lib/subscriptions";
import db from "../../../lib/db";

export const GET: APIRoute = async ({ locals }) => {
  const auth = locals.auth();
  const userId = auth.userId;

  // Récupérer tous les abonnements pour debug
  const allSubscriptions = db
    .prepare("SELECT * FROM subscriptions LIMIT 20")
    .all();

  // Récupérer tous les achats de crédits
  const allCreditPurchases = db
    .prepare("SELECT * FROM credit_purchases LIMIT 20")
    .all();

  // L'abonnement de l'utilisateur connecté (si connecté)
  const userSubscription = userId ? getSubscription(userId) : null;

  return new Response(
    JSON.stringify(
      {
        currentUserId: userId || "non connecté",
        userSubscription,
        allSubscriptions,
        allCreditPurchases,
      },
      null,
      2
    ),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
