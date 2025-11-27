import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      try {
        // Format to 12 digits - JsBarcode will calculate the 13th check digit
        let formattedCode = eanCode.replace(/\D/g, ''); // Remove non-digits
        
        if (formattedCode.length < 12) {
          formattedCode = formattedCode.padEnd(12, '0');
        } else if (formattedCode.length > 12) {
          formattedCode = formattedCode.substring(0, 12);
        }

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
        </DialogHeader>
        <p className="sr-only">Dialogue affichant le code-barre EAN du bon de réduction</p>
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
