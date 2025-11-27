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
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePromotionalMechanics } from "@/hooks/use-promotional-mechanics";
import { useAutoPublishPromotion } from "@/hooks/use-auto-publish-promotion";

const promotionSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(500).nullable(),
  category: z.string().nullable(),
  mechanicType: z.string().min(1, "Veuillez sélectionner une mécanique promotionnelle"),
  productName: z.string().min(1, "Le nom du produit est requis"),
  ean: z.string().optional(),
  originalPrice: z.string().optional(),
  discountedPrice: z.string().optional(),
  discountPercentage: z.string().optional(),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date({ required_error: "La date de fin est requise" }),
  status: z.enum(["draft", "scheduled", "active", "expired", "archived"]),
  ctaText: z.string().optional(),
  ctaActionType: z.enum(["url", "ean"]).optional(),
  ctaUrl: z.string().url("L'URL doit être valide").optional().or(z.literal("")),
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
  
  const { mechanics } = usePromotionalMechanics();
  const { tryAutoPublish } = useAutoPublishPromotion();

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
      ctaActionType: "url",
      ctaUrl: "",
      eanCode: "",
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const category = watch("category");
  const status = watch("status");
  const mechanicType = watch("mechanicType");
  const originalPrice = watch("originalPrice");
  const discountedPrice = watch("discountedPrice");
  const discountPercentage = watch("discountPercentage");
  const ctaActionType = watch("ctaActionType");

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
        setValue('category', data.category || "mode");
        setValue('status', data.status);
        setPreviousStatus(data.status); // Store the current status
        setStoreId(data.store_id || ""); // Store the store_id
        setValue('startDate', new Date(data.start_date));
        setValue('endDate', new Date(data.end_date));
        
        // Load attributes data
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
        } else {
          setValue('mechanicType', "price_discount");
        }
        
        // Load existing media
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
    console.log('[EditPromotion] Form data:', data);
    
    try {
      let imageUrl = existingImageUrl;
      let videoUrl = existingVideoUrl;

      // Upload new media if provided
      if (images.length > 0) {
        setUploading(true);
        const file = images[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${promotionId}-${Date.now()}.${fileExt}`;
        const isVideo = file.type.startsWith('video/');
        
        console.log('[EditPromotion] Uploading media:', fileName, 'Type:', isVideo ? 'video' : 'image');
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('promotion-images')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error('[EditPromotion] Upload error:', uploadError);
          throw uploadError;
        }

        console.log('[EditPromotion] Upload successful:', uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('promotion-images')
          .getPublicUrl(fileName);

        if (isVideo) {
          videoUrl = publicUrl;
          console.log('[EditPromotion] Video URL:', videoUrl);
        } else {
          imageUrl = publicUrl;
          console.log('[EditPromotion] Image URL:', imageUrl);
        }
        setUploading(false);
      }

      // Build attributes object
      const attributes: any = {
        mechanicType: data.mechanicType,
        productName: data.productName,
        ean: data.ean,
        ctaText: data.ctaText || "J'en Profite",
        ctaActionType: data.ctaActionType || "url",
        ctaUrl: data.ctaUrl || "",
        eanCode: data.eanCode || "",
      };

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

      const updateData: any = {
        title: data.title,
        description: data.description,
        category: data.category,
        status: data.status,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate.toISOString(),
        attributes,
      };

      // Update media URLs if we have them
      if (imageUrl) {
        updateData.image_url = imageUrl;
      }
      if (videoUrl) {
        updateData.video_url = videoUrl;
      }

      console.log('[EditPromotion] Updating promotion ID:', promotionId);
      console.log('[EditPromotion] Update data:', updateData);

      const { data: updatedData, error } = await supabase
        .from('promotions')
        .update(updateData)
        .eq('id', promotionId)
        .select();

      console.log('[EditPromotion] Update response - Data:', updatedData);
      console.log('[EditPromotion] Update response - Error:', error);

      if (error) {
        console.error('[EditPromotion] Update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (!updatedData || updatedData.length === 0) {
        console.error('[EditPromotion] No rows updated. Promotion might not exist or RLS blocking access');
        throw new Error("Vous n'avez pas les permissions pour modifier cette promotion. Elle appartient peut-être à une autre organisation.");
      }

      console.log('[EditPromotion] Promotion updated successfully:', updatedData);
      
      // Check if status changed to active and trigger auto-publish if needed
      const wasActivated = previousStatus !== "active" && data.status === "active";
      if (wasActivated && storeId) {
        console.log('[EditPromotion] Promotion activated, checking for auto-publish...');
        tryAutoPublish(promotionId, storeId);
      }
      
      toast.success("Promotion modifiée avec succès !");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Modifier la promotion</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre promotion
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations générales</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la promotion *</Label>
              <Input
                id="title"
                placeholder="Ex: Réduction 30% sur les chaussures"
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
                placeholder="Décrivez votre promotion..."
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mode">Mode</SelectItem>
                    <SelectItem value="alimentation">Alimentation</SelectItem>
                    <SelectItem value="electronique">Électronique</SelectItem>
                    <SelectItem value="maison">Maison & Décoration</SelectItem>
                    <SelectItem value="beaute">Beauté & Santé</SelectItem>
                    <SelectItem value="sport">Sport & Loisirs</SelectItem>
                    <SelectItem value="generale">Générale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select value={status} onValueChange={(value: any) => setValue("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="scheduled">Programmé</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informations produit */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informations produit</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nom du produit *</Label>
                <Input
                  id="productName"
                  placeholder="Ex: Chaussures Nike Air Max"
                  {...register("productName")}
                />
                {errors.productName && (
                  <p className="text-sm text-destructive">{errors.productName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ean">Code EAN (optionnel)</Label>
                <Input
                  id="ean"
                  placeholder="Ex: 1234567890123"
                  {...register("ean")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mechanicType">Mécanique promotionnelle *</Label>
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
              {errors.mechanicType && (
                <p className="text-sm text-destructive">{errors.mechanicType.message}</p>
              )}
            </div>

            {mechanicType === "price_discount" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Prix original (€) *</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    {...register("originalPrice")}
                  />
                  {errors.originalPrice && (
                    <p className="text-sm text-destructive">{errors.originalPrice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountedPrice">Prix remisé (€) *</Label>
                  <Input
                    id="discountedPrice"
                    type="number"
                    step="0.01"
                    placeholder="69.99"
                    {...register("discountedPrice")}
                  />
                  {errors.discountedPrice && (
                    <p className="text-sm text-destructive">{errors.discountedPrice.message}</p>
                  )}
                </div>
              </div>
            )}

            {mechanicType === "percentage_discount" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Prix original (€) *</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    {...register("originalPrice")}
                  />
                  {errors.originalPrice && (
                    <p className="text-sm text-destructive">{errors.originalPrice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Pourcentage de réduction (%) *</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    placeholder="30"
                    {...register("discountPercentage")}
                  />
                  {errors.discountPercentage && (
                    <p className="text-sm text-destructive">{errors.discountPercentage.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Période de validité</h3>
            
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
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Call-to-Action Frontend */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Call-to-Action Frontend</h3>
            
            <div className="space-y-2">
              <Label htmlFor="ctaText">Intitulé du bouton</Label>
              <Input
                id="ctaText"
                placeholder="J'en Profite"
                defaultValue="J'en Profite"
                {...register("ctaText")}
              />
              <p className="text-xs text-muted-foreground">Texte affiché sur le bouton d'action en frontend</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ctaActionType">Type d'action</Label>
              <Select 
                value={ctaActionType} 
                onValueChange={(value: "url" | "ean") => setValue("ctaActionType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type d'action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">Lien URL</SelectItem>
                  <SelectItem value="ean">Code EAN (code-barre)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Action déclenchée lors du clic sur le bouton</p>
            </div>

            {ctaActionType === "url" && (
              <div className="space-y-2">
                <Label htmlFor="ctaUrl">URL de destination</Label>
                <Input
                  id="ctaUrl"
                  type="url"
                  placeholder="https://example.com"
                  {...register("ctaUrl")}
                />
                {errors.ctaUrl && (
                  <p className="text-sm text-destructive">{errors.ctaUrl.message}</p>
                )}
              </div>
            )}

            {ctaActionType === "ean" && (
              <div className="space-y-2">
                <Label htmlFor="eanCode">Code EAN du bon de réduction</Label>
                <Input
                  id="eanCode"
                  placeholder="1234567890123"
                  maxLength={13}
                  {...register("eanCode")}
                />
                <p className="text-xs text-muted-foreground">Code EAN à 13 chiffres pour générer le code-barre</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visuels</h3>
            
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
                  id="images"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <label htmlFor="images" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Cliquez ou glissez-déposez vos images
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
                        <video
                          src={preview}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                        />
                      ) : (
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="gradient-primary text-white shadow-glow" disabled={loading || uploading}>
              {uploading ? "Upload en cours..." : loading ? "Modification..." : "Modifier la promotion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};