import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CalendarIcon, Upload, X, Settings } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePromotionalMechanics } from "@/hooks/use-promotional-mechanics";
import { useAutoPublishPromotion } from "@/hooks/use-auto-publish-promotion";
import { useUserData } from "@/hooks/use-user-data";
import { StoreMechanicSelector } from "@/components/promotion-form/StoreMechanicSelector";

const promotionSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100),
  description: z.string().max(500).optional().nullable().or(z.literal("")),
  mechanicType: z.string().min(1, "Veuillez sélectionner une mécanique promotionnelle"),
  productName: z.string().optional().or(z.literal("")),
  ean: z.string().optional(),
  originalPrice: z.string().optional(),
  discountedPrice: z.string().optional(),
  discountPercentage: z.string().optional(),
  bundleDescription: z.string().optional(),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date({ required_error: "La date de fin est requise" }),
  status: z.enum(["draft", "scheduled", "active", "expired", "archived"]),
  ctaText: z.string().optional(),
  ctaActionType: z.enum(["url", "ean"]).optional(),
  ctaUrl: z.union([z.string().url("L'URL doit être valide"), z.literal("")]).optional(),
  eanCode: z.string().optional(),
});

type PromotionFormData = z.infer<typeof promotionSchema>;

interface EditPromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionId: string;
  onSuccess?: () => void;
}

export const EditPromotionDialog = ({ open, onOpenChange, promotionId, onSuccess }: EditPromotionDialogProps) => {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [previewTypes, setPreviewTypes] = useState<('image' | 'video')[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string>("");
  const [storeId, setStoreId] = useState<string>("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  const { mechanics } = usePromotionalMechanics();
  const { tryAutoPublish } = useAutoPublishPromotion();
  const { isSuperAdmin, isStore } = useUserData();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      status: "draft",
      ctaText: "J'en Profite",
      ctaActionType: isSuperAdmin ? "ean" : "url",
      ctaUrl: isSuperAdmin ? "" : "",
      eanCode: isSuperAdmin ? "978156592764" : "",
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const status = watch("status");
  const mechanicType = watch("mechanicType");
  const originalPrice = watch("originalPrice");
  const discountedPrice = watch("discountedPrice");
  const discountPercentage = watch("discountPercentage");
  const ctaActionType = watch("ctaActionType");
  const ean = watch("ean");

  // Auto-calculate discount percentage when prices change
  useEffect(() => {
    if (mechanicType === "price_discount" && originalPrice && discountedPrice) {
      const original = parseFloat(originalPrice);
      const discounted = parseFloat(discountedPrice);
      if (!isNaN(original) && !isNaN(discounted) && original > 0 && discounted < original) {
        const percentage = Math.round(((original - discounted) / original) * 100);
        setValue("discountPercentage", percentage.toString());
      }
    }
  }, [originalPrice, discountedPrice, mechanicType, setValue]);

  // Auto-calculate discounted price when percentage changes
  useEffect(() => {
    if (mechanicType === "percentage_discount" && originalPrice && discountPercentage) {
      const original = parseFloat(originalPrice);
      const percentage = parseFloat(discountPercentage);
      if (!isNaN(original) && !isNaN(percentage) && percentage > 0 && percentage <= 100) {
        const discounted = original - (original * percentage / 100);
        setValue("discountedPrice", discounted.toFixed(2));
      }
    }
  }, [originalPrice, discountPercentage, mechanicType, setValue]);

  // Auto-select CTA action type based on EAN for store users
  useEffect(() => {
    if (isStore && ean && ean.trim()) {
      setValue("ctaActionType", "ean");
      setValue("eanCode", ean);
    }
  }, [ean, isStore, setValue]);

  useEffect(() => {
    if (open && promotionId) {
      fetchPromotion();
    }
  }, [open, promotionId]);

  const fetchPromotion = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (error) throw error;

      if (data) {
        setValue('title', data.title);
        setValue('description', data.description || "");
        setValue('status', data.status);
        setPreviousStatus(data.status);
        setStoreId(data.store_id || "");
        setValue('startDate', new Date(data.start_date));
        setValue('endDate', new Date(data.end_date));
        
        const attributes = data.attributes as any;
        if (attributes) {
          setValue('mechanicType', attributes.mechanicType || "price_discount");
          setValue('productName', attributes.productName || "");
          setValue('ean', attributes.ean || "");
          setValue('originalPrice', attributes.originalPrice || "");
          setValue('discountedPrice', attributes.discountedPrice || "");
          setValue('discountPercentage', attributes.discountPercentage || "");
          setValue('ctaText', attributes.ctaText || "J'en Profite");
          setValue('ctaActionType', attributes.ctaActionType || "url");
          setValue('ctaUrl', attributes.ctaUrl || "");
          setValue('eanCode', attributes.eanCode || "");
          if (attributes.bundleDescription) {
            setValue('bundleDescription', attributes.bundleDescription);
          }
        } else {
          setValue('mechanicType', "price_discount");
        }
        
        if (data.image_url) {
          setExistingImageUrl(data.image_url);
          setImagePreviews([data.image_url]);
          setPreviewTypes(['image']);
        } else {
          setExistingImageUrl(null);
        }

        if (data.video_url) {
          setExistingVideoUrl(data.video_url);
          if (!data.image_url) {
            setImagePreviews([data.video_url]);
            setPreviewTypes(['video']);
          }
        } else {
          setExistingVideoUrl(null);
        }

        if (!data.image_url && !data.video_url) {
          setImagePreviews([]);
          setPreviewTypes([]);
        }
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
      toast.error("Erreur lors du chargement de la promotion");
    }
  };

  const processFiles = (files: File[]) => {
    if (files.length + images.length > 5) {
      toast.error("Vous ne pouvez pas ajouter plus de 5 images");
      return;
    }

    setImages((prev) => [...prev, ...files]);
    
    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/');
      setPreviewTypes((prev) => [...prev, isVideo ? 'video' : 'image']);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (files.length === 0) {
      toast.error("Veuillez déposer des fichiers image ou vidéo");
      return;
    }
    
    processFiles(files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setPreviewTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PromotionFormData) => {
    setLoading(true);
    console.log('[EditPromotion] Starting update for promotion:', promotionId);
    
    try {
      let imageUrl = existingImageUrl;
      let videoUrl = existingVideoUrl;

      if (images.length > 0) {
        setUploading(true);
        const file = images[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${promotionId}-${Date.now()}.${fileExt}`;
        const isVideo = file.type.startsWith('video/');
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('promotion-images')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('promotion-images')
          .getPublicUrl(fileName);

        if (isVideo) {
          videoUrl = publicUrl;
        } else {
          imageUrl = publicUrl;
        }
        setUploading(false);
      }

      const attributes: any = {
        mechanicType: data.mechanicType,
        productName: data.productName || "",
        ean: data.ean,
        ctaText: data.ctaText || "J'en Profite",
        ctaActionType: data.ctaActionType || "url",
        ctaUrl: data.ctaUrl || "",
        eanCode: data.eanCode || "",
      };

      if (data.mechanicType === "bundle") {
        attributes.bundleDescription = data.bundleDescription || "";
      }

      if (data.mechanicType === 'price_discount' && data.originalPrice && data.discountedPrice) {
        attributes.originalPrice = data.originalPrice;
        attributes.discountedPrice = data.discountedPrice;
        if (data.discountPercentage) {
          attributes.discountPercentage = data.discountPercentage;
        }
      } else if (data.mechanicType === 'percentage_discount' && data.originalPrice && data.discountPercentage) {
        attributes.originalPrice = data.originalPrice;
        attributes.discountPercentage = data.discountPercentage;
        if (data.discountedPrice) {
          attributes.discountedPrice = data.discountedPrice;
        }
      }

      // For store users, auto-determine scheduled status
      let finalStatus = data.status;
      if (isStore && finalStatus === "active" && data.startDate > new Date()) {
        finalStatus = "scheduled";
      }

      const updateData: any = {
        title: data.title,
        description: data.description || null,
        status: finalStatus,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        attributes,
      };

      if (imageUrl) updateData.image_url = imageUrl;
      if (videoUrl) updateData.video_url = videoUrl;

      const { data: updatedData, error } = await supabase
        .from('promotions')
        .update(updateData)
        .eq('id', promotionId)
        .select();

      if (error) throw error;

      if (!updatedData || updatedData.length === 0) {
        throw new Error("Vous n'avez pas les permissions pour modifier cette promotion.");
      }

      // Check if status changed to active and trigger auto-publish
      const wasActivated = previousStatus !== "active" && finalStatus === "active";
      if (wasActivated && storeId) {
        tryAutoPublish(promotionId, storeId);
      }
      
      toast.success(
        isStore && finalStatus === "draft"
          ? "Promotion enregistrée en brouillon"
          : "Promotion modifiée avec succès !"
      );
      setImages([]);
      setImagePreviews([]);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[EditPromotion] Error updating promotion:', error);
      toast.error(error.message || "Erreur lors de la modification de la promotion");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleStorePublish = () => {
    setValue("status", "active");
    handleSubmit(onSubmit)();
  };

  const handleStoreDraft = () => {
    setValue("status", "draft");
    handleSubmit(onSubmit)();
  };

  // Shared media upload
  const renderMediaUpload = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Image ou vidéo</h3>
      <div className="space-y-4">
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="edit-images"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <label htmlFor="edit-images" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Cliquez ou glissez-déposez vos images ou vidéos
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, MP4 jusqu'à 10MB (max 5 fichiers)
            </p>
          </label>
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-5 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                {previewTypes[index] === 'video' ? (
                  <video src={preview} className="w-full h-full object-cover" controls playsInline />
                ) : (
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Shared date pickers
  const renderDatePickers = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Date de début *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && setValue("startDate", date)}
              locale={fr}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {errors.startDate && (
          <p className="text-sm text-destructive">{errors.startDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Date de fin *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => date && setValue("endDate", date)}
              locale={fr}
              disabled={(date) => startDate ? date < startDate : false}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {errors.endDate && (
          <p className="text-sm text-destructive">{errors.endDate.message}</p>
        )}
      </div>
    </div>
  );

  // Store-specific form layout
  const renderStoreForm = () => (
    <div className="space-y-5">
      {renderMediaUpload()}

      <div className="space-y-2">
        <Label htmlFor="title">Titre de la promotion *</Label>
        <Input
          id="title"
          placeholder="Ex: -30% sur les croissants"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Décrivez brièvement votre promotion..."
          rows={2}
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label>Type de promotion</Label>
        <StoreMechanicSelector
          value={mechanicType}
          onChange={(value) => setValue("mechanicType", value)}
        />
      </div>

      {mechanicType === "price_discount" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="originalPrice">Prix original (€)</Label>
            <Input id="originalPrice" type="number" step="0.01" placeholder="99.99" {...register("originalPrice")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountedPrice">Prix remisé (€)</Label>
            <Input id="discountedPrice" type="number" step="0.01" placeholder="69.99" {...register("discountedPrice")} />
          </div>
        </div>
      )}

      {mechanicType === "percentage_discount" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Prix original (€)</Label>
              <Input id="originalPrice" type="number" step="0.01" placeholder="99.99" {...register("originalPrice")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Réduction (%)</Label>
              <Input id="discountPercentage" type="number" placeholder="30" {...register("discountPercentage")} />
            </div>
          </div>
          {originalPrice && discountPercentage && discountedPrice && (
            <p className="text-sm text-muted-foreground">
              Prix remisé calculé : <strong>{discountedPrice} €</strong>
            </p>
          )}
        </>
      )}

      {mechanicType === "bundle" && (
        <div className="space-y-2">
          <Label htmlFor="bundleDescription">Description de l'offre</Label>
          <Input id="bundleDescription" placeholder="Ex: 2 achetés = 1 offert" {...register("bundleDescription")} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Dates de validité</Label>
        {renderDatePickers()}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ean">Code EAN (optionnel)</Label>
        <Input id="ean" placeholder="Ex: 1234567890123" {...register("ean")} />
        <p className="text-xs text-muted-foreground">
          Ce code-barre sera scannable en caisse pour valider la promotion
        </p>
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
          <Settings className="w-4 h-4" />
          <span>Options avancées</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3 border-t mt-2">
          <div className="space-y-2">
            <Label htmlFor="productName">Nom du produit</Label>
            <Input id="productName" placeholder="Ex: Chaussures Nike Air Max" {...register("productName")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctaText">Intitulé du bouton</Label>
            <Input id="ctaText" placeholder="J'en Profite" {...register("ctaText")} />
            <p className="text-xs text-muted-foreground">Texte affiché sur le bouton d'action de votre promotion</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctaActionType">Type d'action</Label>
            <Select value={ctaActionType} onValueChange={(value: "url" | "ean") => setValue("ctaActionType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ean">Code EAN (code-barre)</SelectItem>
                <SelectItem value="url">Lien URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ctaActionType === "url" && (
            <div className="space-y-2">
              <Label htmlFor="ctaUrl">URL de destination</Label>
              <Input id="ctaUrl" type="url" placeholder="https://example.com" {...register("ctaUrl")} />
              {errors.ctaUrl && <p className="text-sm text-destructive">{errors.ctaUrl.message}</p>}
            </div>
          )}

          {ctaActionType === "ean" && (
            <div className="space-y-2">
              <Label htmlFor="eanCode">Code EAN du bon de réduction</Label>
              <Input id="eanCode" placeholder="1234567890123" maxLength={13} {...register("eanCode")} />
              <p className="text-xs text-muted-foreground">Code EAN à 13 chiffres pour générer le code-barre</p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-3 pt-4 border-t">
        <Button
          type="button"
          onClick={handleStorePublish}
          className="w-full gradient-primary text-white shadow-glow"
          disabled={loading || uploading}
        >
          {uploading ? "Upload en cours..." : loading ? "Publication..." : "Publier la promotion"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleStoreDraft}
          className="w-full"
          disabled={loading || uploading}
        >
          Enregistrer en brouillon
        </Button>
      </div>
    </div>
  );

  // Full form for central/super_admin
  const renderFullForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {renderMediaUpload()}

      {/* Informations générales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations générales</h3>
        
        <div className="space-y-2">
          <Label htmlFor="title">Titre de la promotion *</Label>
          <Input id="title" placeholder="Ex: Réduction 30% sur les chaussures" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Décrivez votre promotion..." rows={3} {...register("description")} />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut *</Label>
          <Select value={status} onValueChange={(value: any) => setValue("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="scheduled">Programmé</SelectItem>
              <SelectItem value="expired">Expiré</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Informations produit */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informations produit</h3>
        
        <div className="space-y-2">
          <Label htmlFor="productName">Nom du produit *</Label>
          <Input id="productName" placeholder="Ex: Chaussures Nike Air Max" {...register("productName")} />
          {errors.productName && <p className="text-sm text-destructive">{errors.productName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ean">Code EAN (optionnel)</Label>
          <Input id="ean" placeholder="Ex: 1234567890123" {...register("ean")} />
        </div>
      </div>

      {/* Mécanique promotionnelle */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mécanique promotionnelle</h3>
        
        <div className="space-y-2">
          <Label htmlFor="mechanicType">Type de mécanique *</Label>
          <Select value={mechanicType} onValueChange={(value) => setValue("mechanicType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une mécanique" />
            </SelectTrigger>
            <SelectContent>
              {mechanics.map((mechanic) => (
                <SelectItem key={mechanic.id} value={mechanic.code}>
                  {mechanic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.mechanicType && <p className="text-sm text-destructive">{errors.mechanicType.message}</p>}
        </div>

        {mechanicType === "price_discount" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Prix original (€) *</Label>
              <Input id="originalPrice" type="number" step="0.01" placeholder="99.99" {...register("originalPrice")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountedPrice">Prix remisé (€) *</Label>
              <Input id="discountedPrice" type="number" step="0.01" placeholder="69.99" {...register("discountedPrice")} />
            </div>
          </div>
        )}

        {mechanicType === "percentage_discount" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Prix original (€) *</Label>
              <Input id="originalPrice" type="number" step="0.01" placeholder="99.99" {...register("originalPrice")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Pourcentage de réduction (%) *</Label>
              <Input id="discountPercentage" type="number" placeholder="30" {...register("discountPercentage")} />
            </div>
          </div>
        )}
      </div>

      {/* Période de validité */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Période de validité</h3>
        {renderDatePickers()}
      </div>

      {/* Bouton (CTA) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Bouton</h3>
        
        <div className="space-y-2">
          <Label htmlFor="ctaText">Intitulé du bouton</Label>
          <Input id="ctaText" placeholder="J'en Profite" defaultValue="J'en Profite" {...register("ctaText")} />
          <p className="text-xs text-muted-foreground">Par défaut : J'en Profite</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ctaActionType">Type d'action</Label>
          <Select value={ctaActionType} onValueChange={(value: "url" | "ean") => setValue("ctaActionType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le type d'action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ean">Code EAN (code-barre)</SelectItem>
              <SelectItem value="url">Lien URL</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Par défaut : Code EAN</p>
        </div>

        {ctaActionType === "ean" && (
          <div className="space-y-2">
            <Label htmlFor="eanCode">Code EAN du bon de réduction</Label>
            <Input id="eanCode" placeholder="1234567890123" maxLength={13} {...register("eanCode")} />
            <p className="text-xs text-muted-foreground">Code EAN à 13 chiffres pour générer le code-barre</p>
          </div>
        )}

        {ctaActionType === "url" && (
          <div className="space-y-2">
            <Label htmlFor="ctaUrl">URL de destination</Label>
            <Input id="ctaUrl" type="url" placeholder="https://example.com" {...register("ctaUrl")} />
            {errors.ctaUrl && <p className="text-sm text-destructive">{errors.ctaUrl.message}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit" className="gradient-primary text-white shadow-glow" disabled={loading || uploading}>
          {uploading ? "Upload en cours..." : loading ? "Modification..." : "Modifier la promotion"}
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Modifier la promotion</DialogTitle>
          <DialogDescription>
            {isStore
              ? "Modifiez et publiez votre promotion"
              : "Modifiez les informations de votre promotion"
            }
          </DialogDescription>
        </DialogHeader>

        {isStore ? renderStoreForm() : renderFullForm()}
      </DialogContent>
    </Dialog>
  );
};
