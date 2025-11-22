import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { 
  ArrowRight,
  Check,
  Zap,
  BarChart3,
  Smartphone,
  QrCode,
  Facebook,
  Instagram,
  Quote
} from "lucide-react";
import logoPromoJour from "@/assets/logo-promojour.png";

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserData();
  
  const statsAnimation = useScrollAnimation();
  const dashboardAnimation = useScrollAnimation();
  const featuresAnimation = useScrollAnimation();
  const pricingAnimation = useScrollAnimation();
  const testimonialsAnimation = useScrollAnimation();
  const ctaAnimation = useScrollAnimation();

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
      quote: "Le ROI est impressionnant. Pour 49€/mois, on économise des milliers d'euros en impression et on touche plus de monde. C'est un no-brainer.",
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
            <img src={logoPromoJour} alt="PromoJour" className="h-8" />
            <div className="flex gap-3">
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
                  <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
                    Démarrer
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
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Créez, gérez et diffusez<br />
              <span className="bg-gradient-to-r from-primary via-orange to-coral bg-clip-text text-transparent">
                vos promos en ligne
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
              La fin du prospectus approche. Diffusez vos promotions simplement et en temps réel sur Facebook, Instagram et Google.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="text-lg px-8 h-14 bg-primary hover:bg-primary/90"
              >
                Démarrer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Dès <span className="text-2xl font-bold text-primary">0€/mois</span>
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: "0.2s" }}>
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
              <span className="text-sm font-medium">Google</span>
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
          <div className="text-center space-y-6 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Au cœur du commerce local
            </h2>
            <p className="text-2xl text-muted-foreground">
              Plus d'<span className="font-bold text-primary">1 français sur 2</span> interagit avec les QR codes en 2024
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 pt-12">
              <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors">
                <QrCode className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-3">QR Code unique</h3>
                <p className="text-muted-foreground">
                  Générez un QR code pour vos supports de proximité : affiches, PLV, presse locale, flyers…
                </p>
              </div>
              
              <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors">
                <Zap className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-3">Visibilité multipliée</h3>
                <p className="text-muted-foreground">
                  Quand la puissance du digital rencontre l'ancrage local, ça donne une visibilité multipliée !
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section 
        ref={dashboardAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          dashboardAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-6 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Un seul tableau de bord pour{" "}
              <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
                toutes vos promos
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Réunissez en un seul endroit tout votre contenu promotionnel. Créez, gérez et diffusez directement sur vos réseaux sociaux.
            </p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 mt-8">
              <span className="text-2xl">💰</span>
              <span className="font-bold text-lg">Divisez vos coûts par 100 !</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 transition-all duration-700 ${
          featuresAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Fonctionnalités complètes</h2>
            <p className="text-xl text-muted-foreground">
              Tout ce dont vous avez besoin pour réussir
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Diffusion automatique</h3>
              <p className="text-muted-foreground text-sm">
                Publications automatiques sur Facebook, Instagram et Google My Business
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-teal/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-teal" />
              </div>
              <h3 className="font-bold text-lg mb-2">Analyse du ROI</h3>
              <p className="text-muted-foreground text-sm">
                Mesurez l'efficacité avec des KPI détaillés et analyses comportementales
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-orange/10 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-orange" />
              </div>
              <h3 className="font-bold text-lg mb-2">Accès mobile</h3>
              <p className="text-muted-foreground text-sm">
                Gérez vos promotions n'importe où, n'importe quand depuis votre smartphone
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-coral/10 flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-coral" />
              </div>
              <h3 className="font-bold text-lg mb-2">Simplicité d'utilisation</h3>
              <p className="text-muted-foreground text-sm">
                Interface intuitive, sans expertise technique requise
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-yellow/10 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-yellow" />
              </div>
              <h3 className="font-bold text-lg mb-2">Communication ciblée</h3>
              <p className="text-muted-foreground text-sm">
                Atteignez précisément votre audience locale sur les bons canaux
              </p>
            </div>

            <div className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Maîtrise du budget</h3>
              <p className="text-muted-foreground text-sm">
                Contrôlez et optimisez vos dépenses marketing en temps réel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        ref={pricingAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
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
            {/* Free Tier */}
            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Gratuit</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">0€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">1 magasin maximum</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">7 promos planifiables</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Statistiques de base</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Connexions réseaux sociaux</span>
                  </li>
                </ul>

                <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                  Commencer gratuitement
                </Button>
              </div>
            </div>

            {/* Pro Tier - Highlighted */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-orange/5 to-coral/10 border-2 border-primary relative hover:shadow-2xl transition-all scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                Recommandé
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Magasin Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">49€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
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
                    <span className="text-sm font-medium">Statistiques complètes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Import CSV/Excel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">QR codes personnalisés</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">Jusqu'à 5 utilisateurs</span>
                  </li>
                </ul>

                <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate("/auth")}>
                  Démarrer l'essai gratuit
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
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">+ 19€/mois par magasin</p>
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
                    <span className="text-sm">API & Webhooks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Import en masse</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">Support prioritaire</span>
                  </li>
                </ul>

                <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                  Nous contacter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        ref={testimonialsAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 transition-all duration-700 ${
          testimonialsAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Ils nous font confiance</h2>
            <p className="text-xl text-muted-foreground">
              Découvrez les retours de nos utilisateurs
            </p>
          </div>

          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index}>
                  <Card className="border-2 border-border/50">
                    <CardContent className="p-8 sm:p-12">
                      <Quote className="h-12 w-12 text-primary/20 mb-6" />
                      <blockquote className="text-lg sm:text-xl text-foreground mb-8 leading-relaxed">
                        "{testimonial.quote}"
                      </blockquote>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {testimonial.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
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

      {/* CTA Section */}
      <section 
        ref={ctaAnimation.ref as React.RefObject<HTMLElement>}
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          ctaAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-orange/5 to-coral/10 border border-primary/20 p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold">
                Prêt à révolutionner votre{" "}
                <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
                  communication locale ?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Rejoignez les commerçants qui ont déjà adopté PromoJour
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="text-lg px-8 h-14 bg-primary hover:bg-primary/90"
                >
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 pt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Essai gratuit
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Support dédié
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img src={logoPromoJour} alt="PromoJour" className="h-6" />
            <p className="text-sm text-muted-foreground">
              © 2024 PromoJour. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
