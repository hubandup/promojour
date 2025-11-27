import { useEffect, useState, useCallback } from "react";
// @ts-ignore - bwip-js doesn't have TypeScript declarations
import bwipjs from "bwip-js";

interface BarcodeCache {
  [key: string]: HTMLCanvasElement;
}

const barcodeCache: BarcodeCache = {};
const generationQueue = new Set<string>();

export function useBarcodePreload(eanCodes: string[]) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const generateBarcode = useCallback(async (eanCode: string) => {
    if (!eanCode || barcodeCache[eanCode] || generationQueue.has(eanCode)) return;

    generationQueue.add(eanCode);

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
      setLoaded(prev => new Set(prev).add(eanCode));
    } catch (error) {
      console.error(`Erreur génération code-barre ${eanCode}:`, error);
    } finally {
      generationQueue.delete(eanCode);
    }
  }, []);

  // Précharger uniquement les 5 premiers codes-barres au montage
  useEffect(() => {
    const initialCodes = eanCodes.slice(0, 5);
    
    const preloadInitial = async () => {
      for (const code of initialCodes) {
        await generateBarcode(code);
        // Petit délai entre chaque génération pour ne pas bloquer l'UI
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    preloadInitial();
  }, [eanCodes, generateBarcode]);

  return { 
    loaded: loaded.size,
    total: eanCodes.length,
    generateBarcode,
    cache: barcodeCache 
  };
}

export function getBarcodeFromCache(eanCode: string): HTMLCanvasElement | null {
  return barcodeCache[eanCode] || null;
}

export function clearBarcodeCache() {
  Object.keys(barcodeCache).forEach(key => delete barcodeCache[key]);
}
