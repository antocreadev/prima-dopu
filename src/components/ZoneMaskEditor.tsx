// @refresh reset
import { useState, useEffect, useRef } from "react";
import * as fabric from "fabric";
import {
  Paintbrush,
  Pentagon,
  Eraser,
  Hand,
  Undo2,
  ZoomIn,
  ZoomOut,
  Trash2,
  Check,
  X,
} from "lucide-react";

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
  const originalImageSizeRef = useRef<{
    width: number;
    height: number;
    scale: number;
  }>({
    width: 0,
    height: 0,
    scale: 1,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas with touch support
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      selection: false,
      allowTouchScrolling: false, // Empêcher le scroll par défaut sur touch
    });

    canvas.backgroundColor = "#000000";
    fabricCanvasRef.current = canvas;

    // Empêcher le scroll de la page quand on touche le canvas
    const canvasElement = canvasRef.current;
    const upperCanvas = canvas.upperCanvasEl;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    if (upperCanvas) {
      upperCanvas.addEventListener("touchstart", preventScroll, {
        passive: false,
      });
      upperCanvas.addEventListener("touchmove", preventScroll, {
        passive: false,
      });
    }

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

      // Stocker les dimensions originales pour l'export
      originalImageSizeRef.current = {
        width: img.width,
        height: img.height,
        scale: scale,
      };

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
      // Retirer les event listeners touch
      if (upperCanvas) {
        upperCanvas.removeEventListener("touchstart", preventScroll);
        upperCanvas.removeEventListener("touchmove", preventScroll);
      }
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

    // Helper pour obtenir les coordonnées (souris ou touch)
    const getClientCoords = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if ("changedTouches" in e && e.changedTouches.length > 0) {
        return {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY,
        };
      }
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    };

    canvas.on("mouse:down", (opt) => {
      const coords = getClientCoords(opt.e as MouseEvent | TouchEvent);
      panningRef.current.isDragging = true;
      panningRef.current.lastX = coords.x;
      panningRef.current.lastY = coords.y;
    });

    canvas.on("mouse:move", (opt) => {
      if (!panningRef.current.isDragging) return;

      const coords = getClientCoords(opt.e as MouseEvent | TouchEvent);
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      const deltaX = coords.x - panningRef.current.lastX;
      const deltaY = coords.y - panningRef.current.lastY;

      vpt[4] += deltaX;
      vpt[5] += deltaY;

      panningRef.current.lastX = coords.x;
      panningRef.current.lastY = coords.y;

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

  // Fonction pour normaliser le masque en noir/blanc pur (pas de gris)
  const normalizeMask = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext("2d")!;

        // Dessiner l'image
        ctx.drawImage(img, 0, 0);

        // Récupérer les pixels
        const imageData = ctx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        const data = imageData.data;

        // Convertir chaque pixel en noir ou blanc pur
        // Si la luminosité > 10, c'est blanc, sinon noir
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminosity = (r + g + b) / 3;

          if (luminosity > 10) {
            // Blanc pur
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255;
          } else {
            // Noir pur
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(tempCanvas.toDataURL("image/png"));
      };
      img.src = dataUrl;
    });
  };

  const downloadDebugMask = async () => {
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

    // Calculer le multiplier pour exporter à la taille originale de l'image
    const { scale } = originalImageSizeRef.current;
    const exportMultiplier = scale > 0 ? 1 / scale : 1;

    // Exporter le masque brut à la taille originale de l'image
    const rawMaskDataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: exportMultiplier,
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

    // Normaliser le masque en noir/blanc pur
    const maskDataUrl = await normalizeMask(rawMaskDataUrl);

    // Télécharger le masque
    const link = document.createElement("a");
    link.download = "mask-debug.png";
    link.href = maskDataUrl;
    link.click();
  };

  const downloadMaskedPreview = async () => {
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

    // Calculer le multiplier pour exporter à la taille originale de l'image
    const { scale } = originalImageSizeRef.current;
    const exportMultiplier = scale > 0 ? 1 / scale : 1;

    // Exporter le masque (blanc sur noir) à la taille originale de l'image
    const rawMaskDataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: exportMultiplier,
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

    // Normaliser le masque en noir/blanc pur
    const maskDataUrl = await normalizeMask(rawMaskDataUrl);

    // Appeler l'API pour appliquer le masque
    try {
      // Convertir le dataURL du masque en blob
      const maskBlob = await fetch(maskDataUrl).then((r) => r.blob());

      // Récupérer l'image originale
      const imageBlob = await fetch(imageUrl).then((r) => r.blob());

      const formData = new FormData();
      formData.append("image", imageBlob, "image.png");
      formData.append("mask", maskBlob, "mask.png");

      const response = await fetch("/api/apply-mask", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur API");
      }

      const resultBlob = await response.blob();
      const resultUrl = URL.createObjectURL(resultBlob);

      // Télécharger le résultat
      const link = document.createElement("a");
      link.download = "masked-preview.png";
      link.href = resultUrl;
      link.click();

      URL.revokeObjectURL(resultUrl);
    } catch (error) {
      console.error("Erreur lors de l'application du masque:", error);
      alert("Erreur lors de l'application du masque");
    }
  };

  const handleSave = async () => {
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

    // Calculer le multiplier pour exporter à la taille originale de l'image
    const { scale } = originalImageSizeRef.current;
    const exportMultiplier = scale > 0 ? 1 / scale : 1;

    // Exporter le masque brut à la taille originale de l'image
    const rawMaskDataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: exportMultiplier,
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

    // Normaliser le masque en noir/blanc pur avant de sauvegarder
    const normalizedMaskDataUrl = await normalizeMask(rawMaskDataUrl);
    onSave(normalizedMaskDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 max-w-[98vw] sm:max-w-[95vw] w-full max-h-[98vh] sm:max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
              Délimiter la zone
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Dessinez en blanc la zone à modifier
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 mb-4 p-3 sm:p-4 bg-gray-100 rounded-lg">
          {/* Ligne 1: Outils principaux */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSelectedTool("brush")}
                className={`p-2 sm:px-3 sm:py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 ${
                  selectedTool === "brush"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
                title="Pinceau"
              >
                <Paintbrush className="w-4 h-4" />
                <span className="hidden sm:inline">Pinceau</span>
              </button>
              <button
                onClick={() => setSelectedTool("polygon")}
                className={`p-2 sm:px-3 sm:py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 ${
                  selectedTool === "polygon"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
                title="Polygone"
              >
                <Pentagon className="w-4 h-4" />
                <span className="hidden sm:inline">Polygone</span>
              </button>
              <button
                onClick={() => setSelectedTool("eraser")}
                className={`p-2 sm:px-3 sm:py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 ${
                  selectedTool === "eraser"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
                title="Gomme - Effacer les zones blanches"
              >
                <Eraser className="w-4 h-4" />
                <span className="hidden sm:inline">Gomme</span>
              </button>
              <button
                onClick={() => setSelectedTool("pan")}
                className={`p-2 sm:px-3 sm:py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 ${
                  selectedTool === "pan"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
                title="Déplacer la vue"
              >
                <Hand className="w-4 h-4" />
                <span className="hidden sm:inline">Déplacer</span>
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={undo}
                disabled={history.length === 0}
                className="p-2 sm:px-3 sm:py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Annuler"
              >
                <Undo2 className="w-4 h-4" />
                <span className="hidden sm:inline">Annuler</span>
              </button>
              <button
                onClick={clearCanvas}
                className="p-2 sm:px-3 sm:py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm flex items-center gap-1.5"
                title="Effacer tout"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Effacer</span>
              </button>
            </div>
          </div>

          {/* Ligne 2: Contrôles secondaires */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Zoom */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">
                Zoom :
              </span>
              <button
                onClick={() => handleZoom(-0.25)}
                className="p-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                disabled={zoomLevel <= 0.5}
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs sm:text-sm text-gray-600 min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.25)}
                className="p-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                disabled={zoomLevel >= 3}
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Taille du pinceau */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Taille :
              </span>
              <input
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-20 sm:w-32"
                disabled={selectedTool === "polygon" || selectedTool === "pan"}
              />
              <span className="text-xs sm:text-sm text-gray-600 min-w-[2.5rem]">
                {brushSize}px
              </span>
            </div>

            {/* Terminer polygone - affiché seulement si en mode polygone */}
            {isDrawingPolygon && (
              <button
                onClick={finishPolygon}
                className="px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terminer le polygone</span>
              </button>
            )}
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex items-center justify-center bg-gray-900 rounded-lg p-2 sm:p-4 mb-4 overflow-auto max-h-[50vh] sm:max-h-[60vh]">
          <canvas ref={canvasRef} className="border border-gray-700 rounded" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Valider</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
