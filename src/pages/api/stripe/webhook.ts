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
  console.log("🔔 Webhook endpoint appelé");

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  console.log(`🔔 Signature présente: ${!!sig}`);
  console.log(`🔔 WEBHOOK_SECRET configuré: ${!!WEBHOOK_SECRET}`);

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

        // Debug: log toutes les metadata
        console.log("🔍 Session metadata:", JSON.stringify(session.metadata));
        console.log("🔍 Session customer:", session.customer);
        console.log("🔍 Session mode:", session.mode);
        console.log("🔍 Session subscription:", session.subscription);

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
          // Abonnement créé - La création effective est gérée par invoice.payment_succeeded
          // Ici on log juste pour debug car l'abonnement sera créé/mis à jour par l'invoice
          console.log(
            `📝 Checkout subscription complété pour ${userId}, subscription: ${session.subscription}`
          );
          console.log(
            `📝 L'abonnement sera créé/mis à jour via invoice.payment_succeeded`
          );
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
          // Dans l'API Stripe 2025-12-15.clover, current_period_end est sur les items
          const item = subscription.items.data[0];
          const periodEnd = (item as any)?.current_period_end;
          const periodStart = (item as any)?.current_period_start;
          const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end;
          const status = (subscription as any).status;

          // Détecter le changement de plan depuis le produit
          const productId = item?.price?.product as string;
          let planType = sub.plan_type;

          if (productId) {
            try {
              const product = await stripe.products.retrieve(productId);
              const productType = product.metadata?.type as
                | ProductType
                | undefined;
              if (productType) {
                planType = getPlanFromProductType(productType);
              }
            } catch (e) {
              console.error(`Erreur récupération produit: ${e}`);
            }
          }

          console.log(
            `🔍 Subscription update: planType=${planType}, periodEnd=${periodEnd}, cancel=${cancelAtPeriodEnd}, status=${status}`
          );

          // Mettre à jour l'abonnement avec le nouveau plan
          upsertSubscription(sub.user_id, {
            plan_type: planType,
            status: status as any,
            cancel_at_period_end: cancelAtPeriodEnd ? 1 : 0,
            ...(periodEnd && {
              current_period_end: new Date(periodEnd * 1000).toISOString(),
            }),
            ...(periodStart && {
              current_period_start: new Date(periodStart * 1000).toISOString(),
            }),
          });

          console.log(
            `🔄 Abonnement mis à jour pour ${sub.user_id} (plan: ${planType})`
          );
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
      // PAIEMENT RÉUSSI (création ou renouvellement)
      // ==========================================
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`🔍 Invoice billing_reason: ${invoice.billing_reason}`);

        // Récupérer le userId depuis les metadata de la subscription
        const subscriptionDetails = (invoice as any).parent
          ?.subscription_details;
        const userId = subscriptionDetails?.metadata?.userId;
        const subscriptionId = subscriptionDetails?.subscription;

        console.log(
          `🔍 Invoice userId: ${userId}, subscriptionId: ${subscriptionId}`
        );

        // Création initiale d'un abonnement
        if (
          invoice.billing_reason === "subscription_create" &&
          userId &&
          subscriptionId
        ) {
          try {
            // Récupérer les détails de la subscription
            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId
            );

            console.log(
              `🔍 Subscription retrieved:`,
              JSON.stringify(subscription, null, 2).substring(0, 500)
            );

            // Déterminer le type de plan depuis le produit
            const productId = subscription.items.data[0]?.price
              .product as string;
            const product = await stripe.products.retrieve(productId);
            const productType = product.metadata?.type as
              | ProductType
              | undefined;
            const planType = productType
              ? getPlanFromProductType(productType)
              : "standard";

            console.log(
              `🔍 Product type: ${productType}, planType: ${planType}`
            );

            // Dans l'API Stripe 2025-12-15.clover, current_period est sur les items
            const item = subscription.items.data[0];
            const periodStart = (item as any)?.current_period_start;
            const periodEnd = (item as any)?.current_period_end;
            const cancelAtPeriodEnd = (subscription as any)
              .cancel_at_period_end;

            console.log(
              `🔍 Period: ${periodStart} -> ${periodEnd}, cancel: ${cancelAtPeriodEnd}`
            );

            upsertSubscription(userId, {
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_type: planType,
              status: "active",
              current_period_start: periodStart
                ? new Date(periodStart * 1000).toISOString()
                : null,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              cancel_at_period_end: cancelAtPeriodEnd ? 1 : 0,
            });

            console.log(
              `✅ Abonnement ${planType} créé via invoice pour ${userId}`
            );
          } catch (subError: any) {
            console.error(
              `❌ Erreur lors de la création de l'abonnement:`,
              subError.message
            );
            throw subError;
          }
        }
        // Renouvellement d'abonnement
        else if (invoice.billing_reason === "subscription_cycle") {
          const sub = getSubscriptionByCustomerId(customerId);
          if (sub) {
            upsertSubscription(sub.user_id, {
              status: "active",
            });
            console.log(`✅ Renouvellement réussi pour ${sub.user_id}`);
          }
        }
        break;
      }

      // ==========================================
      // PAYMENT INTENT RÉUSSI (achat de crédits one-time)
      // Note: Les crédits sont déjà ajoutés via checkout.session.completed
      // Ce handler est gardé pour debug uniquement
      // ==========================================
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.userId;
        const quantity = parseInt(paymentIntent.metadata?.quantity || "1", 10);
        const productType = paymentIntent.metadata?.productType;

        console.log(
          `🔍 PaymentIntent reçu (ignoré - déjà traité par checkout.session.completed):`,
          JSON.stringify(paymentIntent.metadata)
        );

        // NE PAS ajouter de crédits ici - c'est fait dans checkout.session.completed
        // Cet événement arrive APRÈS checkout.session.completed et causerait un doublon
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
