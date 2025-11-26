import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStores } from "@/hooks/use-stores";
import { usePromotions } from "@/hooks/use-promotions";

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  daily_promotion_count: number;
  random_order: boolean;
  store_id: string | null;
}

interface EditCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  campaign: Campaign | null;
}

export function EditCampaignDialog({ open, onOpenChange, onSuccess, campaign }: EditCampaignDialogProps) {
  const { toast } = useToast();
  const { stores } = useStores();
  const { promotions, loading: promotionsLoading } = usePromotions();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dailyPromotionCount, setDailyPromotionCount] = useState("3");
  const [randomOrder, setRandomOrder] = useState(true);
  const [allOrganization, setAllOrganization] = useState(true);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedPromotionIds, setSelectedPromotionIds] = useState<string[]>([]);

  useEffect(() => {
    if (campaign && open) {
      setName(campaign.name);
      setStartDate(new Date(campaign.start_date));
      setEndDate(new Date(campaign.end_date));
      setDailyPromotionCount(campaign.daily_promotion_count?.toString() || "3");
      setRandomOrder(campaign.random_order ?? true);
      setAllOrganization(!campaign.store_id);
      setSelectedStoreIds(campaign.store_id ? [campaign.store_id] : []);
      
      // Charger les promotions associées
      loadCampaignPromotions();
    }
  }, [campaign, open]);

  const loadCampaignPromotions = async () => {
    if (!campaign) return;
    
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('id')
        .eq('campaign_id', campaign.id);

      if (error) throw error;
      setSelectedPromotionIds(data?.map(p => p.id) || []);
    } catch (error) {
      console.error("Error loading campaign promotions:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaign || !name || !startDate || !endDate) {
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
      // Mettre à jour la campagne
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({
          name,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          daily_promotion_count: parseInt(dailyPromotionCount),
          random_order: randomOrder,
          store_id: allOrganization ? null : (selectedStoreIds[0] || null),
        })
        .eq('id', campaign.id);

      if (updateError) throw updateError;

      // Désassocier toutes les anciennes promotions
      await supabase
        .from('promotions')
        .update({ campaign_id: null })
        .eq('campaign_id', campaign.id);

      // Associer les nouvelles promotions sélectionnées
      if (selectedPromotionIds.length > 0) {
        await supabase
          .from('promotions')
          .update({ campaign_id: campaign.id })
          .in('id', selectedPromotionIds);
      }

      toast({
        title: "Succès",
        description: "Campagne modifiée avec succès",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la campagne",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la campagne</DialogTitle>
          <DialogDescription>
            Modifiez les paramètres de votre campagne et sélectionnez les promotions à diffuser
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

          {/* Portée de la campagne */}
          <div className="space-y-3">
            <Label>Portée de la campagne *</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-org"
                checked={allOrganization}
                onCheckedChange={(checked) => {
                  setAllOrganization(checked as boolean);
                  if (checked) setSelectedStoreIds([]);
                }}
              />
              <label
                htmlFor="all-org"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Toute l'organisation
              </label>
            </div>

            {stores.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pl-6">
                {stores.map((store) => (
                  <div key={store.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={store.id}
                      checked={!allOrganization && selectedStoreIds.includes(store.id)}
                      disabled={allOrganization}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAllOrganization(false);
                          setSelectedStoreIds([...selectedStoreIds, store.id]);
                        } else {
                          setSelectedStoreIds(selectedStoreIds.filter(id => id !== store.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={store.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {store.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
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
                    <CalendarIcon className="mr-2 h-4 w-4" />
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

          {/* Sélection des promotions */}
          <div className="space-y-3">
            <Label>Promotions associées ({selectedPromotionIds.length} sélectionnée{selectedPromotionIds.length > 1 ? 's' : ''})</Label>
            
            {promotionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : promotions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune promotion disponible
              </p>
            ) : (
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {promotions.map((promo) => (
                  <div key={promo.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`promo-${promo.id}`}
                      checked={selectedPromotionIds.includes(promo.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPromotionIds([...selectedPromotionIds, promo.id]);
                        } else {
                          setSelectedPromotionIds(selectedPromotionIds.filter(id => id !== promo.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`promo-${promo.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                    >
                      {promo.title}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {promo.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
                  Modification...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
