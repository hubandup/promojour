import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

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
      console.log("Génération du code-barre avec EAN:", eanCode);
      try {
        // Format to 12 digits - JsBarcode will calculate the 13th check digit
        let formattedCode = eanCode.replace(/\D/g, ''); // Remove non-digits
        console.log("Code formaté:", formattedCode);
        
        if (formattedCode.length < 12) {
          formattedCode = formattedCode.padStart(12, '0');
        } else if (formattedCode.length > 12) {
          formattedCode = formattedCode.substring(0, 12);
        }

        console.log("Code final pour JsBarcode (12 chiffres):", formattedCode);

        // Use Canvas instead of SVG for better iOS Safari compatibility
        JsBarcode(barcodeRef.current, formattedCode, {
          format: "EAN13",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          background: "#ffffff",
          lineColor: "#000000",
          margin: 10
        });
        
        console.log("Code-barre généré avec succès");
      } catch (error) {
        console.error("Erreur lors de la génération du code-barre:", error);
      }
    } else {
      console.log("Conditions non remplies - open:", open, "canvas:", !!barcodeRef.current, "eanCode:", eanCode);
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
            <canvas ref={barcodeRef} width="250" height="100"></canvas>
          </div>
          <p className="text-xs text-muted-foreground">
            Présentez ce code-barre en caisse
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
