import type { APIRoute } from "astro";
import {
  createReference,
  createGeneration,
  createInstruction,
  updateGeneration,
  getReference,
  canUserGenerate,
  consumeCredit,
  type PlanType,
} from "../../lib/db";
import { saveImage } from "../../lib/storage";
import {
  generateBeforeAfter,
  type GenerationInstruction,
  type ModificationType,
} from "../../lib/gemini";
import { getUserPlanFromAuth, isAdminUser } from "../../lib/plans";
import { getCreditsBalance, useCredit } from "../../lib/subscriptions";

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();

  try {
    const auth = locals.auth();
    const userId = auth.userId;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("\n" + "═".repeat(50));
    console.log("📥 NOUVELLE REQUÊTE DE GÉNÉRATION");
    console.log("═".repeat(50));
    console.log(`👤 User: ${userId}`);

    // Vérifier le plan de l'utilisateur et ses crédits
    const authObj = locals.auth();
    const userPlanInfo = getUserPlanFromAuth(authObj.has as any, userId);

    // Les admins ont des générations illimitées
    const isAdmin = isAdminUser(userId);
    
    // Récupérer les crédits bonus
    const bonusCredits = getCreditsBalance(userId);
    
    // Passer les crédits bonus à canUserGenerate pour le compteur total
    const creditCheck = canUserGenerate(userId, userPlanInfo.planType, isAdmin, bonusCredits);

    console.log(
      `📊 Plan: ${userPlanInfo.planName} | Admin: ${isAdmin} | Crédits: ${
        creditCheck.used
      }/${isAdmin ? "∞" : creditCheck.totalAvailable}${bonusCredits > 0 ? ` (+${bonusCredits} bonus)` : ""}`
    );

    if (!isAdmin && !creditCheck.canGenerate) {
      console.log(`⛔ Limite atteinte: ${creditCheck.reason}`);
      return new Response(
        JSON.stringify({
          error: creditCheck.reason,
          noCredits: true,
          used: creditCheck.used,
          limit: creditCheck.limit,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const instructionsJson = formData.get("instructions") as string;

    if (!image || !instructionsJson) {
      return new Response(
        JSON.stringify({ error: "Image et instructions requises" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `📷 Image originale: ${image.name} (${(image.size / 1024).toFixed(0)} KB)`
    );

    // Sauvegarder l'image originale
    const originalImagePath = await saveImage(image, userId, "originals");
    console.log(`💾 Sauvegardée: ${originalImagePath}`);

    // Créer la génération
    const generation = createGeneration(userId, originalImagePath);
    updateGeneration(generation.id, { status: "processing" });
    console.log(`🆔 Generation ID: ${generation.id}`);

    // Parser les instructions
    const parsedInstructions = JSON.parse(instructionsJson) as Array<{
      location: string;
      referenceId?: string;
      referenceName?: string;
      modificationType?: ModificationType;
      isNew?: boolean;
    }>;

    console.log(`\n📋 Instructions reçues: ${parsedInstructions.length}`);

    const geminiInstructions: GenerationInstruction[] = [];

    // Traiter chaque instruction
    for (let i = 0; i < parsedInstructions.length; i++) {
      const instr = parsedInstructions[i];
      let referenceId = instr.referenceId;
      let referencePath = "";
      // Utiliser le nom fourni, sinon chercher dans la DB, sinon générer un nom
      let referenceName = "";

      if (instr.isNew) {
        // Nouvelle référence uploadée
        const newRefFile = formData.get(`newRef_${i}`) as File;
        if (newRefFile) {
          // Utiliser le nom donné par l'utilisateur, ou le nom du fichier sans extension
          referenceName =
            (instr.referenceName && instr.referenceName.trim()) ||
            newRefFile.name.replace(/\.[^.]+$/, "") ||
            `Référence ${i + 1}`;
          console.log(`   📤 Nouvelle référence ${i + 1}: ${referenceName}`);
          const newRefPath = await saveImage(newRefFile, userId, "references");
          const newRef = createReference(userId, newRefPath, referenceName);
          referenceId = newRef.id;
          referencePath = newRefPath;
        }
      } else if (referenceId) {
        // Référence existante
        const ref = getReference(referenceId);
        if (ref) {
          referencePath = ref.image_path;
          // Priorité: nom de l'instruction > nom en DB > nom généré
          referenceName =
            (instr.referenceName && instr.referenceName.trim()) ||
            (ref.name && ref.name.trim()) ||
            `Référence ${i + 1}`;
          console.log(`   📎 Référence existante ${i + 1}: ${referenceName}`);
        }
      }

      if (referenceId && referencePath) {
        createInstruction(generation.id, instr.location, referenceId);

        const instruction: GenerationInstruction = {
          location: instr.location,
          referenceImagePath: referencePath, // Chemin S3 directement
          referenceName: referenceName,
        };

        // Ajouter le type de modification si spécifié
        if (instr.modificationType) {
          instruction.modificationType = instr.modificationType;
        }

        geminiInstructions.push(instruction);
        console.log(`   ✓ [${i + 1}] "${instr.location}" → ${referenceName}`);
      } else {
        console.warn(`   ⚠️ Instruction ${i + 1} ignorée: référence manquante`);
      }
    }

    // Vérifier qu'il y a des instructions valides
    if (geminiInstructions.length === 0) {
      updateGeneration(generation.id, { status: "failed" });
      return new Response(
        JSON.stringify({ error: "Aucune instruction valide fournie" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Générer avec Gemini
    console.log(
      `\n🚀 Lancement de la génération avec ${geminiInstructions.length} instruction(s)...`
    );

    try {
      const result = await generateBeforeAfter(
        originalImagePath, // Chemin S3 directement
        geminiInstructions,
        "generated", // Type de stockage S3
        generation.id
      );

      updateGeneration(generation.id, {
        status: "completed",
        generated_image_path: result.imagePath,
      });

      // Consommer un crédit (mensuel d'abord, puis bonus si nécessaire)
      if (!isAdmin) {
        const creditResult = consumeCredit(
          userId,
          userPlanInfo.planType,
          bonusCredits,
          () => useCredit(userId)
        );
        console.log(`💳 Crédit consommé pour ${userId} (bonus: ${creditResult.usedBonus})`);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ GÉNÉRATION TERMINÉE en ${duration}s`);
      console.log(`   📁 Résultat: ${result.imagePath}`);
      console.log(`   🔄 Tentatives: ${result.attempts}`);
      console.log("═".repeat(50) + "\n");

      return new Response(
        JSON.stringify({
          success: true,
          generationId: generation.id,
          originalImage: originalImagePath,
          generatedImage: result.imagePath,
          description: result.description,
          attempts: result.attempts,
          duration: parseFloat(duration),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (geminiError: any) {
      updateGeneration(generation.id, { status: "failed" });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`\n❌ GÉNÉRATION ÉCHOUÉE après ${duration}s`);
      console.error(`   Erreur: ${geminiError.message}`);
      console.log("═".repeat(50) + "\n");

      throw geminiError;
    }
  } catch (error: any) {
    const errorMessage = error.message || "Erreur serveur inconnue";
    console.error("❌ Erreur API generate:", errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
