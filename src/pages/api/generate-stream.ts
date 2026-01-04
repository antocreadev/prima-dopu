import type { APIRoute } from "astro";
import {
  createReference,
  createGeneration,
  createInstruction,
  updateGeneration,
  getReference,
  canUserGenerate,
  incrementUserCredits,
} from "../../lib/db";
import { saveImage } from "../../lib/storage";
import {
  generateBeforeAfterWithProgress,
  type GenerationInstruction,
  type ModificationType,
} from "../../lib/gemini";
import { getUserPlanFromAuth } from "../../lib/plans";

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();

  // Créer un TransformStream pour le SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Fonction helper pour envoyer un événement SSE
  const sendEvent = async (event: string, data: any) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Lancer le traitement en arrière-plan
  (async () => {
    try {
      const auth = locals.auth();
      const userId = auth.userId;

      if (!userId) {
        await sendEvent("error", { message: "Non authentifié" });
        await writer.close();
        return;
      }

      await sendEvent("log", {
        icon: "📥",
        message: "Nouvelle requête de génération",
        type: "header",
      });
      await sendEvent("log", {
        icon: "👤",
        message: `Utilisateur: ${userId.substring(0, 10)}...`,
      });

      // Vérifier le plan de l'utilisateur et ses crédits
      const authObj = locals.auth();
      const userPlanInfo = getUserPlanFromAuth(authObj.has as any, userId);
      const isAdmin = userPlanInfo.isAdmin === true;
      const creditCheck = canUserGenerate(userId, userPlanInfo.planType, isAdmin);

      await sendEvent("log", {
        icon: "📊",
        message: `Plan: ${userPlanInfo.planName} | Crédits: ${creditCheck.used}/${isAdmin ? '∞' : creditCheck.limit}${isAdmin ? ' (Admin)' : ''}`,
      });

      if (!isAdmin && !creditCheck.canGenerate) {
        await sendEvent("error", {
          message: creditCheck.reason,
          noCredits: true,
          used: creditCheck.used,
          limit: creditCheck.limit,
        });
        await writer.close();
        return;
      }

      const formData = await request.formData();
      const image = formData.get("image") as File;
      const instructionsJson = formData.get("instructions") as string;

      if (!image || !instructionsJson) {
        await sendEvent("error", { message: "Image et instructions requises" });
        await writer.close();
        return;
      }

      await sendEvent("step", { step: "upload", status: "active" });
      await sendEvent("log", {
        icon: "📷",
        message: `Image: ${image.name} (${(image.size / 1024).toFixed(0)} KB)`,
      });

      // Sauvegarder l'image originale
      const originalImagePath = await saveImage(image, userId, "originals");
      await sendEvent("log", {
        icon: "💾",
        message: `Sauvegardée sur S3`,
      });
      await sendEvent("step", { step: "upload", status: "done" });

      // Créer la génération
      const generation = createGeneration(userId, originalImagePath);
      updateGeneration(generation.id, { status: "processing" });
      await sendEvent("log", {
        icon: "🆔",
        message: `ID: ${generation.id.substring(0, 8)}...`,
      });

      // Parser les instructions
      const parsedInstructions = JSON.parse(instructionsJson) as Array<{
        location: string;
        referenceId?: string;
        referenceName?: string;
        modificationType?: ModificationType;
        isNew?: boolean;
      }>;

      await sendEvent("log", {
        icon: "📋",
        message: `${parsedInstructions.length} instruction(s) reçue(s)`,
      });

      const geminiInstructions: GenerationInstruction[] = [];

      // Traiter chaque instruction
      for (let i = 0; i < parsedInstructions.length; i++) {
        const instr = parsedInstructions[i];
        let referenceId = instr.referenceId;
        let referencePath = "";
        let referenceName = "";

        if (instr.isNew) {
          const newRefFile = formData.get(`newRef_${i}`) as File;
          if (newRefFile) {
            referenceName =
              (instr.referenceName && instr.referenceName.trim()) ||
              newRefFile.name.replace(/\.[^.]+$/, "") ||
              `Référence ${i + 1}`;
            await sendEvent("log", {
              icon: "📤",
              message: `Nouvelle réf: ${referenceName}`,
            });
            const newRefPath = await saveImage(
              newRefFile,
              userId,
              "references"
            );
            const newRef = createReference(userId, newRefPath, referenceName);
            referenceId = newRef.id;
            referencePath = newRefPath;
          }
        } else if (referenceId) {
          const ref = getReference(referenceId);
          if (ref) {
            referencePath = ref.image_path;
            referenceName =
              (instr.referenceName && instr.referenceName.trim()) ||
              (ref.name && ref.name.trim()) ||
              `Référence ${i + 1}`;
            await sendEvent("log", {
              icon: "📎",
              message: `Réf existante: ${referenceName}`,
            });
          }
        }

        if (referenceId && referencePath) {
          createInstruction(generation.id, instr.location, referenceId);

          const instruction: GenerationInstruction = {
            location: instr.location,
            referenceImagePath: referencePath,
            referenceName: referenceName,
          };

          if (instr.modificationType) {
            instruction.modificationType = instr.modificationType;
          }

          geminiInstructions.push(instruction);
          await sendEvent("log", {
            icon: "✓",
            message: `[${i + 1}] "${instr.location}" → ${referenceName}`,
            type: "success",
          });
        }
      }

      if (geminiInstructions.length === 0) {
        updateGeneration(generation.id, { status: "failed" });
        await sendEvent("error", { message: "Aucune instruction valide" });
        await writer.close();
        return;
      }

      await sendEvent("log", {
        icon: "🚀",
        message: `Lancement avec ${geminiInstructions.length} instruction(s)...`,
        type: "header",
      });

      // Callback de progression pour Gemini
      const onProgress = (event: {
        type: "log" | "step" | "error";
        icon?: string;
        message?: string;
        step?: string;
        status?: "pending" | "loading" | "done" | "error";
      }) => {
        if (event.type === "step") {
          sendEvent("step", {
            step: event.step,
            status: event.status === "loading" ? "active" : event.status,
          });
        } else if (event.type === "log") {
          sendEvent("log", { icon: event.icon, message: event.message });
        } else if (event.type === "error") {
          sendEvent("error", { message: event.message });
        }
      };

      try {
        const result = await generateBeforeAfterWithProgress(
          originalImagePath,
          geminiInstructions,
          "generated",
          generation.id,
          onProgress,
          {}
        );

        updateGeneration(generation.id, {
          status: "completed",
          generated_image_path: result.imagePath,
        });

        incrementUserCredits(userId);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        await sendEvent("log", {
          icon: "✅",
          message: `Terminé en ${duration}s`,
          type: "success",
        });

        await sendEvent("complete", {
          success: true,
          generationId: generation.id,
          originalImage: originalImagePath,
          generatedImage: result.imagePath,
          description: result.description,
          attempts: result.attempts,
          duration: parseFloat(duration),
        });
      } catch (geminiError: any) {
        updateGeneration(generation.id, { status: "failed" });
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        await sendEvent("log", {
          icon: "❌",
          message: `Échec après ${duration}s: ${geminiError.message}`,
          type: "error",
        });
        await sendEvent("error", { message: geminiError.message });
      }

      await writer.close();
    } catch (error: any) {
      await sendEvent("error", { message: error.message || "Erreur serveur" });
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
