import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles, PartyPopper } from "lucide-react";

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

  // Quick create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceBefore, setPriceBefore] = useState("");
  const [priceAfter, setPriceAfter] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );
  const [promoImage, setPromoImage] = useState<File | null>(null);
  const [promoImagePreview, setPromoImagePreview] = useState<string | null>(null);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  useEffect(() => {
    loadCentralPromos();
  }, []);

  const loadCentralPromos = async () => {
    try {
      // Look for promotions created by the central (no store_id, same org)
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
      // Duplicate central promos for this store
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPromoImage(file);
      setPromoImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePromo = async (publishNow: boolean) => {
    if (!title.trim()) {
      toast.error("Le titre de la promotion est requis");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (promoImage) {
        const fileExt = promoImage.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("promotion-images")
          .upload(`promotions/${fileName}`, promoImage);
        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("promotion-images")
            .getPublicUrl(`promotions/${fileName}`);
          imageUrl = publicUrl;
        }
      }

      const { data: newPromo, error } = await supabase.from("promotions").insert({
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl,
        organization_id: organizationId,
        store_id: storeId,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status: publishNow ? "active" : "draft",
        attributes: {
          price_before: priceBefore || null,
          price_after: priceAfter || null,
        },
      }).select("id").single();

      if (error) throw error;

      if (publishNow && newPromo) {
        // Trigger auto-publish to Facebook
        try {
          const { data: connections } = await supabase
            .from("social_connections")
            .select("platform, is_connected")
            .eq("store_id", storeId)
            .eq("is_connected", true)
            .eq("platform", "facebook");

          if (connections && connections.length > 0) {
            await supabase.functions.invoke("publish-social-reel", {
              body: { promotionId: newPromo.id, storeId, platforms: ["facebook"] },
            });
          }
        } catch (pubError) {
          console.error("Auto-publish error during onboarding:", pubError);
          // Don't block onboarding if publish fails
        }
      }

      if (!publishNow) {
        setSavedAsDraft(true);
      }
      setSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
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
            Votre promotion est en ligne !
          </h2>
          <p className="text-muted-foreground">
            Félicitations, votre première promotion a été publiée avec succès.
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
        /* Quick create form */
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Photo de la promotion</Label>
            <div className="flex items-center gap-4">
              {promoImagePreview ? (
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-border">
                  <img src={promoImagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <label className="cursor-pointer">
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <span className="text-sm text-primary hover:underline">
                  {promoImagePreview ? "Changer" : "Ajouter une photo"}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promoTitle">Titre de la promotion *</Label>
            <Input
              id="promoTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: -30% sur les croissants"
              className="h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceBefore">Prix avant</Label>
              <Input
                id="priceBefore"
                value={priceBefore}
                onChange={(e) => setPriceBefore(e.target.value)}
                placeholder="1,20 €"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceAfter">Prix après</Label>
              <Input
                id="priceAfter"
                value={priceAfter}
                onChange={(e) => setPriceAfter(e.target.value)}
                placeholder="0,90 €"
                className="h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description courte</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement votre promotion..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleCreatePromo}
            disabled={submitting}
            className="w-full h-12"
            size="lg"
          >
            {submitting ? "Publication..." : "Publier ma première promo"}
          </Button>
        </div>
      )}
    </div>
  );
}
