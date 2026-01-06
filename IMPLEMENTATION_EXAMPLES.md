# 💻 EXEMPLES D'IMPLÉMENTATION - Sélection de Zones

## 📦 Installation des Dépendances

```bash
# Frontend - Éditeur de canvas
npm install fabric
npm install @types/fabric --save-dev

# Alternative React-friendly
# npm install react-konva konva

# Backend - Déjà installé
# sharp (optimisation images)
```

---

## 🎨 FRONTEND : Composant Éditeur de Masques

### 1. Composant `ZoneMaskEditor.tsx`

```tsx
// src/components/ZoneMaskEditor.tsx
import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

interface ZoneMaskEditorProps {
  imageUrl: string;
  onMaskComplete: (maskDataUrl: string) => void;
  onCancel: () => void;
  instructionColor?: string; // Pour différencier les instructions
}

export default function ZoneMaskEditor({
  imageUrl,
  onMaskComplete,
  onCancel,
  instructionColor = "#ff0000",
}: ZoneMaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<
    "brush" | "rectangle" | "polygon" | "eraser"
  >("brush");
  const [brushSize, setBrushSize] = useState(20);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialiser Fabric.js
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f0f0f0",
    });

    // Charger l'image de fond
    fabric.Image.fromURL(imageUrl, (img) => {
      // Redimensionner l'image pour tenir dans le canvas
      const scale = Math.min(
        fabricCanvas.width! / img.width!,
        fabricCanvas.height! / img.height!
      );

      img.scale(scale);
      img.set({
        left: (fabricCanvas.width! - img.width! * scale) / 2,
        top: (fabricCanvas.height! - img.height! * scale) / 2,
        selectable: false,
        evented: false,
      });

      fabricCanvas.setBackgroundImage(
        img,
        fabricCanvas.renderAll.bind(fabricCanvas)
      );
    });

    // Configuration du pinceau
    fabricCanvas.isDrawingMode = true;
    fabricCanvas.freeDrawingBrush.width = brushSize;
    fabricCanvas.freeDrawingBrush.color = instructionColor;

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!canvas) return;

    // Mettre à jour le mode de dessin selon l'outil
    if (tool === "brush" || tool === "eraser") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color =
        tool === "eraser" ? "#ffffff" : instructionColor;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [tool, brushSize, canvas, instructionColor]);

  const addRectangle = () => {
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 150,
      fill: instructionColor,
      opacity: 0.5,
      stroke: instructionColor,
      strokeWidth: 2,
    });

    canvas.add(rect);
  };

  const addPolygon = () => {
    if (!canvas) return;

    const points = [
      { x: 100, y: 100 },
      { x: 200, y: 50 },
      { x: 300, y: 100 },
      { x: 250, y: 200 },
      { x: 150, y: 200 },
    ];

    const polygon = new fabric.Polygon(points, {
      fill: instructionColor,
      opacity: 0.5,
      stroke: instructionColor,
      strokeWidth: 2,
    });

    canvas.add(polygon);
  };

  const clearMask = () => {
    if (!canvas) return;
    canvas.getObjects().forEach((obj) => {
      if (obj !== canvas.backgroundImage) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
  };

  const undo = () => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    if (objects.length > 0) {
      canvas.remove(objects[objects.length - 1]);
      canvas.renderAll();
    }
  };

  const exportMask = () => {
    if (!canvas) return;

    // Créer un canvas temporaire pour le masque noir/blanc
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width!;
    maskCanvas.height = canvas.height!;
    const ctx = maskCanvas.getContext("2d")!;

    // Fond noir
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Dessiner les objets en blanc
    canvas.getObjects().forEach((obj) => {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#ffffff";

      if (obj.type === "path") {
        // Dessin à main levée
        const path = obj as fabric.Path;
        const pathData = path.path!;
        ctx.beginPath();
        pathData.forEach((segment: any) => {
          const cmd = segment[0];
          if (cmd === "M") {
            ctx.moveTo(segment[1] + obj.left!, segment[2] + obj.top!);
          } else if (cmd === "L") {
            ctx.lineTo(segment[1] + obj.left!, segment[2] + obj.top!);
          } else if (cmd === "Q") {
            ctx.quadraticCurveTo(
              segment[1] + obj.left!,
              segment[2] + obj.top!,
              segment[3] + obj.left!,
              segment[4] + obj.top!
            );
          }
        });
        ctx.lineWidth = obj.strokeWidth || 1;
        ctx.stroke();
      } else if (obj.type === "rect") {
        ctx.fillRect(
          obj.left!,
          obj.top!,
          obj.width! * obj.scaleX!,
          obj.height! * obj.scaleY!
        );
      } else if (obj.type === "polygon") {
        const polygon = obj as fabric.Polygon;
        ctx.beginPath();
        polygon.points!.forEach((point, index) => {
          const x = obj.left! + point.x * obj.scaleX!;
          const y = obj.top! + point.y * obj.scaleY!;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    // Exporter en data URL PNG
    const maskDataUrl = maskCanvas.toDataURL("image/png");
    onMaskComplete(maskDataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Barre d'outils */}
      <div className="bg-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white text-lg font-semibold">
            Délimiter la zone
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => setTool("brush")}
              className={`px-3 py-2 rounded ${
                tool === "brush"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              🖌️ Pinceau
            </button>
            <button
              onClick={() => {
                setTool("rectangle");
                addRectangle();
              }}
              className={`px-3 py-2 rounded ${
                tool === "rectangle"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              ▭ Rectangle
            </button>
            <button
              onClick={() => {
                setTool("polygon");
                addPolygon();
              }}
              className={`px-3 py-2 rounded ${
                tool === "polygon"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              ⬠ Polygone
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`px-3 py-2 rounded ${
                tool === "eraser"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
            >
              🧹 Gomme
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-white text-sm">Taille:</label>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-white text-sm">{brushSize}px</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={undo}
            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
          >
            ↩️ Annuler
          </button>
          <button
            onClick={clearMask}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🗑️ Effacer tout
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-8">
        <canvas ref={canvasRef} className="border-2 border-white shadow-2xl" />
      </div>

      {/* Actions */}
      <div className="bg-slate-800 p-4 flex justify-between items-center">
        <p className="text-slate-300 text-sm">
          💡 Conseil : Dessinez la zone où vous souhaitez appliquer la
          référence. Soyez précis pour de meilleurs résultats.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-slate-600 text-white rounded hover:bg-slate-700"
          >
            Annuler
          </button>
          <button
            onClick={exportMask}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
          >
            Valider le masque
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Intégration dans `generate.astro`

```astro
---
// ... imports existants
import ZoneMaskEditor from "../components/ZoneMaskEditor";

// ... code serveur existant
---

<Layout title="Générer">
  <!-- ... contenu existant ... -->

  <!-- Modal d'instruction - MODIFIÉ -->
  <div id="instructionModal" class="...">
    <div class="...">
      <h2>Ajouter une instruction</h2>

      <!-- Zone à modifier -->
      <div class="mb-4">
        <!-- ... existant ... -->
      </div>

      <!-- Référence -->
      <div class="mb-4">
        <!-- ... existant ... -->
      </div>

      <!-- NOUVEAU : Délimitation de zone -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Délimiter la zone (recommandé)
        </label>
        <button
          type="button"
          id="openMaskEditorBtn"
          class="w-full px-4 py-3 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
        >
          <span class="text-2xl">🎨</span>
          <span class="text-indigo-700 font-medium">Dessiner la zone sur l'image</span>
        </button>
        <canvas id="maskPreview" class="hidden mt-2 w-full rounded border border-slate-300"></canvas>
        <p id="maskStatus" class="text-xs text-slate-500 mt-1 hidden">
          ✓ Zone délimitée
        </p>
      </div>

      <!-- Boutons -->
      <div class="flex gap-3">
        <!-- ... existant ... -->
      </div>
    </div>
  </div>

  <!-- NOUVEAU : Modal éditeur de masque -->
  <div id="maskEditorContainer"></div>
</Layout>

<script>
  import { createElement } from 'react';
  import { createRoot } from 'react-dom/client';
  import ZoneMaskEditor from '../components/ZoneMaskEditor';

  // ... code existant ...

  let currentMaskDataUrl: string | null = null;

  // Ouvrir l'éditeur de masque
  const openMaskEditorBtn = document.getElementById('openMaskEditorBtn')!;
  openMaskEditorBtn.addEventListener('click', () => {
    const container = document.getElementById('maskEditorContainer')!;
    const imageUrl = step2PreviewImg.src;

    const root = createRoot(container);
    root.render(
      createElement(ZoneMaskEditor, {
        imageUrl,
        instructionColor: '#ff6b6b', // Couleur différente par instruction
        onMaskComplete: (maskDataUrl: string) => {
          currentMaskDataUrl = maskDataUrl;

          // Afficher aperçu miniature
          const maskPreview = document.getElementById('maskPreview') as HTMLCanvasElement;
          const ctx = maskPreview.getContext('2d')!;
          const img = new Image();
          img.onload = () => {
            maskPreview.width = 200;
            maskPreview.height = 150;
            ctx.drawImage(img, 0, 0, 200, 150);
            maskPreview.classList.remove('hidden');
          };
          img.src = maskDataUrl;

          document.getElementById('maskStatus')!.classList.remove('hidden');

          // Fermer l'éditeur
          root.unmount();
        },
        onCancel: () => {
          root.unmount();
        }
      })
    );
  });

  // Modifier confirmInstructionBtn pour inclure le masque
  confirmInstructionBtn.addEventListener("click", async () => {
    const location = instructionLocation.value.trim();
    if (!location) {
      alert("Veuillez entrer un emplacement");
      return;
    }

    if (useLibrary) {
      const selected = document.querySelector(
        'input[name="selectedReference"]:checked'
      ) as HTMLInputElement;
      if (!selected) {
        alert("Veuillez sélectionner une référence");
        return;
      }
      instructions.push({
        id: crypto.randomUUID(),
        location,
        referenceId: selected.value,
        referencePath: selected.dataset.path || "",
        referenceName: selected.dataset.name || undefined,
        maskDataUrl: currentMaskDataUrl || undefined, // NOUVEAU
      });
    } else {
      if (!newReferenceFile) {
        alert("Veuillez sélectionner une image");
        return;
      }
      instructions.push({
        id: crypto.randomUUID(),
        location,
        referencePath: URL.createObjectURL(newReferenceFile),
        referenceName: newReferenceName.value.trim() || undefined,
        isNew: true,
        newFile: newReferenceFile,
        maskDataUrl: currentMaskDataUrl || undefined, // NOUVEAU
      });
    }

    // Réinitialiser le masque
    currentMaskDataUrl = null;
    document.getElementById('maskPreview')!.classList.add('hidden');
    document.getElementById('maskStatus')!.classList.add('hidden');

    updateInstructionsList();
    instructionModal.classList.add("hidden");
    instructionModal.classList.remove("flex");
  });

  // Modifier toStep3Btn pour envoyer les masques
  toStep3Btn.addEventListener("click", async () => {
    goToStep(3);
    // ... reste du code existant ...

    try {
      const formData = new FormData();
      formData.append("image", selectedImage!);
      formData.append(
        "instructions",
        JSON.stringify(
          instructions.map((i) => ({
            location: i.location,
            referenceId: i.referenceId,
            referenceName: i.referenceName,
            isNew: i.isNew,
            hasMask: !!i.maskDataUrl, // NOUVEAU
          }))
        )
      );

      // Ajouter les nouvelles références
      instructions.forEach((instr, idx) => {
        if (instr.isNew && instr.newFile) {
          formData.append(`newRef_${idx}`, instr.newFile);
        }
        // NOUVEAU : Ajouter les masques
        if (instr.maskDataUrl) {
          // Convertir dataURL en Blob
          fetch(instr.maskDataUrl)
            .then(res => res.blob())
            .then(blob => {
              formData.append(`mask_${idx}`, blob, `mask_${idx}.png`);
            });
        }
      });

      // ... reste du code existant (fetch API) ...
    } catch (error) {
      // ... gestion erreur ...
    }
  });
</script>
```

---

## 🔧 BACKEND : Support des Masques

### 1. Types TypeScript - `src/lib/gemini.ts`

```typescript
// MODIFIER l'interface existante
export interface GenerationInstruction {
  location: string;
  referenceImagePath: string;
  referenceName?: string;
  modificationType?: ModificationType;
  additionalDetails?: string;

  // NOUVEAU
  maskImagePath?: string; // Chemin S3 du masque PNG
}
```

### 2. Migration Base de Données - `migrations/add_mask_support.sql`

```sql
-- Migration pour ajouter le support des masques
ALTER TABLE instructions ADD COLUMN mask_image_path TEXT;

-- Index pour recherche rapide
CREATE INDEX idx_instructions_mask ON instructions(mask_image_path) WHERE mask_image_path IS NOT NULL;
```

### 3. API Generate Stream - `src/pages/api/generate-stream.ts`

```typescript
// MODIFIER la section de traitement des instructions

// Traiter chaque instruction
for (let i = 0; i < parsedInstructions.length; i++) {
  const instr = parsedInstructions[i];
  let referenceId = instr.referenceId;
  let referencePath = "";
  let referenceName = "";
  let maskPath = ""; // NOUVEAU

  if (instr.isNew) {
    // ... code existant pour nouvelles références ...
  } else {
    // ... code existant pour références existantes ...
  }

  // NOUVEAU : Traiter le masque si présent
  if (instr.hasMask) {
    const maskFile = formData.get(`mask_${i}`) as File;
    if (maskFile) {
      await sendEvent("log", {
        icon: "🎨",
        message: `Masque ${i + 1}: délimitation de zone`,
      });

      // Sauvegarder le masque sur S3
      maskPath = await saveImage(maskFile, userId, "masks");

      await sendEvent("log", {
        icon: "✓",
        message: `Masque ${i + 1} sauvegardé`,
        type: "success",
      });
    }
  }

  if (referenceId && referencePath) {
    // MODIFIER : Ajouter mask_image_path
    createInstruction(generation.id, instr.location, referenceId, maskPath);

    const instruction: GenerationInstruction = {
      location: instr.location,
      referenceImagePath: referencePath,
      referenceName: referenceName,
      maskImagePath: maskPath || undefined, // NOUVEAU
    };

    if (instr.modificationType) {
      instruction.modificationType = instr.modificationType;
    }

    geminiInstructions.push(instruction);
    // ... reste du code ...
  }
}
```

### 4. Fonction `createInstruction` - `src/lib/db.ts`

```typescript
// MODIFIER la fonction existante
export function createInstruction(
  generationId: string,
  location: string,
  referenceId: string,
  maskImagePath?: string // NOUVEAU paramètre optionnel
): Instruction {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO instructions (id, generation_id, location, reference_id, mask_image_path)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, generationId, location, referenceId, maskImagePath || null);
  return {
    id,
    generation_id: generationId,
    location,
    reference_id: referenceId,
  };
}
```

### 5. Génération avec Masques - `src/lib/gemini.ts`

```typescript
// MODIFIER la fonction generateWithNanoBanana

async function generateWithNanoBanana(
  originalImage: { base64: string; mimeType: string },
  referenceImages: { base64: string; mimeType: string }[],
  masks: { base64: string; mimeType: string }[], // NOUVEAU
  prompt: string,
  outputDir: string,
  generationId: string
): Promise<{ imagePath: string; description: string }> {
  console.log("   🎨 Agent Générateur avec masques...");

  // Construire le contenu
  const contents: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: originalImage.mimeType,
        data: originalImage.base64,
      },
    },
  ];

  // Ajouter références + masques
  for (let i = 0; i < referenceImages.length; i++) {
    // Référence
    contents.push({
      inlineData: {
        mimeType: referenceImages[i].mimeType,
        data: referenceImages[i].base64,
      },
    });

    // Masque associé (si présent)
    if (masks[i]) {
      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: masks[i].base64,
        },
      });
      console.log(`   🎨 Masque ${i + 1} ajouté`);
    }
  }

  console.log(
    `   🖼️  ${1 + referenceImages.length} images + ${
      masks.length
    } masques envoyés`
  );

  // Enrichir le prompt avec instructions de masque
  const maskedPrompt = buildPromptWithMasks(prompt, masks.length);

  // Appel API
  const response = await ai.models.generateContent({
    model: MODELS.GENERATOR,
    contents: [{ text: maskedPrompt }, ...contents.slice(1)],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: IMAGE_CONFIG.aspectRatio,
        imageSize: IMAGE_CONFIG.imageSize,
      },
    },
  });

  // ... reste identique ...
}

// NOUVELLE fonction pour enrichir le prompt
function buildPromptWithMasks(basePrompt: string, maskCount: number): string {
  if (maskCount === 0) return basePrompt;

  const maskInstructions = `

## ⚠️ MASQUES DE ZONES (INSTRUCTIONS CRITIQUES)

${maskCount} masque(s) de zone sont fournis avec les références.

**Format des masques** :
- BLANC (#FFFFFF) = zone où appliquer la modification
- NOIR (#000000) = zone à NE PAS modifier

**Ordre des images** :
IMAGE 1 : Image originale
${Array.from(
  { length: maskCount },
  (_, i) =>
    `IMAGE ${2 + i * 2} : Référence ${i + 1}
IMAGE ${3 + i * 2} : Masque ${i + 1} pour la référence ${i + 1}`
).join("\n")}

**RÈGLES ABSOLUES DES MASQUES** :
1. Applique chaque référence UNIQUEMENT dans les zones BLANCHES de son masque
2. Ne modifie JAMAIS les zones NOIRES des masques
3. Respecte les LIMITES PRÉCISES des masques (pas de débordement)
4. Les transitions entre zone modifiée et zone préservée doivent être NATURELLES
5. Si un masque chevauche un objet, coupe proprement l'objet

**Priorité** : Les masques ont la PRIORITÉ ABSOLUE sur les instructions textuelles.`;

  return basePrompt + maskInstructions;
}
```

### 6. Fonction Principale - `src/lib/gemini.ts`

```typescript
// MODIFIER generateBeforeAfterWithProgress

export async function generateBeforeAfterWithProgress(
  originalImagePath: string,
  instructions: GenerationInstruction[],
  outputDir: string,
  generationId: string,
  onProgress: ProgressCallback,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  // ... code existant jusqu'au chargement des images ...

  const originalImage = await prepareImageForAPI(originalImagePath);
  const referenceImages: { base64: string; mimeType: string }[] = [];
  const masks: { base64: string; mimeType: string }[] = []; // NOUVEAU

  for (let i = 0; i < instructions.length; i++) {
    // Référence
    const refImage = await prepareImageForAPI(
      instructions[i].referenceImagePath
    );
    referenceImages.push(refImage);

    // NOUVEAU : Masque
    if (instructions[i].maskImagePath) {
      const maskImage = await prepareImageForAPI(
        instructions[i].maskImagePath!
      );
      masks.push(maskImage);
      log(
        "✓",
        `Masque ${i + 1}: ${(maskImage.base64.length / 1024).toFixed(0)} KB`
      );
    } else {
      // Pas de masque pour cette instruction
      masks.push({ base64: "", mimeType: "" });
    }
  }

  // ... reste du code identique sauf l'appel à generateWithNanoBanana ...

  const result = await generateWithNanoBanana(
    originalImage,
    referenceImages,
    masks, // NOUVEAU
    prompt,
    outputDir,
    generationId
  );

  // ... reste identique ...
}
```

---

## 🧪 TESTS

### Test Unitaire - Génération de Masque

```typescript
// tests/mask-editor.test.ts
import { describe, it, expect } from "vitest";

describe("Mask Editor", () => {
  it("should export valid PNG data URL", () => {
    const mockCanvas = document.createElement("canvas");
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    const ctx = mockCanvas.getContext("2d")!;

    // Dessiner un rectangle blanc sur fond noir
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(100, 100, 200, 150);

    const dataUrl = mockCanvas.toDataURL("image/png");

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl.length).toBeGreaterThan(100);
  });
});
```

### Test d'Intégration - API avec Masques

```typescript
// tests/api-masks.test.ts
import { describe, it, expect } from "vitest";
import { generateBeforeAfterWithProgress } from "../src/lib/gemini";

describe("API Generation with Masks", () => {
  it("should generate with mask constraint", async () => {
    const instructions = [
      {
        location: "mur de gauche",
        referenceImagePath: "references/test-ref.jpg",
        referenceName: "Peinture bleue",
        maskImagePath: "masks/test-mask.png",
      },
    ];

    const result = await generateBeforeAfterWithProgress(
      "originals/test-room.jpg",
      instructions,
      "generated",
      "test-gen-123",
      (event) => console.log(event)
    );

    expect(result.imagePath).toBeDefined();
    expect(result.imagePath).toMatch(/\.png$/);
  }, 180000); // Timeout 3 min
});
```

---

## 📊 MÉTRIQUES & MONITORING

### Ajout de Logs

```typescript
// src/lib/gemini.ts

function logMaskUsage(instructions: GenerationInstruction[]) {
  const withMask = instructions.filter((i) => i.maskImagePath).length;
  const total = instructions.length;

  console.log(`\n📊 Utilisation des masques:`);
  console.log(`   Total instructions: ${total}`);
  console.log(
    `   Avec masque: ${withMask} (${((withMask / total) * 100).toFixed(0)}%)`
  );
  console.log(`   Sans masque: ${total - withMask}`);
}
```

---

## 🚀 CHECKLIST DE DÉPLOIEMENT

### Phase 1 : POC Masques (Semaine 1-2)

- [ ] Installer Fabric.js
- [ ] Créer `ZoneMaskEditor.tsx`
- [ ] Tester export PNG noir/blanc
- [ ] Intégrer dans modal
- [ ] Tests manuels (5 cas)

### Phase 2 : Backend (Semaine 3-4)

- [ ] Migration BDD
- [ ] Modifier `createInstruction()`
- [ ] Modifier API `/api/generate-stream.ts`
- [ ] Modifier `generateWithNanoBanana()`
- [ ] Tests d'intégration

### Phase 3 : Tests Qualité (Semaine 5)

- [ ] 10 générations test avec masques
- [ ] Validation précision des masques
- [ ] Comparaison avec/sans masques
- [ ] Ajustement prompts si nécessaire

### Phase 4 : Déploiement (Semaine 6)

- [ ] Documentation utilisateur
- [ ] Tutoriel vidéo
- [ ] Déploiement staging
- [ ] Déploiement production
- [ ] Monitoring erreurs

---

## 💡 BONNES PRATIQUES

### UX

- ✅ Toujours afficher un aperçu du masque avant validation
- ✅ Permettre l'édition du masque après création
- ✅ Couleurs différentes par instruction (rouge, bleu, vert)
- ✅ Message de confirmation : "Masque validé ✓"

### Performance

- ✅ Compresser les masques PNG (8-bit, pas 24-bit)
- ✅ Limiter la résolution des masques (max 2048x2048)
- ✅ Cache les masques côté client (localStorage)

### Qualité

- ✅ Validation : masque noir/blanc uniquement
- ✅ Validation : dimensions identiques à l'image
- ✅ Alerte si masque trop petit (<5% de l'image)

---

Vous avez maintenant tous les éléments pour implémenter la fonctionnalité de sélection de zones ! 🚀
