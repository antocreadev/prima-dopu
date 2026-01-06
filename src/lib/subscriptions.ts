import db from "./db";
import { stripe, type ProductType } from "./stripe";
import type { PlanType } from "./db";

// ==========================================
// TABLE DES ABONNEMENTS STRIPE
// ==========================================

// Créer la table des abonnements
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT DEFAULT 'free',
    credits_balance INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
`);

// Table des achats de crédits
db.exec(`
  CREATE TABLE IF NOT EXISTS credit_purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_checkout_session_id TEXT,
    credits_amount INTEGER NOT NULL,
    price_paid INTEGER NOT NULL,
    currency TEXT DEFAULT 'eur',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON credit_purchases(user_id);
`);

// ==========================================
// TYPES
// ==========================================

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_type: PlanType;
  credits_balance: number; // Crédits achetés en plus
  status: "active" | "canceled" | "past_due" | "incomplete";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  created_at: string;
  updated_at: string;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  credits_amount: number;
  price_paid: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

// ==========================================
// FONCTIONS SUBSCRIPTION
// ==========================================

/**
 * Récupère l'abonnement d'un utilisateur
 */
export function getSubscription(userId: string): Subscription | null {
  return db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ?")
    .get(userId) as Subscription | null;
}

/**
 * Récupère un abonnement par son ID Stripe
 */
export function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Subscription | null {
  return db
    .prepare("SELECT * FROM subscriptions WHERE stripe_subscription_id = ?")
    .get(stripeSubscriptionId) as Subscription | null;
}

/**
 * Récupère un abonnement par le customer ID Stripe
 */
export function getSubscriptionByCustomerId(
  stripeCustomerId: string
): Subscription | null {
  return db
    .prepare("SELECT * FROM subscriptions WHERE stripe_customer_id = ?")
    .get(stripeCustomerId) as Subscription | null;
}

/**
 * Crée ou met à jour l'abonnement d'un utilisateur
 */
export function upsertSubscription(
  userId: string,
  data: Partial<Omit<Subscription, "id" | "user_id" | "created_at">>
): Subscription {
  const existing = getSubscription(userId);

  if (existing) {
    // Mise à jour
    const fields = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(data);

    db.prepare(
      `
      UPDATE subscriptions 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `
    ).run(...values, userId);
  } else {
    // Création
    const id = crypto.randomUUID();
    db.prepare(
      `
      INSERT INTO subscriptions (id, user_id, plan_type, credits_balance, status)
      VALUES (?, ?, 'free', 0, 'active')
    `
    ).run(id, userId);

    // Appliquer les données supplémentaires
    if (Object.keys(data).length > 0) {
      const fields = Object.keys(data)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = Object.values(data);

      db.prepare(
        `
        UPDATE subscriptions 
        SET ${fields}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `
      ).run(...values, userId);
    }
  }

  return getSubscription(userId)!;
}

/**
 * Annule un abonnement (le passe en free)
 */
export function cancelSubscription(stripeSubscriptionId: string): void {
  db.prepare(
    `
    UPDATE subscriptions 
    SET plan_type = 'free', 
        status = 'canceled',
        stripe_subscription_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = ?
  `
  ).run(stripeSubscriptionId);
}

// ==========================================
// FONCTIONS STRIPE CUSTOMER
// ==========================================

/**
 * Crée ou récupère un customer Stripe pour un utilisateur
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email?: string,
  name?: string
): Promise<string> {
  const sub = getSubscription(userId);

  if (sub?.stripe_customer_id) {
    return sub.stripe_customer_id;
  }

  // Créer un nouveau customer Stripe
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  // Sauvegarder dans la DB
  upsertSubscription(userId, {
    stripe_customer_id: customer.id,
  });

  return customer.id;
}

// ==========================================
// FONCTIONS CRÉDITS
// ==========================================

/**
 * Ajoute des crédits au solde d'un utilisateur
 */
export function addCredits(userId: string, amount: number): number {
  const sub = getSubscription(userId);
  const newBalance = (sub?.credits_balance || 0) + amount;

  upsertSubscription(userId, {
    credits_balance: newBalance,
  });

  return newBalance;
}

/**
 * Utilise un crédit du solde (pour les achats unitaires)
 * Retourne true si un crédit a été utilisé
 */
export function useCredit(userId: string): boolean {
  const sub = getSubscription(userId);

  if (!sub || sub.credits_balance <= 0) {
    return false;
  }

  db.prepare(
    `
    UPDATE subscriptions 
    SET credits_balance = credits_balance - 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND credits_balance > 0
  `
  ).run(userId);

  return true;
}

/**
 * Récupère le solde de crédits d'un utilisateur
 */
export function getCreditsBalance(userId: string): number {
  const sub = getSubscription(userId);
  return sub?.credits_balance || 0;
}

/**
 * Enregistre un achat de crédits
 */
export function createCreditPurchase(
  userId: string,
  data: {
    stripe_checkout_session_id?: string;
    stripe_payment_intent_id?: string;
    credits_amount: number;
    price_paid: number;
    currency?: string;
    status?: "pending" | "completed" | "failed";
  }
): CreditPurchase {
  const id = crypto.randomUUID();

  db.prepare(
    `
    INSERT INTO credit_purchases (
      id, user_id, stripe_checkout_session_id, stripe_payment_intent_id,
      credits_amount, price_paid, currency, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    userId,
    data.stripe_checkout_session_id || null,
    data.stripe_payment_intent_id || null,
    data.credits_amount,
    data.price_paid,
    data.currency || "eur",
    data.status || "pending"
  );

  return db
    .prepare("SELECT * FROM credit_purchases WHERE id = ?")
    .get(id) as CreditPurchase;
}

/**
 * Met à jour le statut d'un achat de crédits
 */
export function updateCreditPurchaseStatus(
  checkoutSessionId: string,
  status: "completed" | "failed"
): void {
  db.prepare(
    `
    UPDATE credit_purchases 
    SET status = ?
    WHERE stripe_checkout_session_id = ?
  `
  ).run(status, checkoutSessionId);
}

// ==========================================
// FONCTIONS PLAN
// ==========================================

// Mapping du type de produit Stripe vers notre PlanType
const PRODUCT_TYPE_TO_PLAN: Record<ProductType, PlanType> = {
  subscription_25: "standard",
  subscription_50: "pro",
  credit_with_sub: "free", // Les crédits n'affectent pas le plan
  credit_no_sub: "free",
};

/**
 * Détermine le PlanType depuis un type de produit Stripe
 */
export function getPlanFromProductType(productType: ProductType): PlanType {
  return PRODUCT_TYPE_TO_PLAN[productType] || "free";
}
