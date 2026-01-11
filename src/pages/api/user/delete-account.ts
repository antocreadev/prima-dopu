import type { APIRoute } from "astro";
import { clerkClient } from "@clerk/astro/server";

export const POST: APIRoute = async (context) => {
  try {
    const auth = context.locals.auth();
    const userId = auth.userId;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
      });
    }

    // Supprimer l'utilisateur via Clerk
    await clerkClient(context).users.deleteUser(userId);

    return new Response(
      JSON.stringify({ success: true, message: "Compte supprimé avec succès" }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la suppression du compte:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la suppression du compte" }),
      { status: 500 }
    );
  }
};
