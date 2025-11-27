import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useRef } from "react";

// @ts-ignore - bwip-js doesn't have TypeScript declarations
import bwipjs from "bwip-js";

interface BarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eanCode: string;
  promotionTitle: string;
}

export function BarcodeDialog({ open, onOpenChange, eanCode, promotionTitle }: BarcodeDialogProps) {
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && barcodeRef.current && eanCode) {
      try {
        // Format to 12 digits for EAN13
        let formattedCode = eanCode.replace(/\D/g, '');
        
        if (formattedCode.length < 12) {
          formattedCode = formattedCode.padStart(12, '0');
        } else if (formattedCode.length > 12) {
          formattedCode = formattedCode.substring(0, 12);
        }

        // Use bwip-js for better mobile compatibility
        bwipjs.toCanvas(barcodeRef.current, {
          bcid: 'ean13',
          text: formattedCode,
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
          backgroundcolor: 'ffffff',
        });
        
        console.log("Code-barre généré avec succès");
      } catch (error) {
        console.error("Erreur lors de la génération du code-barre:", error);
      }
    }
  }, [open, eanCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Code-barre de réduction</DialogTitle>
          <DialogDescription className="sr-only">
            Dialogue affichant le code-barre EAN du bon de réduction
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
          <p className="text-sm text-muted-foreground text-center">
            {promotionTitle}
          </p>
          <div className="bg-white p-4 rounded-lg border">
            <canvas ref={barcodeRef}></canvas>
          </div>
          <p className="text-xs text-muted-foreground">
            Présentez ce code-barre en caisse
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
