import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sparkles, PartyPopper } from "lucide-react";
import { CreatePromotionDialog } from "@/components/CreatePromotionDialog";

interface Props {
  organizationId: string;
  storeId: string;
  onComplete: () => void;
}

interface CentralPromotion {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string;
  enabled: boolean;
}

export function StoreOnboardingStep3({ organizationId, storeId, onComplete }: Props) {
  const [centralPromos, setCentralPromos] = useState<CentralPromotion[]>([]);
  const [hasCentralPromos, setHasCentralPromos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadCentralPromos();
  }, []);

  const loadCentralPromos = async () => {
    try {
      const { data } = await supabase
        .from("promotions")
        .select("id, title, description, image_url, start_date, end_date")
        .eq("organization_id", organizationId)
        .is("store_id", null)
        .in("status", ["active", "scheduled"])
        .order("start_date", { ascending: true });

      if (data && data.length > 0) {
        setCentralPromos(data.map((p) => ({ ...p, enabled: true })));
        setHasCentralPromos(true);
      }
    } catch (error) {
      console.error("Error loading central promos:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePromo = (id: string) => {
    setCentralPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handlePublishCentral = async () => {
    const enabledPromos = centralPromos.filter((p) => p.enabled);
    if (enabledPromos.length === 0) {
      toast.error("Activez au moins une promotion");
      return;
    }

    setSubmitting(true);
    try {
      const inserts = enabledPromos.map((p) => ({
        title: p.title,
        description: p.description,
        image_url: p.image_url,
        start_date: p.start_date,
        end_date: p.end_date,
        organization_id: organizationId,
        store_id: storeId,
        status: "active" as const,
      }));

      const { error } = await supabase.from("promotions").insert(inserts);
      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la publication");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromotionCreated = () => {
    setShowCreateDialog(false);
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mx-auto">
          <PartyPopper className="w-10 h-10 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {savedAsDraft
              ? "Votre promotion a été enregistrée"
              : "Votre promotion est en ligne !"}
          </h2>
          <p className="text-muted-foreground">
            {savedAsDraft
              ? "Vous pourrez la publier depuis Mes Promotions quand vous le souhaitez."
              : "Félicitations, votre première promotion a été publiée avec succès."}
          </p>
        </div>
        <Button onClick={onComplete} size="lg" className="h-12 px-8">
          Accéder à mon espace
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Créez votre première promotion</h1>
        </div>
        <p className="text-muted-foreground">
          En 2 minutes, votre première promo sera visible sur Facebook
        </p>
      </div>

      {hasCentralPromos ? (
        /* Central promotions list */
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Votre enseigne a préparé ces promotions pour vous. Activez celles qui correspondent à votre stock.
          </p>
          <div className="space-y-3">
            {centralPromos.map((promo) => (
              <div
                key={promo.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  promo.enabled ? "border-primary/30 bg-primary/5" : "border-border"
                }`}
              >
                {promo.image_url && (
                  <img
                    src={promo.image_url}
                    alt={promo.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{promo.title}</p>
                  {promo.description && (
                    <p className="text-sm text-muted-foreground truncate">{promo.description}</p>
                  )}
                </div>
                <Switch
                  checked={promo.enabled}
                  onCheckedChange={() => togglePromo(promo.id)}
                />
              </div>
            ))}
          </div>
          <Button
            onClick={handlePublishCentral}
            disabled={submitting || centralPromos.every((p) => !p.enabled)}
            className="w-full h-12"
            size="lg"
          >
            {submitting ? "Publication..." : "Publier les promotions activées"}
          </Button>
        </div>
      ) : (
        /* Use the standard CreatePromotionDialog */
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Créez votre première promotion avec le même formulaire que vous utiliserez au quotidien.
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="w-full h-12 gradient-primary text-white shadow-glow"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Créer ma première promotion
          </Button>

          <CreatePromotionDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onSuccess={handlePromotionCreated}
            defaultStoreId={storeId}
          />

          <Button
            variant="ghost"
            onClick={onComplete}
            className="w-full text-muted-foreground"
          >
            Passer cette étape
          </Button>
        </div>
      )}
    </div>
  );
}
