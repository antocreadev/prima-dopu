// @refresh reset
import { useState, useEffect, useRef } from "react";
import * as fabric from "fabric";

interface ZoneMaskEditorProps {
  imageUrl: string;
  onSave: (maskDataUrl: string) => void;
  onCancel: () => void;
  referenceImage?: string;
}

type DrawingTool = "brush" | "polygon" | "eraser" | "pan";

export default function ZoneMaskEditor({
  imageUrl,
  onSave,
  onCancel,
  referenceImage,
}: ZoneMaskEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("brush");
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const polygonPointsRef = useRef<{ x: number; y: number }[]>([]);
  const polygonCirclesRef = useRef<fabric.Circle[]>([]);
  const backgroundImageRef = useRef<fabric.FabricImage | null>(null);
  const panningRef = useRef<{
    isDragging: boolean;
    lastX: number;
    lastY: number;
  }>({
    isDragging: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      selection: false,
    });

    canvas.backgroundColor = "#000000";
    fabricCanvasRef.current = canvas;

    // Load the original image
    fabric.FabricImage.fromURL(imageUrl, {
      crossOrigin: "anonymous",
    }).then((img) => {
      if (!img.width || !img.height) return;

      // Calculate canvas dimensions to fit in viewport
      const maxWidth = window.innerWidth - 200;
      const maxHeight = window.innerHeight - 300;

      let scale = 1;
      if (img.width > maxWidth || img.height > maxHeight) {
        const scaleX = maxWidth / img.width;
        const scaleY = maxHeight / img.height;
        scale = Math.min(scaleX, scaleY);
      }

      const canvasWidth = img.width * scale;
      const canvasHeight = img.height * scale;

      canvas.setDimensions({ width: canvasWidth, height: canvasHeight });

      // Configurer l'image de fond avec scale et centrage
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        opacity: 0.6,
        selectable: false,
        evented: false,
      });

      canvas.backgroundImage = img;
      backgroundImageRef.current = img;
      canvas.renderAll();
    });

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  // Nettoyer tous les event handlers
  const clearAllEventHandlers = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");
    canvas.isDrawingMode = false;
  };

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Nettoyer tous les handlers avant de configurer le nouvel outil
    clearAllEventHandlers();

    // Réinitialiser l'état du polygone si on change d'outil
    if (selectedTool !== "polygon") {
      polygonCirclesRef.current.forEach((circle) => canvas.remove(circle));
      polygonCirclesRef.current = [];
      polygonPointsRef.current = [];
      setIsDrawingPolygon(false);
    }

    // Configuration selon l'outil sélectionné
    if (selectedTool === "brush") {
      setupBrushTool();
    } else if (selectedTool === "eraser") {
      setupEraserTool();
    } else if (selectedTool === "polygon") {
      canvas.isDrawingMode = false;
      setIsDrawingPolygon(true);
      setupPolygonTool();
    } else if (selectedTool === "pan") {
      canvas.isDrawingMode = false;
      setupPanTool();
    }
  }, [selectedTool, brushSize]);

  // Gestion du zoom
  const handleZoom = (delta: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newZoom = Math.min(Math.max(zoomLevel + delta, 0.5), 3);
    setZoomLevel(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const setupPanTool = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.on("mouse:down", (opt) => {
      const e = opt.e as MouseEvent;
      panningRef.current.isDragging = true;
      panningRef.current.lastX = e.clientX;
      panningRef.current.lastY = e.clientY;
    });

    canvas.on("mouse:move", (opt) => {
      if (!panningRef.current.isDragging) return;

      const e = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      const deltaX = e.clientX - panningRef.current.lastX;
      const deltaY = e.clientY - panningRef.current.lastY;

      vpt[4] += deltaX;
      vpt[5] += deltaY;

      panningRef.current.lastX = e.clientX;
      panningRef.current.lastY = e.clientY;

      canvas.requestRenderAll();
    });

    canvas.on("mouse:up", () => {
      panningRef.current.isDragging = false;
    });
  };

  const saveHistory = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    setHistory((prev) => [...prev, json]);
  };

  const setupBrushTool = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = "rgba(255, 255, 255, 0.7)";

    // Sauvegarder dans l'historique après chaque dessin
    canvas.on("path:created", () => {
      saveHistory();
    });
  };

  const setupEraserTool = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = false;

    canvas.on("mouse:down", (opt) => {
      const pointer = canvas.getScenePoint(opt.e);
      const objects = canvas.getObjects();

      // Trouver et supprimer les objets blancs sous le curseur
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.containsPoint(pointer)) {
          canvas.remove(obj);
        }
      }
      canvas.renderAll();
      saveHistory();
    });

    canvas.on("mouse:move", (opt) => {
      const e = opt.e as MouseEvent;
      if (e.buttons !== 1) return; // Seulement si bouton souris pressé

      const pointer = canvas.getScenePoint(opt.e);
      const objects = canvas.getObjects();

      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.containsPoint(pointer)) {
          canvas.remove(obj);
        }
      }
      canvas.renderAll();
    });

    canvas.on("mouse:up", () => {
      saveHistory();
    });
  };

  const setupPolygonTool = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let points: { x: number; y: number }[] = [];
    let circles: fabric.Circle[] = [];

    canvas.on("mouse:down", (opt) => {
      const pointer = canvas.getScenePoint(opt.e);

      points.push({ x: pointer.x, y: pointer.y });

      // Ajouter un cercle indicateur
      const circle = new fabric.Circle({
        radius: 5,
        fill: "#00FF00",
        left: pointer.x - 5,
        top: pointer.y - 5,
        selectable: false,
        evented: false,
      });

      canvas.add(circle);
      circles.push(circle);

      // Sauvegarder dans les refs pour finishPolygon
      polygonPointsRef.current = points;
      polygonCirclesRef.current = circles;

      canvas.renderAll();
    });
  };

  const finishPolygon = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || polygonPointsRef.current.length < 3) {
      alert("Vous devez placer au moins 3 points pour créer un polygone");
      return;
    }

    // Créer le polygone rempli
    const polygon = new fabric.Polygon(polygonPointsRef.current, {
      fill: "#FFFFFF",
      opacity: 0.7,
      stroke: "#FFFFFF",
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });

    // Retirer les cercles indicateurs
    polygonCirclesRef.current.forEach((circle) => canvas.remove(circle));
    polygonCirclesRef.current = [];

    canvas.add(polygon);
    canvas.renderAll();

    // Réinitialiser
    polygonPointsRef.current = [];
    setIsDrawingPolygon(false);

    // Sauvegarder dans l'historique
    saveHistory();

    // Retourner au mode pinceau
    setSelectedTool("brush");
  };

  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Retirer tous les objets dessinés (mais garder l'image de fond)
    const objects = canvas.getObjects().slice(); // Copie pour éviter les problèmes d'itération
    objects.forEach((obj) => canvas.remove(obj));

    canvas.renderAll();
    saveHistory();
  };

  const undo = () => {
    if (history.length === 0) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Retirer le dernier état
    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);

    // Charger l'état précédent
    if (newHistory.length > 0) {
      const previousState = newHistory[newHistory.length - 1];
      canvas.loadFromJSON(previousState, () => {
        canvas.renderAll();
      });
    } else {
      // Si plus d'historique, tout effacer
      const objects = canvas.getObjects().slice();
      objects.forEach((obj) => canvas.remove(obj));
      canvas.renderAll();
    }
  };

  const downloadDebugMask = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Sauvegarder l'état actuel
    const bgImage = canvas.backgroundImage;
    const currentZoom = canvas.getZoom();
    const currentVpt = canvas.viewportTransform?.slice();

    // Réinitialiser le zoom et la position pour l'export
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // Retirer temporairement l'image de fond pour exporter seulement le masque
    canvas.backgroundImage = undefined;
    canvas.renderAll();

    // Exporter le masque
    const maskDataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    // Restaurer l'image de fond, le zoom et la position
    canvas.backgroundImage = bgImage;
    canvas.setZoom(currentZoom);
    if (currentVpt && currentVpt.length === 6) {
      canvas.setViewportTransform(
        currentVpt as [number, number, number, number, number, number]
      );
    }
    canvas.renderAll();

    // Télécharger le masque
    const link = document.createElement("a");
    link.download = "mask-debug.png";
    link.href = maskDataUrl;
    link.click();
  };

  const handleSave = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Sauvegarder l'état actuel
    const bgImage = canvas.backgroundImage;
    const currentZoom = canvas.getZoom();
    const currentVpt = canvas.viewportTransform?.slice();

    // Réinitialiser le zoom et la position pour l'export
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // Retirer temporairement l'image de fond pour exporter seulement le masque
    canvas.backgroundImage = undefined;
    canvas.renderAll();

    // Exporter le masque (blanc sur noir)
    const maskDataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    // Restaurer l'image de fond, le zoom et la position
    canvas.backgroundImage = bgImage;
    canvas.setZoom(currentZoom);
    if (currentVpt && currentVpt.length === 6) {
      canvas.setViewportTransform(
        currentVpt as [number, number, number, number, number, number]
      );
    }
    canvas.renderAll();

    onSave(maskDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-[95vw] w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Délimiter la zone de modification
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Dessinez en blanc la zone où appliquer la référence
            </p>
          </div>
          {referenceImage && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Référence :</span>
              <img
                src={referenceImage}
                alt="Référence"
                className="h-16 w-16 object-cover rounded border"
              />
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-4 p-4 bg-gray-100 rounded-lg flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Outils :</span>
            <button
              onClick={() => setSelectedTool("brush")}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                selectedTool === "brush"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-200"
              }`}
            >
              🖌️ Pinceau
            </button>
            <button
              onClick={() => setSelectedTool("polygon")}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                selectedTool === "polygon"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⬡ Polygone
            </button>
            <button
              onClick={() => setSelectedTool("eraser")}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                selectedTool === "eraser"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-200"
              }`}
              title="Effacer les zones blanches dessinées"
            >
              🧹 Gomme
            </button>
            <button
              onClick={() => setSelectedTool("pan")}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                selectedTool === "pan"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-200"
              }`}
              title="Déplacer la vue"
            >
              ✋ Déplacer
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="px-3 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Retour en arrière"
            >
              ↶ Annuler
            </button>
            <button
              onClick={downloadDebugMask}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
              title="Télécharger le masque pour debug"
            >
              🐛 Debug
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Zoom :</span>
            <button
              onClick={() => handleZoom(-0.25)}
              className="px-3 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
              disabled={zoomLevel <= 0.5}
            >
              ➖
            </button>
            <span className="text-sm text-gray-600 min-w-15 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.25)}
              className="px-3 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
              disabled={zoomLevel >= 3}
            >
              ➕
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Taille :</span>
            <input
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-32"
              disabled={selectedTool === "polygon" || selectedTool === "pan"}
            />
            <span className="text-sm text-gray-600">{brushSize}px</span>
          </div>

          {isDrawingPolygon && (
            <button
              onClick={finishPolygon}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              ✓ Terminer polygone ({polygonPointsRef.current.length} points)
            </button>
          )}

          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors ml-auto"
          >
            🗑️ Effacer tout
          </button>
        </div>

        {/* Canvas Container */}
        <div className="flex items-center justify-center bg-gray-900 rounded-lg p-4 mb-4 overflow-auto max-h-[60vh]">
          <canvas ref={canvasRef} className="border border-gray-700 rounded" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            💡 Astuce : Les zones en blanc seront modifiées, le noir sera
            préservé
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Valider le masque
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
