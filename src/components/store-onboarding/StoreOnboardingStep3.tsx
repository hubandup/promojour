import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sparkles, PartyPopper } from "lucide-react";
import { StorePromotionFormFields } from "@/components/promotion-form/StorePromotionFormFields";

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

const promotionSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  mechanicType: z.string().min(1, "Veuillez sélectionner une mécanique promotionnelle"),
  productName: z.string().optional().or(z.literal("")),
  ean: z.string().optional(),
  originalPrice: z.string().optional(),
  discountedPrice: z.string().optional(),
  discountPercentage: z.string().optional(),
  bundleDescription: z.string().optional(),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date({ required_error: "La date de fin est requise" }),
  status: z.enum(["draft", "scheduled", "active", "archived"]),
  ctaText: z.string().optional(),
  ctaActionType: z.enum(["url", "ean"]).optional(),
  ctaUrl: z.union([z.string().url("L'URL doit être valide"), z.literal("")]).optional(),
  eanCode: z.string().optional(),
});

type PromotionFormData = z.infer<typeof promotionSchema>;

export function StoreOnboardingStep3({ organizationId, storeId, onComplete }: Props) {
  const [centralPromos, setCentralPromos] = useState<CentralPromotion[]>([]);
  const [hasCentralPromos, setHasCentralPromos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      status: "active",
      mechanicType: "price_discount",
      ctaText: "J'en Profite",
      ctaActionType: "ean",
    },
  });

  const mechanicType = watch("mechanicType");
  const originalPrice = watch("originalPrice");
  const discountedPrice = watch("discountedPrice");
  const discountPercentage = watch("discountPercentage");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const ctaActionType = watch("ctaActionType");
  const ean = watch("ean");

  // Auto-calculate
  useEffect(() => {
    if (mechanicType === "price_discount" && originalPrice && discountedPrice) {
      const o = parseFloat(originalPrice), d = parseFloat(discountedPrice);
      if (!isNaN(o) && !isNaN(d) && o > 0 && d < o) {
        setValue("discountPercentage", Math.round(((o - d) / o) * 100).toString());
      }
    }
  }, [originalPrice, discountedPrice, mechanicType, setValue]);

  useEffect(() => {
    if (mechanicType === "percentage_discount" && originalPrice && discountPercentage) {
      const o = parseFloat(originalPrice), p = parseFloat(discountPercentage);
      if (!isNaN(o) && !isNaN(p) && p > 0 && p <= 100) {
        setValue("discountedPrice", (o - (o * p / 100)).toFixed(2));
      }
    }
  }, [originalPrice, discountPercentage, mechanicType, setValue]);

  useEffect(() => {
    if (ean && ean.trim()) { setValue("ctaActionType", "ean"); setValue("eanCode", ean); }
  }, [ean, setValue]);

  useEffect(() => { loadCentralPromos(); }, []);

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
    setCentralPromos((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  };

  const handlePublishCentral = async () => {
    const enabledPromos = centralPromos.filter((p) => p.enabled);
    if (enabledPromos.length === 0) { toast.error("Activez au moins une promotion"); return; }

    setSubmitting(true);
    try {
      const inserts = enabledPromos.map((p) => ({
        title: p.title, description: p.description, image_url: p.image_url,
        start_date: p.start_date, end_date: p.end_date,
        organization_id: organizationId, store_id: storeId, status: "active" as const,
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

  // Image handling
  const processFiles = (files: File[]) => {
    if (files.length + images.length > 5) { toast.error("Max 5 fichiers"); return; }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreviews((prev) => [...prev, reader.result as string]); };
      reader.readAsDataURL(file);
    });
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => processFiles(Array.from(e.target.files || []));
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (files.length === 0) { toast.error("Fichiers image ou vidéo uniquement"); return; }
    processFiles(files);
  };
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submitPromotion = async (data: PromotionFormData, asDraft: boolean) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let imageUrl: string | null = null;
      if (images.length > 0) {
        const file = images[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `promotion-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('promotion-images')
          .upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('promotion-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const attributes: any = {
        mechanicType: data.mechanicType,
        productName: data.productName || "",
        ean: data.ean,
        ctaText: data.ctaText || "J'en Profite",
        ctaActionType: data.ctaActionType || "ean",
        ctaUrl: data.ctaUrl || "",
        eanCode: data.eanCode || "",
      };
      if (data.mechanicType === "bundle_offer") attributes.bundleDescription = data.bundleDescription || "";
      if (data.mechanicType === 'price_discount' && data.originalPrice && data.discountedPrice) {
        attributes.originalPrice = data.originalPrice;
        attributes.discountedPrice = data.discountedPrice;
        if (data.discountPercentage) attributes.discountPercentage = data.discountPercentage;
      } else if (data.mechanicType === 'percentage_discount' && data.originalPrice && data.discountPercentage) {
        attributes.originalPrice = data.originalPrice;
        attributes.discountPercentage = data.discountPercentage;
        if (data.discountedPrice) attributes.discountedPrice = data.discountedPrice;
      }

      const finalStatus = asDraft
        ? "draft" as const
        : (data.startDate > new Date() ? "scheduled" as const : "active" as const);

      const { error } = await supabase
        .from('promotions')
        .insert({
          organization_id: organizationId,
          store_id: storeId,
          title: data.title,
          description: data.description || null,
          category: data.category || null,
          status: finalStatus,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          image_url: imageUrl,
          attributes,
          created_by: user.id,
        });

      if (error) throw error;

      setSavedAsDraft(asDraft);
      setSuccess(true);
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishNow = () => handleSubmit((data) => submitPromotion(data, false))();
  const handleSaveDraft = () => handleSubmit((data) => submitPromotion(data, true))();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mx-auto">
          <PartyPopper className="w-10 h-10 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {savedAsDraft ? "Votre promotion a été enregistrée" : "Votre promotion est en ligne !"}
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
                  <img src={promo.image_url} alt={promo.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{promo.title}</p>
                  {promo.description && (
                    <p className="text-sm text-muted-foreground truncate">{promo.description}</p>
                  )}
                </div>
                <Switch checked={promo.enabled} onCheckedChange={() => togglePromo(promo.id)} />
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
      ) : showForm ? (
        <StorePromotionFormFields
          register={register}
          errors={errors}
          setValue={setValue}
          watchValues={{
            mechanicType,
            originalPrice,
            discountedPrice,
            discountPercentage,
            startDate,
            endDate,
            ctaActionType,
          }}
          imagePreviews={imagePreviews}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
          fileInputId="wizard-promo-images"
        >
          <div className="space-y-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handlePublishNow}
              className="w-full gradient-primary text-white shadow-glow"
              disabled={submitting}
            >
              {submitting ? "Publication..." : "Publier maintenant sur Facebook"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              className="w-full"
              disabled={submitting}
            >
              Enregistrer et publier plus tard
            </Button>
          </div>
        </StorePromotionFormFields>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Créez votre première promotion avec le même formulaire que vous utiliserez au quotidien.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="w-full h-12 gradient-primary text-white shadow-glow"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Créer ma première promotion
          </Button>
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
