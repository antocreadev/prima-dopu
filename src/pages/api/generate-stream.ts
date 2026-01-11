import type { APIRoute } from "astro";
import {
  createReference,
  createGeneration,
  createInstruction,
  updateGeneration,
  getReference,
  canUserGenerate,
  consumeCredit,
} from "../../lib/db";
import { saveImage, checkImageExists } from "../../lib/storage";
import {
  generateBeforeAfterWithProgress,
  type GenerationInstruction,
  type ModificationType,
  type ProgressEvent,
} from "../../lib/gemini/index";
import { getUserPlan, isAdminUser } from "../../lib/plans";
import { getCreditsBalance, useCredit } from "../../lib/subscriptions";

// Nombre max de tentatives pour la génération (retry automatique)
const MAX_GENERATION_RETRIES = 2;

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();

  // Créer un TransformStream pour le SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let isClosed = false;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // Fonction helper pour envoyer un événement SSE (silencieusement si déconnecté)
  // IMPORTANT: Le client peut se déconnecter, mais la génération CONTINUE
  const sendEvent = async (event: string, data: any) => {
    if (isClosed) return; // Client parti, on continue en silence
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    } catch (e: any) {
      // Client déconnecté - on marque comme fermé mais ON CONTINUE le traitement
      isClosed = true;
      // Pas de log pour éviter le spam
    }
  };

  // Envoyer un heartbeat pour maintenir la connexion active
  const startHeartbeat = () => {
    heartbeatInterval = setInterval(async () => {
      if (isClosed) {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        return;
      }
      try {
        await writer.write(encoder.encode(": heartbeat\n\n"));
      } catch (e) {
        isClosed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      }
    }, 8000); // 8 secondes pour mobile
  };

  // Fonction pour fermer le writer en toute sécurité
  const safeClose = async () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    if (isClosed) return;
    isClosed = true;
    try {
      await writer.close();
    } catch (e) {
      // Déjà fermé ou erreur, ignorer
    }
  };

  // Lancer le traitement en arrière-plan
  (async () => {
    try {
      const auth = locals.auth();
      const userId = auth.userId;

      if (!userId) {
        await sendEvent("error", { message: "Non authentifié" });
        await safeClose();
        return;
      }

      // Démarrer le heartbeat pour maintenir la connexion
      startHeartbeat();

      await sendEvent("log", {
        icon: "📥",
        message: "Nouvelle requête de génération",
        type: "header",
      });
      await sendEvent("log", {
        icon: "👤",
        message: `Utilisateur: ${userId.substring(0, 10)}...`,
      });

      // Vérifier le plan de l'utilisateur
      const isAdmin = isAdminUser(userId);

      // Récupérer le plan Stripe et les crédits bonus
      const userPlanInfo = getUserPlan(userId);
      const creditsBalance = getCreditsBalance(userId);

      // Passer les crédits bonus à canUserGenerate pour le compteur total
      const creditCheck = canUserGenerate(
        userId,
        userPlanInfo.planType,
        isAdmin,
        creditsBalance
      );

      // Afficher les crédits bonus s'il y en a
      const creditsInfo =
        creditsBalance > 0 ? ` + ${creditsBalance} bonus` : "";

      await sendEvent("log", {
        icon: "📊",
        message: `Plan: ${userPlanInfo.planName} | Crédits: ${
          creditCheck.used
        }/${isAdmin ? "∞" : creditCheck.totalAvailable}${creditsInfo}${
          isAdmin ? " (Admin)" : ""
        }`,
      });

      // Vérifier si l'utilisateur peut générer (avec les crédits bonus inclus)
      if (!isAdmin && !creditCheck.canGenerate) {
        await sendEvent("error", {
          message: creditCheck.reason,
          noCredits: true,
          used: creditCheck.used,
          limit: creditCheck.limit,
        });
        await safeClose();
        return;
      }

      let formData: FormData;
      let image: File | null = null;
      let instructionsJson: string | null = null;
      
      try {
        formData = await request.formData();
        image = formData.get("image") as File;
        instructionsJson = formData.get("instructions") as string;
      } catch (parseError: any) {
        console.error("[SSE] Erreur parsing FormData:", parseError);
        await sendEvent("error", { 
          message: "Erreur lors de la réception des données. Veuillez réessayer." 
        });
        await safeClose();
        return;
      }

      if (!image || !instructionsJson) {
        await sendEvent("error", { message: "Image et instructions requises" });
        await safeClose();
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
      
      // Envoyer l'ID immédiatement pour permettre le polling si déconnexion
      await sendEvent("generationId", { id: generation.id });
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
        hasMask?: boolean;
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
        let maskImagePath: string | undefined;

        // Gérer le masque si présent
        if (instr.hasMask) {
          const maskFile = formData.get(`mask_${i}`) as File;
          if (maskFile) {
            await sendEvent("log", {
              icon: "🖌️",
              message: `Masque détecté pour instruction ${i + 1}`,
            });
            maskImagePath = await saveImage(maskFile, userId, "references");
            await sendEvent("log", {
              icon: "💾",
              message: `Masque sauvegardé`,
            });
          }
        }

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
            // Vérifier que l'image existe sur S3
            const imageExists = await checkImageExists(ref.image_path);
            if (!imageExists) {
              await sendEvent("log", {
                icon: "⚠️",
                message: `Réf "${
                  ref.name || referenceId
                }" introuvable sur S3, ignorée`,
                type: "warning",
              });
              continue; // Passer à l'instruction suivante
            }
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
          createInstruction(
            generation.id,
            instr.location,
            referenceId,
            maskImagePath
          );

          const instruction: GenerationInstruction = {
            location: instr.location,
            referenceImagePath: referencePath,
            referenceName: referenceName,
            maskImagePath: maskImagePath,
          };

          if (instr.modificationType) {
            instruction.modificationType = instr.modificationType;
          }

          geminiInstructions.push(instruction);
          await sendEvent("log", {
            icon: "✓",
            message: `[${i + 1}] "${instr.location}" → ${referenceName}${
              maskImagePath ? " (avec masque)" : ""
            }`,
            type: "success",
          });
        }
      }

      if (geminiInstructions.length === 0) {
        updateGeneration(generation.id, { status: "failed" });
        await sendEvent("error", { message: "Aucune instruction valide" });
        await safeClose();
        return;
      }

      await sendEvent("log", {
        icon: "🚀",
        message: `Lancement avec ${geminiInstructions.length} instruction(s)...`,
        type: "header",
      });

      // Callback de progression pour Gemini (silencieux si déconnecté)
      const onProgress = (event: ProgressEvent) => {
        if (event.type === "step") {
          sendEvent("step", {
            step: event.step,
            status: event.status === "loading" ? "active" : event.status,
          });
        } else if (event.type === "log") {
          sendEvent("log", { icon: event.icon, message: event.message });
        }
        // On n'envoie plus les erreurs ici, on les gère dans le retry
      };

      // GÉNÉRATION AVEC RETRY AUTOMATIQUE
      let result: any = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES; attempt++) {
        try {
          if (attempt > 1) {
            await sendEvent("log", { icon: "🔄", message: `Tentative ${attempt}/${MAX_GENERATION_RETRIES}...` });
            // Attendre 2 secondes avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          result = await generateBeforeAfterWithProgress(
            originalImagePath,
            geminiInstructions,
            "generated",
            generation.id,
            onProgress,
            {}
          );
          
          // Succès! On sort de la boucle
          break;
        } catch (error: any) {
          lastError = error;
          console.error(`[Generate] Tentative ${attempt}/${MAX_GENERATION_RETRIES} échouée:`, error.message);
          
          // Si c'est la dernière tentative, on ne réessaye pas
          if (attempt === MAX_GENERATION_RETRIES) {
            break;
          }
        }
      }

      // Vérifier le résultat
      if (result) {
        // SUCCÈS
        updateGeneration(generation.id, {
          status: "completed",
          generated_image_path: result.imagePath,
        });

        // Consommer un crédit (mensuel d'abord, puis bonus si nécessaire)
        if (!isAdmin) {
          const creditResult = consumeCredit(
            userId,
            userPlanInfo.planType,
            creditsBalance,
            () => useCredit(userId)
          );

          if (creditResult.usedBonus) {
            await sendEvent("log", {
              icon: "💎",
              message: `Crédit bonus utilisé`,
            });
          }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        await sendEvent("log", {
          icon: "✅",
          message: `Terminé en ${duration}s`,
          type: "success",
        });

        // Log des masques combinés si présents
        if (result.combinedMaskPaths && result.combinedMaskPaths.length > 0) {
          await sendEvent("log", {
            icon: "🎭",
            message: `${result.combinedMaskPaths.length} masque(s) combiné(s) disponible(s)`,
          });
        }

        await sendEvent("complete", {
          success: true,
          generationId: generation.id,
          originalImage: originalImagePath,
          generatedImage: result.imagePath,
          description: result.description,
          attempts: result.attempts,
          duration: parseFloat(duration),
          combinedMaskPaths: result.combinedMaskPaths,
        });
      } else {
        // ÉCHEC après toutes les tentatives
        updateGeneration(generation.id, { status: "failed" });
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const errorMsg = lastError?.message || "Échec de la génération";
        await sendEvent("log", {
          icon: "❌",
          message: `Échec après ${duration}s et ${MAX_GENERATION_RETRIES} tentatives: ${errorMsg}`,
          type: "error",
        });
        await sendEvent("error", { message: errorMsg });
      }

      await safeClose();
    } catch (error: any) {
      // Ne pas logger les déconnexions client
      if (error?.code !== 'ECONNRESET' && error?.message !== 'aborted') {
        console.error("[Generate] Erreur:", error);
      }
      await sendEvent("error", { message: error?.message || "Erreur serveur" });
      await safeClose();
    }
  })().catch((err: any) => {
    // Capture toute erreur non gérée (ex: client déconnecté pendant l'écriture)
    // Ne pas logger les erreurs ECONNRESET/aborted (spam sur mobile)
    if (err?.code !== 'ECONNRESET' && err?.message !== 'aborted') {
      console.error("[SSE] Erreur fatale non gérée:", err);
    }
    safeClose().catch(() => {});
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Indique à Nginx de ne pas bufferiser
    },
  });
};
