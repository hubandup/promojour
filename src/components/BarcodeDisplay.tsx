import { useEffect, useRef, useState } from "react";

// @ts-ignore - bwip-js doesn't have TypeScript declarations
import bwipjs from "bwip-js";

interface BarcodeDisplayProps {
  eanCode: string;
  size?: "small" | "medium" | "large";
  showText?: boolean;
}

export function BarcodeDisplay({ eanCode, size = "medium", showText = true }: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const sizeConfig = {
    small: { scale: 1, height: 6 },
    medium: { scale: 2, height: 8 },
    large: { scale: 3, height: 10 },
  };

  // Observer pour détecter quand le canvas est visible
  useEffect(() => {
    if (!canvasRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(canvasRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !canvasRef.current || !eanCode) return;

    // Petit délai pour s'assurer que le canvas est complètement rendu
    const timer = setTimeout(() => {
      if (!canvasRef.current) return;

      try {
        // Format to 12 digits for EAN13
        let formattedCode = eanCode.replace(/\D/g, '');
        
        if (formattedCode.length < 12) {
          formattedCode = formattedCode.padStart(12, '0');
        } else if (formattedCode.length > 12) {
          formattedCode = formattedCode.substring(0, 12);
        }

        const config = sizeConfig[size];

        // Use bwip-js for mobile-compatible barcode generation
        bwipjs.toCanvas(canvasRef.current, {
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
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible, eanCode, size, showText]);

  if (!eanCode) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas ref={canvasRef} className="max-w-full" />
      {showText && (
        <p className="text-xs text-muted-foreground">
          Code-barres : {eanCode}
        </p>
      )}
    </div>
  );
}
