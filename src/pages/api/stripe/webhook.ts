import type { APIRoute } from "astro";
import { stripe, type ProductType } from "../../../lib/stripe";
import {
  upsertSubscription,
  cancelSubscription,
  getSubscriptionByStripeId,
  getSubscriptionByCustomerId,
  addCredits,
  createCreditPurchase,
  updateCreditPurchaseStatus,
  getPlanFromProductType,
} from "../../../lib/subscriptions";
import type Stripe from "stripe";

// Récupérer le webhook secret depuis les variables d'environnement
const WEBHOOK_SECRET =
  import.meta.env.STRIPE_WEBHOOK_SECRET ||
  process.env.STRIPE_WEBHOOK_SECRET ||
  "";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("Webhook: Signature manquante");
    return new Response("Signature manquante", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Vérifier la signature si le secret est configuré
    if (WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
    } else {
      // En dev sans signature (pas recommandé en prod)
      console.warn("⚠️ Webhook secret non configuré - signature non vérifiée");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`📩 Webhook Stripe: ${event.type}`);

  try {
    switch (event.type) {
      // ==========================================
      // CHECKOUT COMPLÉTÉ
      // ==========================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const productType = session.metadata?.productType as
          | ProductType
          | undefined;
        const quantity = parseInt(session.metadata?.quantity || "1", 10);

        if (!userId) {
          console.error("Webhook: userId manquant dans metadata");
          break;
        }

        console.log(
          `✅ Checkout complété pour user ${userId}, type: ${productType}`
        );

        if (session.mode === "subscription") {
          // Abonnement créé
          const subscriptionId = session.subscription as string;
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const planType = productType
            ? getPlanFromProductType(productType)
            : "standard";

          const subData = subscription as unknown as {
            current_period_start: number;
            current_period_end: number;
            cancel_at_period_end: boolean;
          };

          upsertSubscription(userId, {
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            plan_type: planType,
            status: "active",
            current_period_start: new Date(
              subData.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subData.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subData.cancel_at_period_end ? 1 : 0,
          });

          console.log(`📝 Abonnement ${planType} créé pour ${userId}`);
        } else if (session.mode === "payment") {
          // Achat de crédits
          const creditsToAdd = quantity;

          // Enregistrer l'achat
          createCreditPurchase(userId, {
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            credits_amount: creditsToAdd,
            price_paid: session.amount_total || 0,
            currency: session.currency || "eur",
            status: "completed",
          });

          // Ajouter les crédits
          const newBalance = addCredits(userId, creditsToAdd);

          console.log(
            `💰 ${creditsToAdd} crédits ajoutés pour ${userId} (nouveau solde: ${newBalance})`
          );
        }
        break;
      }

      // ==========================================
      // ABONNEMENT MIS À JOUR
      // ==========================================
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = getSubscriptionByStripeId(subscription.id);

        if (sub) {
          // Récupérer le type de produit depuis les métadonnées ou le prix
          const priceId = subscription.items.data[0]?.price.id;
          let planType = sub.plan_type;

          const subData = subscription as unknown as {
            current_period_end: number;
            cancel_at_period_end: boolean;
            status: string;
          };

          // Mettre à jour l'abonnement
          upsertSubscription(sub.user_id, {
            status: subData.status as any,
            cancel_at_period_end: subData.cancel_at_period_end ? 1 : 0,
            current_period_end: new Date(
              subData.current_period_end * 1000
            ).toISOString(),
          });

          console.log(`🔄 Abonnement mis à jour pour ${sub.user_id}`);
        }
        break;
      }

      // ==========================================
      // ABONNEMENT ANNULÉ
      // ==========================================
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        cancelSubscription(subscription.id);
        console.log(`❌ Abonnement ${subscription.id} annulé`);
        break;
      }

      // ==========================================
      // PAIEMENT ÉCHOUÉ
      // ==========================================
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const sub = getSubscriptionByCustomerId(customerId);

        if (sub) {
          upsertSubscription(sub.user_id, {
            status: "past_due",
          });
          console.log(`⚠️ Paiement échoué pour ${sub.user_id}`);
        }
        break;
      }

      // ==========================================
      // PAIEMENT RÉUSSI (renouvellement)
      // ==========================================
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const sub = getSubscriptionByCustomerId(customerId);

        if (sub && invoice.billing_reason === "subscription_cycle") {
          upsertSubscription(sub.user_id, {
            status: "active",
          });
          console.log(`✅ Renouvellement réussi pour ${sub.user_id}`);
        }
        break;
      }

      default:
        console.log(`Webhook non géré: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erreur webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
