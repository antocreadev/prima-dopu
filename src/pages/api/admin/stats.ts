import type { APIRoute } from "astro";
import { isAdminUser } from "../../../lib/plans";
import db from "../../../lib/db";

export const GET: APIRoute = async ({ locals }) => {
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

    // Stats globales
    const totalUsers = db
      .prepare(
        `
      SELECT COUNT(DISTINCT user_id) as count FROM user_credits
    `
      )
      .get() as { count: number };

    const totalGenerations = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM generations
    `
      )
      .get() as { count: number };

    const completedGenerations = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM generations WHERE status = 'completed'
    `
      )
      .get() as { count: number };

    const failedGenerations = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM generations WHERE status = 'failed'
    `
      )
      .get() as { count: number };

    const totalReferences = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM material_refs
    `
      )
      .get() as { count: number };

    // Générations par période
    const last24h = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM generations 
      WHERE created_at >= datetime('now', '-24 hours')
    `
      )
      .get() as { count: number };

    const last7days = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM generations 
      WHERE created_at >= datetime('now', '-7 days')
    `
      )
      .get() as { count: number };

    const last30days = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM generations 
      WHERE created_at >= datetime('now', '-30 days')
    `
      )
      .get() as { count: number };

    // Répartition par plan
    const planStats = db
      .prepare(
        `
      SELECT 
        plan_type,
        COUNT(*) as count,
        SUM(credits_balance) as total_bonus_credits
      FROM subscriptions
      GROUP BY plan_type
    `
      )
      .all() as Array<{
      plan_type: string;
      count: number;
      total_bonus_credits: number;
    }>;

    // Revenus (achats de crédits)
    const totalRevenue = db
      .prepare(
        `
      SELECT 
        SUM(price_paid) as total,
        COUNT(*) as purchases_count,
        SUM(credits_amount) as credits_sold
      FROM credit_purchases 
      WHERE status = 'completed'
    `
      )
      .get() as {
      total: number;
      purchases_count: number;
      credits_sold: number;
    };

    // Générations par jour (7 derniers jours)
    const dailyGenerations = db
      .prepare(
        `
      SELECT 
        date(created_at) as day,
        COUNT(*) as count
      FROM generations 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY day DESC
    `
      )
      .all() as Array<{ day: string; count: number }>;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          users: {
            total: totalUsers.count,
            byPlan: planStats,
          },
          generations: {
            total: totalGenerations.count,
            completed: completedGenerations.count,
            failed: failedGenerations.count,
            last24h: last24h.count,
            last7days: last7days.count,
            last30days: last30days.count,
            daily: dailyGenerations,
          },
          references: {
            total: totalReferences.count,
          },
          revenue: {
            total: totalRevenue.total || 0,
            purchasesCount: totalRevenue.purchases_count || 0,
            creditsSold: totalRevenue.credits_sold || 0,
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ADMIN] Erreur stats:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erreur serveur",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
