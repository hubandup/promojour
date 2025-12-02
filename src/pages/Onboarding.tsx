import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoPromojour from "@/assets/logo-promojour.svg";
import { 
  Store, 
  Facebook, 
  Instagram, 
  Globe,
  ShoppingCart,
  Upload,
  ArrowRight,
  Check,
  Sparkles,
  Calendar,
  Image
} from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Store setup
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Step 3: First promotion
  const [promoName, setPromoName] = useState("");
  const [promoImage, setPromoImage] = useState<File | null>(null);
  const [promoImagePreview, setPromoImagePreview] = useState<string | null>(null);
  const [priceBefore, setPriceBefore] = useState("");
  const [priceAfter, setPriceAfter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    // Get store name from URL params (passed from signup)
    const storeNameParam = searchParams.get("storeName");
    if (storeNameParam) {
      setStoreName(decodeURIComponent(storeNameParam));
    }
  }, [searchParams]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handlePromoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPromoImage(file);
      setPromoImagePreview(URL.createObjectURL(file));
    }
  };

  const handleStep1Submit = async () => {
    if (!storeName.trim()) {
      toast.error("Le nom du magasin est requis");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) throw new Error("No organization found");

      let logoUrl = null;
      if (logo) {
        const fileExt = logo.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("promotion-images")
          .upload(`logos/${fileName}`, logo);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("promotion-images")
            .getPublicUrl(`logos/${fileName}`);
          logoUrl = publicUrl;
        }
      }

      // Create store
      const { error } = await supabase.from("stores").insert({
        name: storeName,
        address_line1: address,
        city: city,
        postal_code: postalCode,
        logo_url: logoUrl,
        organization_id: profile.organization_id,
      });

      if (error) throw error;

      toast.success("Magasin créé avec succès !");
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du magasin");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipStep1 = () => {
    setStep(2);
  };

  const handleStep2Skip = () => {
    setStep(3);
  };

  const handleSocialConnect = (platform: string) => {
    toast.info(`Connexion ${platform} - Fonctionnalité à venir`);
  };

  const handleStep3Submit = async () => {
    if (!promoName.trim()) {
      toast.error("Le nom de la promotion est requis");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) throw new Error("No organization found");

      // Get first store
      const { data: stores } = await supabase
        .from("stores")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .limit(1);

      let imageUrl = null;
      if (promoImage) {
        const fileExt = promoImage.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("promotion-images")
          .upload(`promotions/${fileName}`, promoImage);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("promotion-images")
            .getPublicUrl(`promotions/${fileName}`);
          imageUrl = publicUrl;
        }
      }

      // Create promotion
      const { error } = await supabase.from("promotions").insert({
        title: promoName,
        image_url: imageUrl,
        organization_id: profile.organization_id,
        store_id: stores?.[0]?.id || null,
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        attributes: {
          price_before: priceBefore,
          price_after: priceAfter,
        },
      });

      if (error) throw error;

      toast.success("Promotion créée avec succès !");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la promotion");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipStep3 = () => {
    navigate("/dashboard");
  };

  const progress = (step / 3) * 100;

  const stepTitles = [
    "Bienvenue sur PromoJour ! Configurons votre magasin.",
    "Connectez vos réseaux pour publier en un clic.",
    "Votre première promo est presque prête."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      {/* Header */}
      <div className="p-6 flex justify-center">
        <img 
          src={logoPromojour} 
          alt="PromoJour" 
          className="h-10 cursor-pointer" 
          onClick={() => navigate("/")}
        />
      </div>

      {/* Progress */}
      <div className="px-4 sm:px-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
          <span>Étape {step} sur 3</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-2xl shadow-xl border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 mx-auto mb-4">
              {step === 1 && <Store className="w-8 h-8 text-white" />}
              {step === 2 && <Globe className="w-8 h-8 text-white" />}
              {step === 3 && <Sparkles className="w-8 h-8 text-white" />}
            </div>
            <CardTitle className="text-2xl">{stepTitles[step - 1]}</CardTitle>
            <CardDescription>
              {step === 1 && "Ajoutez les informations de votre magasin"}
              {step === 2 && "Connectez vos comptes pour diffuser vos promos automatiquement"}
              {step === 3 && "Créez votre première promotion en quelques secondes"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Step 1: Store Setup */}
            {step === 1 && (
              <div className="space-y-6">
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
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
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
                  <Label>Logo (optionnel)</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-border">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <span className="text-sm text-primary hover:underline">
                        {logoPreview ? "Changer le logo" : "Ajouter un logo"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleSkipStep1}
                    className="flex-1 h-12"
                  >
                    Passer
                  </Button>
                  <Button
                    onClick={handleStep1Submit}
                    disabled={loading}
                    className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90"
                  >
                    {loading ? "Création..." : "Continuer"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Social Connections */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {[
                    { name: "Facebook", icon: Facebook, color: "bg-[#1877F2]", description: "Publiez sur votre page Facebook" },
                    { name: "Instagram", icon: Instagram, color: "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]", description: "Partagez vos promos en Reels" },
                    { name: "Google Business", icon: Globe, color: "bg-[#4285F4]", description: "Apparaissez sur Google Maps" },
                    { name: "Google Shopping", icon: ShoppingCart, color: "bg-[#34A853]", description: "Diffusez sur Google Shopping" },
                  ].map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => handleSocialConnect(platform.name)}
                      className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center gap-4 text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center`}>
                        <platform.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{platform.name}</div>
                        <div className="text-sm text-muted-foreground">{platform.description}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleStep2Skip}
                    className="flex-1 h-12"
                  >
                    Je connecterai plus tard
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90"
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: First Promotion */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="promoName">Nom de la promotion *</Label>
                  <Input
                    id="promoName"
                    value={promoName}
                    onChange={(e) => setPromoName(e.target.value)}
                    placeholder="Croissant à -20%"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photo du produit</Label>
                  <div className="flex items-center gap-4">
                    {promoImagePreview ? (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-border">
                        <img src={promoImagePreview} alt="Promo preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePromoImageUpload}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" asChild>
                        <span>{promoImagePreview ? "Changer" : "Ajouter une photo"}</span>
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceBefore">Prix avant</Label>
                    <Input
                      id="priceBefore"
                      type="number"
                      step="0.01"
                      value={priceBefore}
                      onChange={(e) => setPriceBefore(e.target.value)}
                      placeholder="1.50"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceAfter">Prix après</Label>
                    <Input
                      id="priceAfter"
                      type="number"
                      step="0.01"
                      value={priceAfter}
                      onChange={(e) => setPriceAfter(e.target.value)}
                      placeholder="1.20"
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

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleSkipStep3}
                    className="flex-1 h-12"
                  >
                    Passer
                  </Button>
                  <Button
                    onClick={handleStep3Submit}
                    disabled={loading}
                    className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90"
                  >
                    {loading ? "Création..." : "Créer la promotion"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer hint */}
      <div className="p-6 text-center text-sm text-muted-foreground">
        Votre compte est configuré. À vous de jouer !
      </div>
    </div>
  );
};

export default Onboarding;
