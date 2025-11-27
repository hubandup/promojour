import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useRef } from "react";
import Barcode from "react-barcode";

interface BarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eanCode: string;
  promotionTitle: string;
}

export function BarcodeDialog({ open, onOpenChange, eanCode, promotionTitle }: BarcodeDialogProps) {
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
          <div className="bg-white p-4 rounded-lg">
            <Barcode 
              value={eanCode} 
              format="EAN13"
              width={2}
              height={80}
              displayValue={true}
              fontSize={14}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Présentez ce code-barre en caisse
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
