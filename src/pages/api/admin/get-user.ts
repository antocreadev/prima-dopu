import type { APIRoute } from "astro";
import { isAdminUser } from "../../../lib/plans";
import { getSubscription } from "../../../lib/subscriptions";
import db from "../../../lib/db";

export const GET: APIRoute = async ({ request, locals, url }) => {
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

    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer les infos de l'utilisateur
    const subscription = getSubscription(userId);

    // Récupérer les crédits utilisés
    const userCredits = db.prepare(`
      SELECT * FROM user_credits WHERE user_id = ?
    `).get(userId) as { total_generations: number; monthly_generations: number; last_generation_month: string } | undefined;

    // Récupérer les générations
    const generations = db.prepare(`
      SELECT 
        g.*,
        (SELECT COUNT(*) FROM instructions WHERE generation_id = g.id) as instruction_count
      FROM generations g
      WHERE g.user_id = ?
      ORDER BY g.created_at DESC
      LIMIT 50
    `).all(userId) as Array<{
      id: string;
      user_id: string;
      original_image_path: string;
      generated_image_path: string | null;
      status: string;
      created_at: string;
      instruction_count: number;
    }>;

    // Récupérer les références
    const references = db.prepare(`
      SELECT * FROM material_refs 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId) as Array<{
      id: string;
      name: string | null;
      image_path: string;
      folder_id: string | null;
      created_at: string;
    }>;

    // Récupérer les achats de crédits
    const purchases = db.prepare(`
      SELECT * FROM credit_purchases 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId) as Array<{
      id: string;
      credits_amount: number;
      price_paid: number;
      currency: string;
      status: string;
      created_at: string;
    }>;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          userId,
          subscription: subscription || { plan_type: "free", credits_balance: 0 },
          credits: userCredits || { total_generations: 0, monthly_generations: 0 },
          generations,
          references,
          purchases
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ADMIN] Erreur get-user:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Erreur serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
