import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { 
  ArrowRight,
  Check,
  Zap,
  BarChart3,
  QrCode,
  Facebook,
  Instagram,
  Play,
  Calendar,
  Store,
  ShoppingCart,
  Star,
  ChevronRight,
  Barcode,
  Globe,
  Clock,
  Target,
  Sparkles,
  Building2
} from "lucide-react";
import logoPromoJour from "@/assets/logo-promojour.svg";
import dashboardMockup from "@/assets/landing-dashboard-mockup.png";

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserData();
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>PromoJour - Diffusez vos promotions sur Facebook, Instagram et Google</title>
        <meta name="description" content="Créez et publiez vos promotions en quelques clics sur Facebook, Instagram et Google. Attirez plus de clients en magasin avec PromoJour." />
      </Helmet>

      {/* Navbar - Clean & Minimal */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img 
              src={logoPromoJour} 
              alt="PromoJour" 
              className="h-8 cursor-pointer" 
              onClick={() => navigate("/")}
            />
            <div className="hidden md:flex items-center gap-8">
              <a href="#fonctionnalites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Fonctionnalités
              </a>
              <a href="#tarifs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tarifs
              </a>
              <a href="#temoignages" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Témoignages
              </a>
            </div>
            <div className="flex items-center gap-3">
              {profile ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                    Connexion
                  </Button>
                  <Button size="sm" onClick={() => navigate("/auth?tab=signup")} className="bg-foreground text-background hover:bg-foreground/90">
                    Essai gratuit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean & Impactful */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-orange/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Publication automatique sur les réseaux sociaux</span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Diffusez vos promotions<br />
              <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
                en quelques clics
              </span>
              <br />
              sur Facebook, Instagram et Google
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Attirez plus de clients en magasin grâce à une plateforme simple, rapide et automatisée. Fini les heures perdues à publier manuellement.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?tab=signup")}
                className="h-14 px-8 text-base bg-foreground text-background hover:bg-foreground/90 shadow-lg"
              >
                Essayer gratuitement 15 jours
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => window.open('mailto:contact@promojour.fr?subject=Demande de démo', '_blank')}
                className="h-14 px-8 text-base"
              >
                <Play className="mr-2 h-5 w-5" />
                Demander une démo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Support inclus</span>
              </div>
            </div>
          </div>

          {/* Platform logos */}
          <div className="flex justify-center gap-4 sm:gap-8 mt-12 flex-wrap">
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-background border border-border shadow-sm">
              <Facebook className="h-5 w-5 text-[#1877F2]" />
              <span className="text-sm font-medium">Facebook</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-background border border-border shadow-sm">
              <Instagram className="h-5 w-5 text-[#E4405F]" />
              <span className="text-sm font-medium">Instagram</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-background border border-border shadow-sm">
              <Globe className="h-5 w-5 text-[#4285F4]" />
              <span className="text-sm font-medium">Google Business</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-background border border-border shadow-sm">
              <ShoppingCart className="h-5 w-5 text-[#34A853]" />
              <span className="text-sm font-medium">Google Shopping</span>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-background">
              <img 
                src={dashboardMockup} 
                alt="Interface PromoJour - Gestion des promotions" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works - 4 Steps */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Comment ça marche</h2>
            <p className="text-lg text-muted-foreground">
              Publiez votre première promotion en moins de 5 minutes
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: Sparkles,
                title: "Créez votre promo",
                description: "Ajoutez titre, prix, image ou vidéo en quelques clics"
              },
              {
                step: "02",
                icon: Target,
                title: "Choisissez les réseaux",
                description: "Facebook, Instagram, Google Business ou tous à la fois"
              },
              {
                step: "03",
                icon: Zap,
                title: "Publiez instantanément",
                description: "Un clic et votre promo est en ligne partout"
              },
              {
                step: "04",
                icon: BarChart3,
                title: "Suivez vos stats",
                description: "Mesurez les vues, clics et visites en magasin"
              }
            ].map((item, index) => (
              <div key={index} className="relative text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background border border-border mb-6 group-hover:border-primary/50 transition-colors">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 text-5xl font-bold text-muted/30">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pourquoi choisir PromoJour ?
            </h2>
            <p className="text-lg text-muted-foreground">
              Tout ce dont vous avez besoin pour booster votre commerce local
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Clock,
                title: "Gain de temps considérable",
                description: "Publiez sur tous vos réseaux en un seul clic au lieu de répéter la même opération sur chaque plateforme.",
                color: "text-primary"
              },
              {
                icon: Target,
                title: "Visibilité locale maximale",
                description: "Touchez les clients à proximité de votre magasin grâce à Google Business et au ciblage géolocalisé.",
                color: "text-orange"
              },
              {
                icon: Zap,
                title: "Automatisation intelligente",
                description: "Programmez vos promotions à l'avance et laissez PromoJour les publier aux meilleurs moments.",
                color: "text-coral"
              },
              {
                icon: Globe,
                title: "Multi-diffusion instantanée",
                description: "Facebook, Instagram, Google My Business, Google Shopping : une seule création, diffusion partout.",
                color: "text-teal"
              }
            ].map((benefit, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-muted ${benefit.color}`}>
                    <benefit.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - Stats */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-foreground text-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "3x", label: "Plus de visibilité locale" },
              { value: "-70%", label: "Sur les coûts d'impression" },
              { value: "500+", label: "Commerces utilisateurs" },
              { value: "24/7", label: "Support réactif" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl sm:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-background/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="temoignages" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-muted-foreground">
              Découvrez ce que nos utilisateurs disent de PromoJour
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "PromoJour a transformé notre communication. Nos promotions touchent 3x plus de clients qu'avant.",
                author: "Marie Durand",
                role: "Gérante, Boulangerie Au Bon Pain",
                rating: 5
              },
              {
                quote: "L'interface est ultra simple. On gère toutes nos promos en quelques clics au lieu de passer des heures.",
                author: "Thomas Leroy",
                role: "Responsable Marketing, 30 magasins",
                rating: 5
              },
              {
                quote: "Le ROI est impressionnant. Pour 39€/mois, on économise des milliers d'euros en impression.",
                author: "Sophie Martin",
                role: "Pharmacie Martin, Lyon",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-6 rounded-2xl bg-muted/50 border border-border">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-sm">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Logo cloud placeholder */}
          <div className="mt-16 pt-16 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-8">
              Ils utilisent PromoJour pour leurs promotions
            </p>
            <div className="flex justify-center items-center gap-12 flex-wrap opacity-50">
              {["Boulangeries", "Pharmacies", "Restaurants", "Boutiques", "Supermarchés"].map((type, index) => (
                <div key={index} className="text-lg font-semibold text-muted-foreground">
                  {type}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="fonctionnalites" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Toutes les fonctionnalités
            </h2>
            <p className="text-lg text-muted-foreground">
              Une plateforme complète pour votre commerce
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "Planificateur",
                description: "Programmez vos promos à l'avance et automatisez la publication"
              },
              {
                icon: QrCode,
                title: "QR Codes dynamiques",
                description: "Générez des QR codes personnalisés pour vos vitrines et supports"
              },
              {
                icon: Globe,
                title: "Multi-réseaux",
                description: "Facebook, Instagram, Google Business, Google Shopping en un clic"
              },
              {
                icon: Barcode,
                title: "Codes EAN",
                description: "Générez des codes-barres EAN13 pour vos promotions"
              },
              {
                icon: BarChart3,
                title: "Statistiques détaillées",
                description: "Suivez les vues, clics et performances de chaque promo"
              },
              {
                icon: Building2,
                title: "Multi-magasins",
                description: "Gérez plusieurs points de vente depuis une seule interface"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-background border border-border hover:border-primary/30 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-lg text-muted-foreground">
              Commencez gratuitement, évoluez selon vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Free Trial */}
            <div className="p-8 rounded-2xl bg-background border border-border">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-1">Essai gratuit</h3>
                <p className="text-sm text-muted-foreground mb-4">Pour tester sans engagement</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">0€</span>
                  <span className="text-muted-foreground text-sm">HT / 15 jours</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  "1 magasin",
                  "7 promotions maximum",
                  "Diffusion sur 1 réseau social",
                  "Statistiques de base",
                  "Planification 15 jours"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/auth?tab=signup")}
              >
                Commencer gratuitement
              </Button>
            </div>

            {/* Pro - Highlighted */}
            <div className="relative p-8 rounded-2xl bg-foreground text-background scale-105 shadow-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Le meilleur choix
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-1">Magasin Pro</h3>
                <p className="text-sm text-background/70 mb-4">Pour les commerces ambitieux</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">39€</span>
                  <span className="text-background/70 text-sm">HT / mois par magasin</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Jusqu'à 3 magasins",
                  "Promotions illimitées",
                  "Facebook / Instagram / Google My Business / Google Shopping",
                  "QR codes personnalisés",
                  "Génération de Code EAN",
                  "Jusqu'à 5 utilisateurs",
                  "Statistiques complètes"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/auth?tab=signup")}
              >
                Démarrer l'essai gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Centrale */}
            <div className="p-8 rounded-2xl bg-background border border-border">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-1">Centrale</h3>
                <p className="text-sm text-muted-foreground mb-4">Pour réseaux et franchises</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">180€</span>
                  <span className="text-muted-foreground text-sm">HT / mois</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">+ 19€ HT / magasin</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Magasins illimités",
                  "Utilisateurs illimités",
                  "Gestion centralisée",
                  "Diffusion sur les comptes de chaque magasin",
                  "API & Webhooks",
                  "Support dédié"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('mailto:contact@promojour.fr?subject=Demande Centrale', '_blank')}
              >
                Nous contacter
              </Button>
            </div>
          </div>

          {/* Comparison note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Tous les prix sont hors taxes. Facturation mensuelle, sans engagement.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-foreground text-background">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Prêt à booster votre commerce ?
          </h2>
          <p className="text-lg text-background/70 mb-8 max-w-xl mx-auto">
            Rejoignez les centaines de commerces qui utilisent PromoJour pour attirer plus de clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate("/auth?tab=signup")}
              className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Essayer gratuitement 15 jours
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => window.open('mailto:contact@promojour.fr?subject=Demande de démo', '_blank')}
              className="h-14 px-8 border-background/30 text-background hover:bg-background/10"
            >
              Demander une démo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <img src={logoPromoJour} alt="PromoJour" className="h-8 mb-4" />
              <p className="text-sm text-muted-foreground max-w-xs">
                La plateforme tout-en-un pour diffuser vos promotions et attirer plus de clients en magasin.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-foreground transition-colors">Tarifs</a></li>
                <li><button onClick={() => navigate("/auth?tab=signup")} className="hover:text-foreground transition-colors">Essai gratuit</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/privacy-policy")} className="hover:text-foreground transition-colors">Politique de confidentialité</button></li>
                <li><button onClick={() => navigate("/terms-of-service")} className="hover:text-foreground transition-colors">CGU</button></li>
                <li><button onClick={() => navigate("/legal-notice")} className="hover:text-foreground transition-colors">Mentions légales</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} PromoJour. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
