import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, ArrowRight, Store } from "lucide-react";

interface Props {
  organizationId: string;
  existingStoreId: string | null;
  initialStoreName?: string;
  onComplete: (storeId: string) => void;
}

export function StoreOnboardingStep1({ organizationId, existingStoreId, initialStoreName, onComplete }: Props) {
  const [storeName, setStoreName] = useState(initialStoreName || "");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreFilled, setIsPreFilled] = useState(false);

  useEffect(() => {
    if (existingStoreId) {
      loadExistingStore();
    }
  }, [existingStoreId]);

  const loadExistingStore = async () => {
    if (!existingStoreId) return;
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("id", existingStoreId)
      .single();

    if (data) {
      setStoreName(data.name || "");
      setAddressLine1(data.address_line1 || "");
      setCity(data.city || "");
      setPostalCode(data.postal_code || "");
      setPhone(data.phone || "");
      if (data.cover_image_url) setCoverPreview(data.cover_image_url);
      setIsPreFilled(true);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!storeName.trim()) {
      toast.error("Le nom du magasin est requis");
      return;
    }
    if (!addressLine1.trim()) {
      toast.error("L'adresse est requise");
      return;
    }

    setLoading(true);
    try {
      let coverUrl: string | null = null;
      if (coverImage) {
        const fileExt = coverImage.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("promotion-images")
          .upload(`covers/${fileName}`, coverImage);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("promotion-images")
            .getPublicUrl(`covers/${fileName}`);
          coverUrl = publicUrl;
        }
      }

      const storeData: any = {
        name: storeName.trim(),
        address_line1: addressLine1.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        phone: phone.trim() || null,
      };
      if (coverUrl) storeData.cover_image_url = coverUrl;

      if (existingStoreId) {
        const { error } = await supabase
          .from("stores")
          .update(storeData)
          .eq("id", existingStoreId);
        if (error) throw error;
        toast.success("Informations confirmées !");
        onComplete(existingStoreId);
      } else {
        storeData.organization_id = organizationId;
        const { data, error } = await supabase
          .from("stores")
          .insert(storeData)
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Magasin créé avec succès !");
        onComplete(data.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Configurez votre magasin</h1>
        </div>
        <p className="text-muted-foreground">
          Ces informations seront affichées sur votre page promotions
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="storeName">Nom du magasin *</Label>
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Ma Boulangerie"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Adresse complète *</Label>
          <Input
            id="address"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="123 rue du Commerce"
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Paris"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="75001"
              className="h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (optionnel)</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01 23 45 67 89"
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label>Photo de couverture (optionnel)</Label>
          <div className="flex items-center gap-4">
            {coverPreview ? (
              <div className="w-32 h-20 rounded-xl overflow-hidden border border-border">
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-32 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <label className="cursor-pointer">
              <Input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              <span className="text-sm text-primary hover:underline">
                {coverPreview ? "Changer l'image" : "Ajouter une image"}
              </span>
            </label>
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full h-12" size="lg">
        {loading
          ? "Enregistrement..."
          : isPreFilled
          ? "Confirmer les informations"
          : "Enregistrer mon magasin"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
