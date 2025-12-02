import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import { useUserData } from "@/hooks/use-user-data";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import logoPromoJour from "@/assets/logo-promojour.svg";

export default function Pricing() {
  const navigate = useNavigate();
  const { profile } = useUserData();
  const { createCheckoutSession, tiers } = useSubscription();

  const handleSelectPlan = (priceId: string) => {
    if (!profile) {
      navigate("/auth?tab=signup");
      return;
    }
    createCheckoutSession(priceId);
  };

  const pricingTiers = [
    {
      name: "Essai gratuit",
      price: "0€",
      period: "/15 jours",
      description: "Testez toutes les fonctionnalités",
      features: [
        "1 magasin",
        "7 promos par semaine",
        "Connexions réseaux sociaux",
        "Statistiques de base",
        "Planification 15 jours",
        "QR code & codes-barres EAN",
      ],
      cta: "Commencer l'essai gratuit",
      variant: "outline" as const,
      priceId: null,
      highlighted: false,
    },
    {
      name: "Magasin Pro",
      price: "39€",
      period: " HT/mois",
      description: "Le meilleur choix pour les commerçants",
      features: [
        "Jusqu'à 5 magasins",
        "Promos illimitées",
        "Statistiques complètes",
        "Import CSV/Excel",
        "QR codes personnalisés",
        "Codes-barres EAN",
        "Vidéos & Reels",
        "Jusqu'à 5 utilisateurs",
        "Support prioritaire",
      ],
      cta: "Démarrer",
      variant: "default" as const,
      priceId: tiers.magasin_pro.price_id,
      highlighted: true,
    },
    {
      name: "Centrale",
      price: "180€",
      period: " HT/mois",
      description: "Pour les réseaux et franchises",
      note: "+ 19€ HT/mois par magasin",
      features: [
        "Magasins illimités",
        "Utilisateurs illimités",
        "Gestion centralisée",
        "API & Webhooks",
        "Import en masse",
        "Contrôle des champs promos",
        "Dashboard réseau complet",
        "Rôles franchisés & managers",
        "Support dédié",
      ],
      cta: "Commencer",
      variant: "outline" as const,
      priceId: tiers.centrale.price_id,
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img 
              src={logoPromoJour} 
              alt="PromoJour" 
              className="h-8 cursor-pointer" 
              onClick={() => navigate("/")}
            />
            <div className="flex gap-3">
              {profile ? (
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/auth")}>
                    Connexion
                  </Button>
                  <Button onClick={() => navigate("/auth?tab=signup")} className="bg-primary hover:bg-primary/90">
                    Démarrer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container mx-auto max-w-4xl relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Tarifs simples et transparents</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Choisissez votre{" "}
            <span className="bg-gradient-to-r from-primary via-orange to-coral bg-clip-text text-transparent">
              formule idéale
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pas d'engagement, changez ou annulez à tout moment. 
            Tous les plans incluent les fonctionnalités essentielles.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.highlighted
                    ? "border-2 border-primary shadow-xl scale-105 bg-gradient-to-br from-primary/5 via-background to-orange/5"
                    : "border border-border hover:border-primary/50"
                } transition-all duration-300`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                    Recommandé
                  </div>
                )}
                
                <CardContent className="p-8 space-y-6">
                  {/* Header */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                    {tier.note && (
                      <p className="text-xs text-muted-foreground">{tier.note}</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 py-4">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className={`text-sm ${tier.highlighted ? "font-medium" : ""}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    variant={tier.variant}
                    className="w-full"
                    onClick={() => tier.priceId ? handleSelectPlan(tier.priceId) : navigate("/auth?tab=signup")}
                  >
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Questions fréquentes</h2>
            <p className="text-muted-foreground">Tout ce que vous devez savoir sur nos formules</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Puis-je changer de formule à tout moment ?</h3>
                <p className="text-muted-foreground text-sm">
                  Oui, vous pouvez passer d'une formule à l'autre à tout moment. 
                  Le changement est immédiat et le montant est proratisé.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Y a-t-il une période d'engagement ?</h3>
                <p className="text-muted-foreground text-sm">
                  Non, tous nos abonnements sont sans engagement. Vous pouvez annuler à tout moment depuis votre espace client.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">L'essai gratuit nécessite-t-il une carte bancaire ?</h3>
                <p className="text-muted-foreground text-sm">
                  Non, aucune carte bancaire requise pour démarrer votre essai de 15 jours. 
                  Testez toutes les fonctionnalités en toute liberté, sans engagement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Comment fonctionne la tarification de la formule Centrale ?</h3>
                <p className="text-muted-foreground text-sm">
                  La formule Centrale est facturée 180€ HT/mois de base, puis 19€ HT/mois pour chaque magasin supplémentaire. 
                  Parfait pour les réseaux de franchise ou enseignes avec plusieurs points de vente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Quels moyens de paiement acceptez-vous ?</h3>
                <p className="text-muted-foreground text-sm">
                  Nous acceptons toutes les cartes bancaires (Visa, Mastercard, American Express) via Stripe, 
                  notre partenaire de paiement sécurisé.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-orange/5 to-coral/10 border border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Prêt à démarrer ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez les centaines de commerçants qui ont modernisé leur communication promotionnelle
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth?tab=signup")}
              className="text-lg px-8 h-14 bg-primary hover:bg-primary/90"
            >
              Démarrer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={logoPromoJour} alt="PromoJour" className="h-6" />
              <span className="text-sm text-muted-foreground">
                © 2024 PromoJour® - Une marque d'Hub & Up
              </span>
            </div>
            
            <div className="flex gap-6 text-sm">
              <button
                onClick={() => navigate("/mentions-legales")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Mentions légales
              </button>
              <button
                onClick={() => navigate("/politique-de-confidentialite")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Confidentialité
              </button>
              <button
                onClick={() => navigate("/conditions-generales")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                CGV
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
