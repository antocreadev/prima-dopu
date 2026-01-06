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

    let { priceId, quantity = 1 } = await request.json();

    // Valider la quantité (minimum 1)
    quantity = Math.max(1, parseInt(quantity) || 1);

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

    console.log(`🛒 Checkout: priceId=${priceId}, quantity=${quantity}`);
    console.log(
      `🛒 Product: id=${product?.id}, type=${product?.type}, name=${product?.name}`
    );
    console.log(
      `🛒 isSubscription=${isSubscription}, recurring=${JSON.stringify(
        price.recurring
      )}`
    );

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
      // Vérifier si l'utilisateur a déjà un abonnement Stripe actif
      const existingSub = getSubscription(userId);
      if (
        existingSub?.stripe_subscription_id &&
        existingSub.status === "active"
      ) {
        // Annuler l'ancien abonnement Stripe avant d'en créer un nouveau
        // Ou rediriger vers le portail pour changer de plan
        console.log(
          `🔄 Utilisateur ${userId} a déjà un abonnement actif, redirection vers changement de plan`
        );

        // Option: Annuler l'ancien et créer le nouveau
        try {
          await stripe.subscriptions.cancel(
            existingSub.stripe_subscription_id,
            {
              prorate: true, // Rembourser au prorata
            }
          );
          console.log(
            `❌ Ancien abonnement ${existingSub.stripe_subscription_id} annulé`
          );
        } catch (cancelError: any) {
          console.error(`Erreur annulation abonnement:`, cancelError.message);
          // Si erreur, on continue quand même (l'abonnement était peut-être déjà annulé)
        }
      }

      sessionParams.mode = "subscription";
      sessionParams.subscription_data = {
        metadata: { userId },
      };
    } else {
      sessionParams.mode = "payment";
      sessionParams.payment_intent_data = {
        metadata: {
          userId,
          quantity: quantity.toString(),
          productType: product?.type || "unknown",
        },
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
