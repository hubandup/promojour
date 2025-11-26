import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStores } from "@/hooks/use-stores";
import { useUserData } from "@/hooks/use-user-data";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCampaignDialog({ open, onOpenChange, onSuccess }: CreateCampaignDialogProps) {
  const { toast } = useToast();
  const { stores } = useStores();
  const { organization } = useUserData();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dailyPromotionCount, setDailyPromotionCount] = useState("3");
  const [randomOrder, setRandomOrder] = useState(true);
  const [canvaTemplateUrl, setCanvaTemplateUrl] = useState("");
  const [storeId, setStoreId] = useState<string>("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !startDate || !endDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("campaigns").insert({
        organization_id: organization.id,
        store_id: storeId === "all" ? null : storeId,
        name,
        description: description || null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        daily_promotion_count: parseInt(dailyPromotionCount),
        random_order: randomOrder,
        canva_template_url: canvaTemplateUrl || null,
        status: "draft",
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Campagne créée avec succès",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setName("");
      setDescription("");
      setStartDate(undefined);
      setEndDate(undefined);
      setDailyPromotionCount("3");
      setRandomOrder(true);
      setCanvaTemplateUrl("");
      setStoreId("all");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la campagne",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle campagne</DialogTitle>
          <DialogDescription>
            Planifiez la diffusion automatique de vos promotions sur une période définie
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la campagne *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Soldes d'Hiver 2025"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre campagne..."
              rows={3}
            />
          </div>

          {/* Portée de la campagne */}
          <div className="space-y-2">
            <Label htmlFor="store">Portée de la campagne *</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez la portée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute l'organisation</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {storeId === "all" 
                ? "La campagne s'appliquera à tous vos magasins" 
                : "La campagne s'appliquera uniquement au magasin sélectionné"}
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 h-4" />
                    {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Nombre de promotions par jour */}
          <div className="space-y-2">
            <Label htmlFor="dailyCount">Nombre de promotions par jour</Label>
            <Input
              id="dailyCount"
              type="number"
              min="1"
              max="10"
              value={dailyPromotionCount}
              onChange={(e) => setDailyPromotionCount(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Nombre de promotions à publier automatiquement chaque jour
            </p>
          </div>

          {/* Ordre aléatoire */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Distribution aléatoire</Label>
              <p className="text-sm text-muted-foreground">
                Les promotions seront publiées dans un ordre aléatoire
              </p>
            </div>
            <Switch
              checked={randomOrder}
              onCheckedChange={setRandomOrder}
            />
          </div>

          {/* Template Canva */}
          <div className="space-y-2">
            <Label htmlFor="canva">URL du template Canva (optionnel)</Label>
            <Input
              id="canva"
              type="url"
              value={canvaTemplateUrl}
              onChange={(e) => setCanvaTemplateUrl(e.target.value)}
              placeholder="https://www.canva.com/..."
            />
            <p className="text-sm text-muted-foreground">
              Template pour harmoniser le design de vos visuels
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="gradient-primary text-white shadow-glow"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer la campagne"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
