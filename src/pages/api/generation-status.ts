import type { APIRoute } from "astro";
import { getGeneration } from "../../lib/db";

/**
 * API pour vérifier le statut d'une génération
 * Utilisé pour le polling si le SSE se déconnecte
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const auth = locals.auth();
  const userId = auth.userId;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const generationId = url.searchParams.get("id");

  if (!generationId) {
    return new Response(JSON.stringify({ error: "ID de génération requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const generation = getGeneration(generationId);

  if (!generation) {
    return new Response(JSON.stringify({ error: "Génération introuvable" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Vérifier que la génération appartient à l'utilisateur
  if (generation.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Accès non autorisé" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      id: generation.id,
      status: generation.status,
      originalImage: generation.original_image_path,
      generatedImage: generation.generated_image_path,
      createdAt: generation.created_at,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
