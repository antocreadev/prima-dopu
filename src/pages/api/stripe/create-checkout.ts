import type { APIRoute } from "astro";
import { stripe, getPriceById, getProductById } from "../../../lib/stripe";
import {
  getOrCreateStripeCustomer,
  getSubscription,
} from "../../../lib/subscriptions";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth.userId;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { priceId, quantity = 1 } = await request.json();

    if (!priceId) {
      return new Response(JSON.stringify({ error: "priceId requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier que le prix existe
    const price = await getPriceById(priceId);
    if (!price) {
      return new Response(JSON.stringify({ error: "Prix invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Récupérer les infos utilisateur depuis Clerk
    const user = await locals.currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const name = user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : undefined;

    // Créer ou récupérer le customer Stripe
    const customerId = await getOrCreateStripeCustomer(userId, email, name);

    // Récupérer le produit pour savoir le type
    const product = await getProductById(price.productId);
    const isSubscription = price.recurring !== null;

    // Construire l'URL de base
    const baseUrl = new URL(request.url).origin;

    // Créer la session Checkout
    const sessionParams: any = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: isSubscription ? 1 : quantity,
        },
      ],
      success_url: `${baseUrl}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=canceled`,
      metadata: {
        userId,
        productType: product?.type || "unknown",
        quantity: quantity.toString(),
      },
      locale: "fr",
      allow_promotion_codes: true,
    };

    // Mode différent selon abonnement ou achat unique
    if (isSubscription) {
      sessionParams.mode = "subscription";
      sessionParams.subscription_data = {
        metadata: { userId },
      };
    } else {
      sessionParams.mode = "payment";
      sessionParams.payment_intent_data = {
        metadata: { userId, quantity: quantity.toString() },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erreur création checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
