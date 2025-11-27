import { useEffect, useState } from "react";
// @ts-ignore - bwip-js doesn't have TypeScript declarations
import bwipjs from "bwip-js";

interface BarcodeCache {
  [key: string]: HTMLCanvasElement;
}

const barcodeCache: BarcodeCache = {};
let isPreloading = false;

export function useBarcodePreload(eanCodes: string[]) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isPreloading || eanCodes.length === 0) return;

    const preloadBarcodes = async () => {
      isPreloading = true;

      // Précharger tous les codes-barres en parallèle
      const promises = eanCodes.map(async (eanCode) => {
        if (!eanCode || barcodeCache[eanCode]) return;

        try {
          // Formatter le code
          let formattedCode = eanCode.replace(/\D/g, '');
          
          if (formattedCode.length < 12) {
            formattedCode = formattedCode.padStart(12, '0');
          } else if (formattedCode.length > 12) {
            formattedCode = formattedCode.substring(0, 12);
          }

          // Créer un canvas temporaire
          const canvas = document.createElement('canvas');
          
          // Générer le code-barre
          await bwipjs.toCanvas(canvas, {
            bcid: 'ean13',
            text: formattedCode,
            scale: 1,
            height: 6,
            includetext: true,
            textxalign: 'center',
            backgroundcolor: 'ffffff',
          });

          // Stocker dans le cache
          barcodeCache[eanCode] = canvas;
        } catch (error) {
          console.error(`Erreur préchargement code-barre ${eanCode}:`, error);
        }
      });

      await Promise.all(promises);
      setLoaded(true);
      isPreloading = false;
    };

    // Démarrer le préchargement après un court délai pour ne pas bloquer le rendu initial
    const timer = setTimeout(preloadBarcodes, 100);
    return () => clearTimeout(timer);
  }, [eanCodes]);

  return { loaded, cache: barcodeCache };
}

export function getBarcodeFromCache(eanCode: string): HTMLCanvasElement | null {
  return barcodeCache[eanCode] || null;
}

export function clearBarcodeCache() {
  Object.keys(barcodeCache).forEach(key => delete barcodeCache[key]);
}
