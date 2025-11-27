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
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    console.log('[BarcodeDialog] Dialog open:', open);
    console.log('[BarcodeDialog] EAN Code:', eanCode);
    console.log('[BarcodeDialog] Ref:', barcodeRef.current);
    
    if (open && barcodeRef.current && eanCode) {
      try {
        // Pad or truncate to 13 digits for EAN13
        let formattedCode = eanCode.replace(/\D/g, ''); // Remove non-digits
        
        console.log('[BarcodeDialog] Original code:', eanCode);
        console.log('[BarcodeDialog] Formatted code:', formattedCode);
        
        if (formattedCode.length < 13) {
          // Pad with zeros to reach 13 digits
          formattedCode = formattedCode.padStart(13, '0');
        } else if (formattedCode.length > 13) {
          // Truncate to 13 digits
          formattedCode = formattedCode.substring(0, 13);
        }

        console.log('[BarcodeDialog] Final code for EAN13:', formattedCode);

        JsBarcode(barcodeRef.current, formattedCode, {
          format: "EAN13",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          background: "#ffffff",
          lineColor: "#000000"
        });
        
        console.log('[BarcodeDialog] Barcode generated successfully');
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
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
          <p className="text-sm text-muted-foreground text-center">
            {promotionTitle}
          </p>
          <div className="bg-white p-4 rounded-lg border">
            <svg ref={barcodeRef}></svg>
          </div>
          <p className="text-xs text-muted-foreground">
            Présentez ce code-barre en caisse
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
