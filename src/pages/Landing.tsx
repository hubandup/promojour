import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useParallax } from "@/hooks/use-parallax";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowRight,
  Check,
  Zap,
  BarChart3,
  Smartphone,
  QrCode,
  Facebook,
  Instagram,
  Quote,
  Send,
  Video,
  Scan,
  Users,
  TrendingUp,
  MapPin
} from "lucide-react";
import logoPromoJour from "@/assets/logo-promojour.svg";

const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom est trop long"),
  email: z.string().trim().email("Email invalide").max(255, "L'email est trop long"),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(1000, "Le message est trop long"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserData();
  
  const parallaxTitle = useParallax(0.3);
  const parallaxSubtitle = useParallax(0.5);
  const parallaxCta = useParallax(0.4);
  const parallaxSocial = useParallax(0.6);
  
  const statsAnimation = useScrollAnimation();
  const driveToStoreAnimation = useScrollAnimation();
  const socialAnimation = useScrollAnimation();
  const featuresAnimation = useScrollAnimation();
  const pricingAnimation = useScrollAnimation();
  const testimonialsAnimation = useScrollAnimation();
  const contactAnimation = useScrollAnimation();
  const ctaAnimation = useScrollAnimation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmitContact = async (data: ContactFormValues) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      
      reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const testimonials = [
    {
      quote: "PromoJour a transformé notre façon de communiquer. Nos promotions touchent désormais 3 fois plus de clients qu'avec les prospectus papier.",
      author: "Marie Durand",
      role: "Gérante, Boulangerie Au Bon Pain - Lille",
    },
    {
      quote: "L'interface est ultra simple et le gain de temps est considérable. On gère toutes nos promos en quelques clics au lieu de passer des heures sur chaque réseau social.",
      author: "Thomas Leroy",
      role: "Responsable Marketing, Chaussures Centrale - 30 magasins",
    },
    {
      quote: "Nos clients adorent scanner le QR code en vitrine. C'est moderne, écologique et on voit directement l'impact dans nos statistiques de visite.",
      author: "Sophie Martin",
      role: "Propriétaire, Pharmacie Martin - Lyon",
    },
    {
      quote: "Le ROI est impressionnant. Pour 39€/mois, on économise des milliers d'euros en impression et on touche plus de monde. C'est un no-brainer.",
      author: "Jean-Pierre Dubois",
      role: "Directeur, Supérette Bio Dubois - Paris",
    },
  ];

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate("/auth");
    }
  };


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
              <Button variant="ghost" onClick={() => navigate("/pricing")}>
                Tarifs
              </Button>
              {profile ? (
                <>
                  <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={handleSignOut}>
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/auth")}>
                    Connexion
                  </Button>
                  <Button onClick={() => navigate("/auth?tab=signup")} className="bg-primary hover:bg-primary/90">
                    Essai gratuit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center space-y-8 animate-fade-in">
            <h1 
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight transition-transform"
              style={{ transform: `translateY(-${parallaxTitle}px)` }}
            >
              Créez et diffusez vos promos<br />
              <span className="bg-gradient-to-r from-primary via-orange to-coral bg-clip-text text-transparent">
                en automatique
              </span>
            </h1>
            
            <p 
              className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto transition-transform"
              style={{ transform: `translateY(-${parallaxSubtitle}px)` }}
            >
              Drive-to-store optimisé : vidéos Reels, codes-barres EAN, diffusion multi-réseaux. 
              La plateforme tout-en-un pour booster votre commerce local.
            </p>

            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4 transition-transform"
              style={{ transform: `translateY(-${parallaxCta}px)` }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?tab=signup")}
                className="text-lg px-8 h-14 bg-primary hover:bg-primary/90"
              >
                Essayer 15 jours gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p 
              className="text-sm text-muted-foreground transition-transform"
              style={{ transform: `translateY(-${parallaxCta}px)` }}
            >
              Puis dès <span className="text-2xl font-bold text-primary">39€ HT/mois</span> • Sans engagement
            </p>
          </div>

          {/* Social Icons */}
          <div 
            className="flex justify-center gap-8 mt-16 animate-fade-in transition-transform" 
            style={{ animationDelay: "0.2s", transform: `translateY(-${parallaxSocial}px)` }}
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-muted/50 backdrop-blur">
              <Facebook className="h-6 w-6 text-[#1877F2]" />
              <span className="text-sm font-medium">Facebook</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-muted/50 backdrop-blur">
              <Instagram className="h-6 w-6 text-[#E4405F]" />
              <span className="text-sm font-medium">Instagram</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-muted/50 backdrop-blur">
              <div className="h-6 w-6 rounded-full bg-coral flex items-center justify-center text-white text-xs font-bold">G</div>
              <span className="text-sm font-medium">Google Business</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        ref={statsAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 transition-all duration-700 ${
          statsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-6">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Le digital au service du commerce local
            </h2>
            <p className="text-2xl text-muted-foreground">
              Plus d'<span className="font-bold text-primary">1 français sur 2</span> scanne les QR codes en 2024
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 pt-12">
              <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors">
                <TrendingUp className="h-12 w-12 text-primary mb-4 mx-auto" />
                <div className="text-4xl font-bold text-primary mb-2">3x</div>
                <h3 className="text-lg font-bold mb-2">Plus de visibilité</h3>
                <p className="text-sm text-muted-foreground">
                  vs. les catalogues papier traditionnels
                </p>
              </div>
              
              <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors">
                <BarChart3 className="h-12 w-12 text-orange mb-4 mx-auto" />
                <div className="text-4xl font-bold text-orange mb-2">-70%</div>
                <h3 className="text-lg font-bold mb-2">Coûts réduits</h3>
                <p className="text-sm text-muted-foreground">
                  d'économies sur l'impression
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors">
                <Zap className="h-12 w-12 text-coral mb-4 mx-auto" />
                <div className="text-4xl font-bold text-coral mb-2">Temps réel</div>
                <h3 className="text-lg font-bold mb-2">Diffusion instantanée</h3>
                <p className="text-sm text-muted-foreground">
                  sur tous vos canaux simultanément
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drive-to-Store Section */}
      <section 
        ref={driveToStoreAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          driveToStoreAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Drive-to-Store{" "}
              <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
                nouvelle génération
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transformez vos promotions en véritables générateurs de trafic en magasin
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-orange/5 border border-primary/20">
              <Scan className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">Codes-barres EAN intelligents</h3>
              <p className="text-muted-foreground mb-4">
                Générez des codes-barres EAN13 valides pour chaque promotion. Scannable directement en caisse pour application immédiate des réductions.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Format EAN13 standard universel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Affichage sur supports imprimés et digitaux</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Traçabilité complète des utilisations</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-orange/10 to-coral/5 border border-orange/20">
              <Video className="h-12 w-12 text-orange mb-4" />
              <h3 className="text-2xl font-bold mb-4">Vidéos & Reels percutants</h3>
              <p className="text-muted-foreground mb-4">
                Créez des Reels Instagram et Facebook engageants. Format vertical optimisé pour mobile avec call-to-action intégré.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                  <span className="text-sm">Publication automatique sur les réseaux</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                  <span className="text-sm">Format mobile-first pour maximum d'impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                  <span className="text-sm">Lien direct vers page promo avec géolocalisation</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-coral/10 to-teal/5 border border-coral/20">
              <QrCode className="h-12 w-12 text-coral mb-4" />
              <h3 className="text-2xl font-bold mb-4">QR Codes dynamiques</h3>
              <p className="text-muted-foreground mb-4">
                Un QR code unique par magasin, personnalisable et mesurable. À afficher en vitrine, PLV, flyers ou presse locale.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span className="text-sm">Contenu actualisé automatiquement</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span className="text-sm">Analytics détaillés des scans</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span className="text-sm">Formats SVG et PNG téléchargeables</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-teal/10 to-primary/5 border border-teal/20">
              <MapPin className="h-12 w-12 text-teal mb-4" />
              <h3 className="text-2xl font-bold mb-4">Ciblage géolocalisé</h3>
              <p className="text-muted-foreground mb-4">
                Affichez vos promotions aux clients à proximité immédiate de vos magasins via Google My Business et géolocalisation.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-teal shrink-0 mt-0.5" />
                  <span className="text-sm">Visibilité maximale sur Google Maps</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-teal shrink-0 mt-0.5" />
                  <span className="text-sm">Actualisation automatique de Google Business Profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-teal shrink-0 mt-0.5" />
                  <span className="text-sm">Trafic qualifié en magasin</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Integration Section */}
      <section 
        ref={socialAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 transition-all duration-700 ${
          socialAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-6 mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Automatisez vos{" "}
              <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
                réseaux sociaux
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Une seule création, une diffusion multi-canaux instantanée
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-background border border-border text-center">
              <div className="h-16 w-16 rounded-full bg-[#1877F2]/10 flex items-center justify-center mx-auto mb-4">
                <Facebook className="h-8 w-8 text-[#1877F2]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Facebook</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Publications automatiques sur votre page professionnelle
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>✓ Posts & Reels</div>
                <div>✓ Programmation intelligente</div>
                <div>✓ Stories</div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border text-center">
              <div className="h-16 w-16 rounded-full bg-[#E4405F]/10 flex items-center justify-center mx-auto mb-4">
                <Instagram className="h-8 w-8 text-[#E4405F]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Instagram</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Reels et posts optimisés pour l'engagement
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>✓ Reels vertical</div>
                <div>✓ Posts carrousel</div>
                <div>✓ Stories interactives</div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border text-center">
              <div className="h-16 w-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
                <div className="h-10 w-10 rounded-full bg-coral flex items-center justify-center text-white text-lg font-bold">G</div>
              </div>
              <h3 className="font-bold text-lg mb-2">Google Business</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Synchronisation automatique des promotions
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>✓ Actualités & offres</div>
                <div>✓ Géolocalisation</div>
                <div>✓ Avis clients</div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-orange/5 border border-primary/20 text-center">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">
              Publication automatique en quelques clics
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Créez votre promotion une seule fois, définissez vos paramètres de diffusion, 
              et laissez PromoJour publier automatiquement sur tous vos réseaux aux meilleurs moments.
            </p>
          </div>
        </div>
      </section>

      {/* User Profiles Section */}
      <section 
        ref={featuresAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Une solution pour chaque profil
            </h2>
            <p className="text-xl text-muted-foreground">
              Commerçant indépendant, réseau ou franchise : PromoJour s'adapte
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Commerçant Indépendant</h3>
                  <p className="text-sm text-muted-foreground">Gérez jusqu'à 5 magasins en toute autonomie</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Interface simple et intuitive</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Promotions illimitées</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Équipe jusqu'à 5 collaborateurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Statistiques détaillées par magasin</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-background border border-border hover:border-orange/50 transition-all">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-orange" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Centrale / Réseau</h3>
                  <p className="text-sm text-muted-foreground">Orchestrez toute votre communication réseau</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                  <span className="text-sm">Magasins et utilisateurs illimités</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                  <span className="text-sm">Contrôle des champs obligatoires par magasin</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                  <span className="text-sm">Dashboard réseau avec vue consolidée</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-orange shrink-0 mt-0.5" />
                  <span className="text-sm">Gestion centralisée + autonomie locale</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-background border border-border hover:border-teal/50 transition-all">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 text-teal" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Manager de Magasin</h3>
                  <p className="text-sm text-muted-foreground">Accès gérant pour une gestion opérationnelle</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-teal shrink-0 mt-0.5" />
                  <span className="text-sm">Accès multi-magasins si besoin</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-teal shrink-0 mt-0.5" />
                  <span className="text-sm">Création et gestion des promotions locales</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-teal shrink-0 mt-0.5" />
                  <span className="text-sm">Statistiques temps réel</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-background border border-border hover:border-coral/50 transition-all">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-lg bg-coral/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-coral" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Franchisé</h3>
                  <p className="text-sm text-muted-foreground">Bénéficiez du réseau + vos promotions locales</p>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span className="text-sm">Héritage automatique des promos centrales</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span className="text-sm">Création de promotions spécifiques</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <span className="text-sm">Visibilité des performances réseau</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        ref={pricingAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 transition-all duration-700 ${
          pricingAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Tarifs simples et transparents</h2>
            <p className="text-xl text-muted-foreground">
              Choisissez l'offre adaptée à vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Trial */}
            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Essai gratuit</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">0€</span>
                    <span className="text-muted-foreground">/15 jours</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Pour tester sans engagement</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">1 magasin</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">7 promotions par semaine</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Connexions réseaux sociaux</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Statistiques de base</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Planification 15 jours</span>
                  </li>
                </ul>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/auth?tab=signup")}
                >
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Pro Tier - HIGHLIGHTED */}
            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-orange/5 border-2 border-primary shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                Recommandé
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Magasin Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">39€</span>
                    <span className="text-muted-foreground">HT/mois</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Le meilleur choix</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Jusqu'à 5 magasins</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Promos illimitées</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">QR codes personnalisés</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Import CSV/Excel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Jusqu'à 5 utilisateurs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Statistiques complètes</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/auth?tab=signup")}
                >
                  Démarrer l'essai gratuit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Centrale Tier */}
            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Centrale</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">180€</span>
                    <span className="text-muted-foreground">HT/mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">+ 19€ HT/mois par magasin</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Magasins illimités</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Utilisateurs illimités</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Gestion centralisée</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Contrôle des champs promos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">API & Webhooks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Support dédié</span>
                  </li>
                </ul>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/pricing")}
                >
                  En savoir plus
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Sans engagement • Annulation à tout moment • Tous les prix sont HT
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section 
        ref={testimonialsAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Ils nous font confiance</h2>
            <p className="text-xl text-muted-foreground">
              Rejoignez des centaines de commerçants satisfaits
            </p>
          </div>

          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index}>
                  <Card className="border-border">
                    <CardContent className="p-12">
                      <Quote className="h-12 w-12 text-primary/30 mb-6" />
                      <p className="text-lg text-muted-foreground mb-8 italic leading-relaxed">
                        "{testimonial.quote}"
                      </p>
                      <div>
                        <p className="font-bold text-lg">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        ref={contactAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 transition-all duration-700 ${
          contactAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Une question ?</h2>
            <p className="text-xl text-muted-foreground">
              Notre équipe vous répond sous 24h
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmitContact)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input 
                      id="name"
                      placeholder="Votre nom"
                      {...register("name")}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input 
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      {...register("email")}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea 
                    id="message"
                    placeholder="Votre message..."
                    rows={6}
                    {...register("message")}
                    className={errors.message ? "border-destructive" : ""}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section 
        ref={ctaAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          ctaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-orange/5 to-coral/10 border border-primary/20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Prêt à transformer votre communication ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez les commerçants qui ont déjà modernisé leur stratégie promotionnelle
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth?tab=signup")}
              className="text-lg px-8 h-14 bg-primary hover:bg-primary/90"
            >
              Essayer 15 jours gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Sans carte bancaire • Sans engagement
            </p>
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