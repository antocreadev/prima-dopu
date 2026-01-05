import type { APIRoute } from "astro";
import { stripe } from "../../../lib/stripe";
import { getSubscription } from "../../../lib/subscriptions";

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

    const subscription = getSubscription(userId);

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({
          error: "Pas de compte Stripe associé",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Créer une session du portail de facturation Stripe
    const baseUrl = new URL(request.url).origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/profile`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erreur création portail:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
