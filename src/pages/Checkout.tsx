import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import logoPromojour from "@/assets/logo-promojour.svg";
import { toast } from "sonner";
import { Minus, Plus, Check, Store, Building2, CreditCard, Shield, ArrowLeft } from "lucide-react";

// Stripe Price IDs
const PRICE_IDS = {
  magasin_pro: "price_1SY75QGDOvS4sk4KTCLHOYao",
  centrale_base: "price_1SY75RGDOvS4sk4KA3XQpZPg",
  centrale_store: "price_centrale_store_addon", // Per-store addon
};

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [storeCount, setStoreCount] = useState(1);
  
  const plan = searchParams.get("plan") || "pro";
  const storeName = searchParams.get("storeName") || "";

  const isPro = plan === "pro";
  const isCentrale = plan === "centrale";

  const maxStores = isPro ? 3 : 100;
  const basePrice = isPro ? 39 : 180;
  const perStorePrice = isCentrale ? 19 : 0;

  const totalPrice = isPro 
    ? basePrice * storeCount 
    : basePrice + (storeCount * perStorePrice);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const priceId = isPro ? PRICE_IDS.magasin_pro : PRICE_IDS.centrale_base;
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          priceId, 
          quantity: storeCount,
          metadata: {
            plan: plan,
            number_of_stores: storeCount,
            store_name: storeName,
          }
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Erreur lors de la création de la session de paiement");
    } finally {
      setLoading(false);
    }
  };

  const features = isPro ? [
    "Jusqu'à 3 magasins",
    "Promotions illimitées",
    "Facebook / Instagram / Google",
    "QR codes personnalisés",
    "Génération de Code EAN",
    "Jusqu'à 5 utilisateurs",
    "Statistiques complètes",
  ] : [
    "Magasins illimités",
    "Utilisateurs illimités",
    "Gestion centralisée",
    "Diffusion sur tous les réseaux",
    "API & Webhooks",
    "Support dédié",
    "Fonctionnalités avancées",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between max-w-4xl mx-auto w-full">
        <img 
          src={logoPromojour} 
          alt="PromoJour" 
          className="h-10 cursor-pointer" 
          onClick={() => navigate("/")}
        />
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isPro 
                    ? "bg-gradient-to-br from-primary to-primary/70" 
                    : "bg-gradient-to-br from-orange to-orange/70"
                }`}>
                  {isPro ? <Store className="w-6 h-6 text-white" /> : <Building2 className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {isPro ? "Magasin Pro" : "Centrale"}
                  </CardTitle>
                  <CardDescription>
                    {isPro ? "Le meilleur choix pour votre commerce" : "Pour réseaux et franchises"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Store Counter */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <Label className="text-sm font-medium">
                  {isPro ? "Nombre de magasins" : "Nombre de magasins à inclure"}
                </Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setStoreCount(Math.max(1, storeCount - 1))}
                    disabled={storeCount <= 1}
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl font-bold w-12 text-center">{storeCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setStoreCount(Math.min(maxStores, storeCount + 1))}
                    disabled={storeCount >= maxStores}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {isPro && (
                  <p className="text-xs text-muted-foreground">
                    Maximum 3 magasins par abonnement
                  </p>
                )}
                {isCentrale && (
                  <p className="text-xs text-muted-foreground">
                    180€/mois de base + 19€/mois par magasin
                  </p>
                )}
              </div>

              {/* Guarantees */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Paiement sécurisé • Annulation à tout moment</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price Breakdown */}
              <div className="space-y-4">
                {isPro ? (
                  <div className="flex justify-between text-sm">
                    <span>Magasin Pro × {storeCount}</span>
                    <span>{basePrice * storeCount}€/mois</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Abonnement Centrale</span>
                      <span>{basePrice}€/mois</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Magasins ({storeCount} × {perStorePrice}€)</span>
                      <span>{storeCount * perStorePrice}€/mois</span>
                    </div>
                  </>
                )}
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold">{totalPrice}€</span>
                      <span className="text-muted-foreground text-sm">/mois HT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trial info */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-sm">
                  <span className="font-semibold text-primary">Essai gratuit inclus</span>
                  <br />
                  Vous ne serez débité qu'après 15 jours d'essai.
                </p>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full h-14 text-base bg-foreground text-background hover:bg-foreground/90"
              >
                {loading ? (
                  "Redirection..."
                ) : (
                  <>
                    Continuer vers le paiement
                    <CreditCard className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>🔒 SSL</span>
                <span>💳 Stripe</span>
                <span>✓ PCI DSS</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
