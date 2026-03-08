import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Upload, X, Settings } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { StoreMechanicSelector } from "./StoreMechanicSelector";
import { useState } from "react";

export interface StorePromotionFormValues {
  title: string;
  description?: string | null;
  category?: string;
  mechanicType: string;
  productName?: string;
  ean?: string;
  originalPrice?: string;
  discountedPrice?: string;
  discountPercentage?: string;
  bundleDescription?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  ctaText?: string;
  ctaActionType?: "url" | "ean";
  ctaUrl?: string;
  eanCode?: string;
}

interface StorePromotionFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  watchValues: {
    mechanicType: string;
    originalPrice?: string;
    discountedPrice?: string;
    discountPercentage?: string;
    startDate?: Date;
    endDate?: Date;
    ctaActionType?: string;
  };
  // Image handling
  imagePreviews: string[];
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  previewTypes?: ('image' | 'video')[];
  // Unique ID for file input
  fileInputId?: string;
  // Action buttons
  children: React.ReactNode;
}

export function StorePromotionFormFields({
  register,
  errors,
  setValue,
  watchValues,
  imagePreviews,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onImageUpload,
  onRemoveImage,
  previewTypes,
  fileInputId = "store-promo-images",
  children,
}: StorePromotionFormFieldsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { mechanicType, originalPrice, discountedPrice, discountPercentage, startDate, endDate, ctaActionType } = watchValues;

  return (
    <div className="space-y-5">
      {/* Media upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Image ou vidéo</h3>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border"
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type="file"
            id={fileInputId}
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={onImageUpload}
          />
          <label htmlFor={fileInputId} className="cursor-pointer">
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
            {imagePreviews.map((preview, index) => {
              const isVideo = previewTypes ? previewTypes[index] === 'video' : false;
              return (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  {isVideo ? (
                    <video src={preview} className="w-full h-full object-cover" controls playsInline />
                  ) : (
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre de la promotion *</Label>
        <Input
          id="title"
          placeholder="Ex: -30% sur les croissants"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{String(errors.title.message)}</p>
        )}
      </div>

      {/* Description (optional, no asterisk) */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Décrivez brièvement votre promotion..."
          rows={2}
          {...register("description")}
        />
      </div>

      {/* Mechanic type - visual buttons */}
      <div className="space-y-2">
        <Label>Type de promotion</Label>
        <StoreMechanicSelector
          value={mechanicType}
          onChange={(value) => setValue("mechanicType", value)}
        />
      </div>

      {/* Dynamic price fields based on mechanic */}
      {mechanicType === "price_discount" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="originalPrice">Prix original (€)</Label>
            <Input
              id="originalPrice"
              type="number"
              step="0.01"
              placeholder="99.99"
              {...register("originalPrice")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountedPrice">Prix remisé (€)</Label>
            <Input
              id="discountedPrice"
              type="number"
              step="0.01"
              placeholder="69.99"
              {...register("discountedPrice")}
            />
          </div>
        </div>
      )}

      {mechanicType === "percentage_discount" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Prix original (€)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                placeholder="99.99"
                {...register("originalPrice")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Réduction (%)</Label>
              <Input
                id="discountPercentage"
                type="number"
                placeholder="30"
                {...register("discountPercentage")}
              />
            </div>
          </div>
          {originalPrice && discountPercentage && discountedPrice && (
            <p className="text-sm text-muted-foreground">
              Prix remisé calculé : <strong>{discountedPrice} €</strong>
            </p>
          )}
        </>
      )}

      {mechanicType === "bundle_offer" && (
        <div className="space-y-2">
          <Label htmlFor="bundleDescription">Description de l'offre</Label>
          <Input
            id="bundleDescription"
            placeholder="Ex: 2 achetés = 1 offert"
            {...register("bundleDescription")}
          />
        </div>
      )}

      {/* Dates */}
      <div className="space-y-2">
        <Label>Dates de validité</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date de début *</Label>
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
              <p className="text-sm text-destructive">{String(errors.startDate.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date de fin *</Label>
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
              <p className="text-sm text-destructive">{String(errors.endDate.message)}</p>
            )}
          </div>
        </div>
      </div>

      {/* EAN */}
      <div className="space-y-2">
        <Label htmlFor="ean">Code EAN (optionnel)</Label>
        <Input
          id="ean"
          placeholder="Ex: 1234567890123"
          {...register("ean")}
        />
        <p className="text-xs text-muted-foreground">
          Ce code-barre sera scannable en caisse pour valider la promotion
        </p>
      </div>

      {/* Level 2 - Advanced options accordion */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
          <Settings className="w-4 h-4" />
          <span>Options avancées</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3 border-t mt-2">
          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select onValueChange={(value) => setValue("category", value)}>
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
            <Label htmlFor="productName">Nom du produit</Label>
            <Input
              id="productName"
              placeholder="Ex: Chaussures Nike Air Max"
              {...register("productName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctaText">Intitulé du bouton</Label>
            <Input
              id="ctaText"
              placeholder="J'en Profite"
              {...register("ctaText")}
            />
            <p className="text-xs text-muted-foreground">Texte affiché sur le bouton d'action de votre promotion</p>
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
                <SelectItem value="ean">Code EAN (code-barre)</SelectItem>
                <SelectItem value="url">Lien URL</SelectItem>
              </SelectContent>
            </Select>
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
                <p className="text-sm text-destructive">{String(errors.ctaUrl.message)}</p>
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
        </CollapsibleContent>
      </Collapsible>

      {/* Action buttons - provided by parent */}
      {children}
    </div>
  );
}
