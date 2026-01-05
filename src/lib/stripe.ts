import Stripe from "stripe";

// Configuration Stripe
const STRIPE_SECRET_KEY =
  import.meta.env.STRIPE_API_KEY_PRIVATE ||
  process.env.STRIPE_API_KEY_PRIVATE ||
  "";

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

// Types pour les produits Stripe
export type ProductType =
  | "subscription_25" // Abonnement 25 projets/mois
  | "subscription_50" // Abonnement 50 projets/mois
  | "credit_with_sub" // Crédit unitaire avec abonnement
  | "credit_no_sub"; // Crédit unitaire sans abonnement

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  metadata: Record<string, string>;
  prices: StripePrice[];
}

export interface StripePrice {
  id: string;
  productId: string;
  unitAmount: number; // En centimes
  currency: string;
  recurring: {
    interval: "month" | "year";
    intervalCount: number;
  } | null;
  active: boolean;
}

// Cache des produits (évite les appels API répétés)
let productsCache: StripeProduct[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère tous les produits actifs depuis Stripe
 * Utilise un cache pour éviter les appels API répétés
 */
export async function getStripeProducts(
  forceRefresh = false
): Promise<StripeProduct[]> {
  const now = Date.now();

  // Utiliser le cache si disponible et pas expiré
  if (!forceRefresh && productsCache && now - cacheTimestamp < CACHE_DURATION) {
    return productsCache;
  }

  try {
    // Récupérer tous les produits actifs
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
    });

    // Récupérer tous les prix actifs
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
    });

    // Construire la liste des produits avec leurs prix
    const stripeProducts: StripeProduct[] = products.data.map((product) => {
      const productPrices = prices.data
        .filter((price) => {
          const priceProductId =
            typeof price.product === "string"
              ? price.product
              : price.product.id;
          return priceProductId === product.id;
        })
        .map((price) => ({
          id: price.id,
          productId: product.id,
          unitAmount: price.unit_amount || 0,
          currency: price.currency,
          recurring: price.recurring
            ? {
                interval: price.recurring.interval as "month" | "year",
                intervalCount: price.recurring.interval_count,
              }
            : null,
          active: price.active,
        }));

      // Déterminer le type de produit basé sur les métadonnées ou le nom
      const type = detectProductType(product);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        type,
        metadata: product.metadata,
        prices: productPrices,
      };
    });

    // Mettre à jour le cache
    productsCache = stripeProducts;
    cacheTimestamp = now;

    return stripeProducts;
  } catch (error) {
    console.error("Erreur récupération produits Stripe:", error);
    // Retourner le cache même expiré en cas d'erreur
    return productsCache || [];
  }
}

/**
 * Détecte le type de produit basé sur les métadonnées ou le nom
 * IMPORTANT: Dans Stripe Dashboard, ajoutez une métadonnée "type" à vos produits:
 * - subscription_25, subscription_50, credit_with_sub, credit_no_sub
 */
function detectProductType(product: Stripe.Product): ProductType {
  // Priorité aux métadonnées
  if (product.metadata.type) {
    return product.metadata.type as ProductType;
  }

  // Sinon, détecter par le nom du produit
  const name = product.name.toLowerCase();

  if (name.includes("25") && name.includes("abonnement")) {
    return "subscription_25";
  }
  if (name.includes("50") && name.includes("abonnement")) {
    return "subscription_50";
  }
  if (name.includes("sans abonnement") || name.includes("no sub")) {
    return "credit_no_sub";
  }
  if (name.includes("avec abonnement") || name.includes("with sub")) {
    return "credit_with_sub";
  }

  // Par défaut, crédit sans abonnement
  return "credit_no_sub";
}

/**
 * Récupère les produits d'abonnement
 */
export async function getSubscriptionProducts(): Promise<StripeProduct[]> {
  const products = await getStripeProducts();
  return products.filter(
    (p) => p.type === "subscription_25" || p.type === "subscription_50"
  );
}

/**
 * Récupère les produits de crédits unitaires
 */
export async function getCreditProducts(): Promise<StripeProduct[]> {
  const products = await getStripeProducts();
  return products.filter(
    (p) => p.type === "credit_with_sub" || p.type === "credit_no_sub"
  );
}

/**
 * Récupère un produit par son ID
 */
export async function getProductById(
  productId: string
): Promise<StripeProduct | undefined> {
  const products = await getStripeProducts();
  return products.find((p) => p.id === productId);
}

/**
 * Récupère un prix par son ID
 */
export async function getPriceById(
  priceId: string
): Promise<StripePrice | undefined> {
  const products = await getStripeProducts();
  for (const product of products) {
    const price = product.prices.find((p) => p.id === priceId);
    if (price) return price;
  }
  return undefined;
}

/**
 * Formate un prix pour l'affichage
 */
export function formatPrice(amount: number, currency: string = "eur"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Vérifie si Stripe est configuré
 */
export function isStripeConfigured(): boolean {
  return !!STRIPE_SECRET_KEY;
}
