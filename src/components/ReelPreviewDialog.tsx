import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ReelViewer } from "./ReelViewer";
import { Store } from "@/hooks/use-stores";
import { Promotion } from "@/hooks/use-promotions";

interface ReelPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store | null;
  promotion: Promotion;
}

export function ReelPreviewDialog({
  open,
  onOpenChange,
  store,
  promotion,
}: ReelPreviewDialogProps) {
  // Create a mock store if not provided
  const mockStore: Store = store || {
    id: "preview",
    organization_id: promotion.organization_id,
    name: "Aperçu",
    description: null,
    logo_url: null,
    cover_image_url: null,
    address_line1: null,
    address_line2: null,
    postal_code: null,
    city: null,
    country: null,
    phone: null,
    email: null,
    website_url: null,
    google_maps_url: null,
    opening_hours: null,
    qr_code_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-screen p-0 border-0">
        <DialogTitle className="sr-only">Aperçu de la promotion</DialogTitle>
        <ReelViewer 
          store={mockStore} 
          promotions={[promotion]} 
          previewMode={true}
        />
      </DialogContent>
    </Dialog>
  );
}
