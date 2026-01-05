import type { APIRoute } from "astro";
import {
  stripe,
  getStripeProducts,
  getSubscriptionProducts,
  getCreditProducts,
  formatPrice,
  type StripeProduct,
} from "../../../lib/stripe";
import { getSubscription } from "../../../lib/subscriptions";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth.userId;

    // Récupérer tous les produits
    const allProducts = await getStripeProducts();
    const subscriptionProducts = allProducts.filter(
      (p) => p.type === "subscription_25" || p.type === "subscription_50"
    );
    const creditProducts = allProducts.filter(
      (p) => p.type === "credit_with_sub" || p.type === "credit_no_sub"
    );

    // Récupérer l'abonnement actuel de l'utilisateur
    let currentPlan = null;
    if (userId) {
      const sub = getSubscription(userId);
      if (sub) {
        currentPlan = {
          planType: sub.plan_type,
          status: sub.status,
          creditsBalance: sub.credits_balance,
          cancelAtPeriodEnd: sub.cancel_at_period_end === 1,
          currentPeriodEnd: sub.current_period_end,
        };
      }
    }

    // Formater les produits pour le frontend
    const formatProduct = (product: StripeProduct) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      prices: product.prices.map((price) => ({
        id: price.id,
        amount: price.unitAmount,
        amountFormatted: formatPrice(price.unitAmount, price.currency),
        currency: price.currency,
        recurring: price.recurring,
        interval: price.recurring?.interval || null,
      })),
    });

    return new Response(
      JSON.stringify({
        subscriptions: subscriptionProducts.map(formatProduct),
        credits: creditProducts.map(formatProduct),
        currentPlan,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erreur récupération produits:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
