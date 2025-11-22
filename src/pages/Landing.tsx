import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  Calendar, 
  Smartphone, 
  Target, 
  TrendingUp, 
  Zap,
  Facebook,
  Instagram,
  MapPin,
  QrCode,
  Settings,
  ChevronRight
} from "lucide-react";
import heroImage from "@/assets/landing-hero.png";
import benefitsImage from "@/assets/landing-benefits.png";
import discoverImage from "@/assets/landing-discover.png";
import featuresImage from "@/assets/landing-features.png";
import managementImage from "@/assets/landing-management.png";
import budgetImage from "@/assets/landing-budget.png";
import logoPromoJour from "@/assets/logo-promojour.png";

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
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: Settings,
      title: "Création et gestion en temps réel",
      description: "Créez, modifiez et gérez toutes vos promotions depuis un tableau de bord unique et intuitif.",
    },
    {
      icon: Zap,
      title: "Diffusion automatique",
      description: "Vos promotions sont automatiquement publiées sur Facebook, Instagram et Google My Business.",
    },
    {
      icon: Calendar,
      title: "Planification intelligente",
      description: "Programmez vos publications à l'avance et optimisez votre calendrier promotionnel.",
    },
    {
      icon: Smartphone,
      title: "Accès mobile",
      description: "Gérez vos promotions n'importe où, n'importe quand depuis votre smartphone.",
    },
    {
      icon: Target,
      title: "Communication ciblée",
      description: "Atteignez précisément votre audience locale sur les canaux où elle est active.",
    },
    {
      icon: BarChart3,
      title: "Analyse du ROI",
      description: "Mesurez l'efficacité de vos campagnes avec des KPI détaillés et des analyses comportementales.",
    },
  ];

  const benefits = [
    {
      icon: QrCode,
      title: "Simplicité d'utilisation",
      description: "Interface intuitive et conviviale, sans expertise technique requise. Créez vos promotions en quelques clics.",
      image: managementImage,
    },
    {
      icon: MapPin,
      title: "Communication locale et ciblée",
      description: "Diffusez vos promotions spécifiquement dans votre zone de chalandise, sur les canaux les plus pertinents.",
      image: featuresImage,
    },
    {
      icon: TrendingUp,
      title: "Analyse du ROI",
      description: "Mesurez le retour sur investissement avec des indicateurs de performance et comportement clients détaillés.",
      image: benefitsImage,
    },
    {
      icon: BarChart3,
      title: "Maîtrise du budget",
      description: "Contrôlez et optimisez vos dépenses marketing grâce aux outils de suivi et d'analyse en temps réel.",
      image: budgetImage,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoPromoJour} alt="PromoJour" className="h-8" />
          </div>
          
          <div className="flex items-center gap-4">
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
                <Button onClick={() => navigate("/auth")}>
                  Essai gratuit
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow/30 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,227,133,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(93,175,184,0.15),transparent_50%)]" />
        
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 relative z-10">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Créez, gérez et diffusez vos promos sur les{" "}
                <span className="text-primary">réseaux sociaux</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Dès 0€/mois
              </p>
              <p className="text-lg text-foreground/80">
                La fin du prospectus approche : découvrez la nouvelle plateforme qui vous permet de diffuser vos promotions simplement et en temps réel sur Facebook, Instagram et Google.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="shadow-lg hover:shadow-xl transition-all">
                  Démarrer gratuitement
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                  Voir la démo
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={heroImage} 
                alt="PromoJour Interface" 
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Stats Section */}
      <section className="py-20 bg-teal/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Au cœur du commerce local</h2>
            <p className="text-xl text-foreground/80">
              Plus d'un français sur 2 interagit avec les QR codes en 2024.
            </p>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <Card className="p-8 bg-card/50 backdrop-blur border-2">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-teal/10 rounded-2xl">
                    <QrCode className="h-12 w-12 text-teal" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3">QR Code unique</h3>
                <p className="text-foreground/70">
                  En plus de diffuser vos promotions en ligne, vous générez un QR code unique pour les intégrer à vos supports de proximité : affiches, PLV, presse locale, flyers…
                </p>
              </Card>
              
              <Card className="p-8 bg-card/50 backdrop-blur border-2">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-2xl">
                    <Target className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Visibilité multipliée</h3>
                <p className="text-foreground/70">
                  Quand la puissance du digital rencontre l'ancrage local, ça donne une visibilité multipliée !
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <img 
                src={discoverImage} 
                alt="Découvrir PromoJour" 
                className="w-full rounded-2xl shadow-xl"
              />
            </div>
            
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-4xl font-bold">
                Un seul tableau de bord pour toutes vos promos
              </h2>
              <p className="text-lg text-foreground/80">
                La force de PromoJour est de réunir en un seul endroit tout votre contenu promotionnel. Ici, vous créez, gérez et diffusez directement vos promotions sur vos réseaux sociaux.
              </p>
              <p className="text-xl font-semibold text-primary">
                Et tout ça, en divisant vos coûts par 100 !
              </p>
              <div className="flex gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Facebook className="h-8 w-8 text-[#1877F2]" />
                  <Instagram className="h-8 w-8 text-[#E4405F]" />
                  <div className="p-1 bg-coral/10 rounded">
                    <MapPin className="h-6 w-6 text-coral" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-br from-background via-yellow/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Fonctionnalités complètes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer et diffuser vos promotions efficacement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all border-2 hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-foreground/70 text-sm">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 space-y-32">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full">
                  <benefit.icon className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Avantage</span>
                </div>
                <h2 className="text-4xl font-bold">{benefit.title}</h2>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
              
              <div className={`relative ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl transform rotate-3" />
                <img 
                  src={benefit.image} 
                  alt={benefit.title} 
                  className="relative w-full rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-teal/5">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden border-2 border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-teal/10" />
            <div className="relative p-12 text-center space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold">
                Prêt à révolutionner votre communication locale ?
              </h2>
              <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
                Rejoignez les commerçants qui ont déjà adopté PromoJour et multipliez votre visibilité.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth")} className="shadow-lg hover:shadow-xl">
                  Commencer gratuitement
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Demander une démo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Sans engagement • Essai gratuit • Support dédié
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={logoPromoJour} alt="PromoJour" className="h-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PromoJour. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
