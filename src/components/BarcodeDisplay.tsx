import { useEffect, useRef, useState } from "react";
import { getBarcodeFromCache } from "@/hooks/use-barcode-preload";
import { Skeleton } from "@/components/ui/skeleton";

// @ts-ignore - bwip-js doesn't have TypeScript declarations
import bwipjs from "bwip-js";

interface BarcodeDisplayProps {
  eanCode: string;
  size?: "small" | "medium" | "large";
  showText?: boolean;
  onGenerate?: (eanCode: string) => void;
}

export function BarcodeDisplay({ eanCode, size = "medium", showText = true, onGenerate }: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const sizeConfig = {
    small: { scale: 1, height: 6 },
    medium: { scale: 2, height: 8 },
    large: { scale: 3, height: 10 },
  };

  // Observer pour détecter quand le canvas est visible dans le viewport
  useEffect(() => {
    if (!canvasRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // Informer le parent que ce code-barre est devenu visible
          if (onGenerate) {
            onGenerate(eanCode);
          }
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Précharger 100px avant que l'élément soit visible
      }
    );

    observer.observe(canvasRef.current);

    return () => observer.disconnect();
  }, [eanCode, onGenerate]);

  useEffect(() => {
    if (!isVisible || !canvasRef.current || !eanCode || isGenerating) return;

    const generateBarcode = async () => {
      if (!canvasRef.current) return;

      setIsGenerating(true);

      // Vérifier d'abord le cache
      const cachedCanvas = getBarcodeFromCache(eanCode);
      if (cachedCanvas) {
        // Copier le canvas mis en cache
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = cachedCanvas.width;
          canvasRef.current.height = cachedCanvas.height;
          ctx.drawImage(cachedCanvas, 0, 0);
        }
        setIsGenerating(false);
        return;
      }

      // Sinon, générer le code-barre
      try {
        let formattedCode = eanCode.replace(/\D/g, '');
        
        if (formattedCode.length < 12) {
          formattedCode = formattedCode.padStart(12, '0');
        } else if (formattedCode.length > 12) {
          formattedCode = formattedCode.substring(0, 12);
        }

        const config = sizeConfig[size];

        await bwipjs.toCanvas(canvasRef.current, {
          bcid: 'ean13',
          text: formattedCode,
          scale: config.scale,
          height: config.height,
          includetext: showText,
          textxalign: 'center',
          backgroundcolor: 'ffffff',
        });
      } catch (error) {
        console.error("Erreur lors de la génération du code-barre:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateBarcode();
  }, [isVisible, eanCode, size, showText, isGenerating]);

  if (!eanCode) return null;

  const sizeMap = {
    small: { width: 150, height: 60 },
    medium: { width: 200, height: 80 },
    large: { width: 300, height: 100 },
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {isGenerating ? (
        <Skeleton 
          className="rounded-md" 
          style={{ 
            width: `${sizeMap[size].width}px`, 
            height: `${sizeMap[size].height}px` 
          }} 
        />
      ) : (
        <canvas ref={canvasRef} className="max-w-full" />
      )}
      {showText && (
        <p className="text-xs text-muted-foreground">
          Code-barres : {eanCode}
        </p>
      )}
    </div>
  );
}
