import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface BulkImportPromotionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  organizationId: string;
}

interface PromotionRow {
  title: string;
  description?: string;
  category?: string;
  start_date: string;
  end_date: string;
  status?: string;
  original_price?: string;
  discounted_price?: string;
  discount_percentage?: string;
  image_url?: string;
  video_url?: string;
}

export function BulkImportPromotionsDialog({
  open,
  onOpenChange,
  onImportComplete,
  organizationId,
}: BulkImportPromotionsDialogProps) {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/exemple-import-promotions.csv";
    link.download = "exemple-import-promotions.csv";
    link.click();
    
    toast({
      title: "Téléchargement",
      description: "Le fichier exemple a été téléchargé",
    });
  };

  const parseCSV = (file: File): Promise<PromotionRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data as PromotionRow[]);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  };

  const parseExcel = (file: File): Promise<PromotionRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as PromotionRow[];
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      let rows: PromotionRow[];

      if (file.name.endsWith(".csv")) {
        rows = await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        rows = await parseExcel(file);
      } else {
        throw new Error("Format de fichier non supporté. Utilisez CSV ou Excel.");
      }

      if (rows.length === 0) {
        throw new Error("Le fichier est vide");
      }

      // Validate and prepare data
      const promotionsToInsert = rows
        .filter((row) => row.title && row.start_date && row.end_date)
        .map((row) => {
          const attributes: any = {};
          
          if (row.original_price) {
            attributes.original_price = parseFloat(row.original_price);
          }
          if (row.discounted_price) {
            attributes.discounted_price = parseFloat(row.discounted_price);
          }
          if (row.discount_percentage) {
            attributes.discount_percentage = parseFloat(row.discount_percentage);
          }

          return {
            organization_id: organizationId,
            title: row.title,
            description: row.description || null,
            category: row.category || null,
            start_date: row.start_date,
            end_date: row.end_date,
            status: (row.status as any) || "draft",
            image_url: row.image_url || null,
            video_url: row.video_url || null,
            attributes: Object.keys(attributes).length > 0 ? attributes : null,
          };
        });

      if (promotionsToInsert.length === 0) {
        throw new Error("Aucune promotion valide trouvée dans le fichier");
      }

      // Insert into database
      const { error } = await supabase
        .from("promotions")
        .insert(promotionsToInsert);

      if (error) throw error;

      toast({
        title: "Import réussi",
        description: `${promotionsToInsert.length} promotion(s) importée(s) avec succès`,
      });

      onImportComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error importing promotions:", error);
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : "Impossible d'importer les promotions",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import en masse de promotions</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Format accepté</p>
                <p className="text-sm text-muted-foreground">
                  Fichiers CSV ou Excel (.xlsx, .xls) avec les colonnes suivantes :
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
                  <li>• title (requis)</li>
                  <li>• start_date et end_date (requis, format YYYY-MM-DD)</li>
                  <li>• description, category, status</li>
                  <li>• original_price, discounted_price, discount_percentage</li>
                  <li>• image_url, video_url</li>
                </ul>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger le fichier exemple
            </Button>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="bulk-upload"
              className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {importing ? "Import en cours..." : "Cliquez pour sélectionner un fichier"}
                </span>
                <span className="text-xs text-muted-foreground">CSV ou Excel</span>
              </div>
              <input
                id="bulk-upload"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
