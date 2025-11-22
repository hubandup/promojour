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
  ChevronRight,
  Sparkles
} from "lucide-react";
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
      color: "primary"
    },
    {
      icon: Zap,
      title: "Diffusion automatique",
      description: "Vos promotions sont automatiquement publiées sur Facebook, Instagram et Google My Business.",
      color: "yellow"
    },
    {
      icon: Calendar,
      title: "Planification intelligente",
      description: "Programmez vos publications à l'avance et optimisez votre calendrier promotionnel.",
      color: "teal"
    },
    {
      icon: Smartphone,
      title: "Accès mobile",
      description: "Gérez vos promotions n'importe où, n'importe quand depuis votre smartphone.",
      color: "orange"
    },
    {
      icon: Target,
      title: "Communication ciblée",
      description: "Atteignez précisément votre audience locale sur les canaux où elle est active.",
      color: "coral"
    },
    {
      icon: BarChart3,
      title: "Analyse du ROI",
      description: "Mesurez l'efficacité de vos campagnes avec des KPI détaillés et des analyses comportementales.",
      color: "primary"
    },
  ];

  const benefits = [
    {
      icon: QrCode,
      title: "Simplicité d'utilisation",
      description: "Interface intuitive et conviviale, sans expertise technique requise. Créez vos promotions en quelques clics.",
      color: "primary"
    },
    {
      icon: MapPin,
      title: "Communication locale et ciblée",
      description: "Diffusez vos promotions spécifiquement dans votre zone de chalandise, sur les canaux les plus pertinents.",
      color: "teal"
    },
    {
      icon: TrendingUp,
      title: "Analyse du ROI",
      description: "Mesurez le retour sur investissement avec des indicateurs de performance et comportement clients détaillés.",
      color: "orange"
    },
    {
      icon: BarChart3,
      title: "Maîtrise du budget",
      description: "Contrôlez et optimisez vos dépenses marketing grâce aux outils de suivi et d'analyse en temps réel.",
      color: "coral"
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 animate-fade-in">
            <img src={logoPromoJour} alt="PromoJour" className="h-10" />
          </div>
          
          <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {profile ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")} className="hover-scale">
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="hover-scale">
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="hover-scale">
                  Connexion
                </Button>
                <Button onClick={() => navigate("/auth")} className="hover-scale shadow-lg">
                  Essai gratuit
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow/20 via-background to-teal/10" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s" }} />
        <div className="absolute inset-0 pattern-crosses opacity-30" />
        
        <div className="container mx-auto px-6 py-24 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 animate-scale-in">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Nouvelle génération de promotion</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Créez, gérez et{" "}
                <span className="bg-gradient-to-r from-primary via-orange to-coral bg-clip-text text-transparent">
                  diffusez vos promos
                </span>
              </h1>
              
              <p className="text-2xl text-muted-foreground font-medium">
                Dès <span className="text-primary font-bold text-3xl">0€/mois</span>
              </p>
              
              <p className="text-lg text-foreground/80 leading-relaxed">
                La fin du prospectus approche : découvrez la plateforme qui vous permet de diffuser vos promotions{" "}
                <span className="font-semibold text-foreground">simplement et en temps réel</span> sur Facebook, Instagram et Google.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")} 
                  className="shadow-xl hover:shadow-2xl transition-all text-lg px-8 py-6 group hover-scale"
                >
                  Démarrer gratuitement
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/auth")}
                  className="border-2 text-lg px-8 py-6 hover-scale"
                >
                  Voir la démo
                </Button>
              </div>
              
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  <Facebook className="h-10 w-10 text-[#1877F2] drop-shadow-lg" />
                  <Instagram className="h-10 w-10 text-[#E4405F] drop-shadow-lg" />
                  <div className="p-2 bg-coral rounded-full">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">500+</span> commerçants actifs
                </p>
              </div>
            </div>
            
            <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-orange/30 to-coral/30 rounded-3xl blur-3xl animate-pulse" style={{ animationDuration: "3s" }} />
              <div className="relative p-16 bg-gradient-to-br from-background/80 to-muted/80 backdrop-blur-xl rounded-3xl border-2 border-primary/20 shadow-2xl">
                <div className="grid grid-cols-2 gap-8">
                  <div className="p-8 bg-gradient-to-br from-primary/20 to-orange/20 rounded-2xl backdrop-blur border border-primary/30">
                    <Smartphone className="h-16 w-16 text-primary mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Mobile First</h3>
                    <p className="text-foreground/70">Gérez partout</p>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-teal/20 to-primary/20 rounded-2xl backdrop-blur border border-teal/30">
                    <Zap className="h-16 w-16 text-teal mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Automatique</h3>
                    <p className="text-foreground/70">Diffusion instantanée</p>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-orange/20 to-coral/20 rounded-2xl backdrop-blur border border-orange/30">
                    <BarChart3 className="h-16 w-16 text-orange mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Analytics</h3>
                    <p className="text-foreground/70">ROI mesurable</p>
                  </div>
                  <div className="p-8 bg-gradient-to-br from-coral/20 to-yellow/20 rounded-2xl backdrop-blur border border-coral/30">
                    <Target className="h-16 w-16 text-coral mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Ciblage</h3>
                    <p className="text-foreground/70">Local précis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Stats Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 via-background to-yellow/5" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-primary via-teal to-orange bg-clip-text text-transparent">
              Au cœur du commerce local
            </h2>
            <p className="text-2xl text-foreground/80 font-medium">
              Plus d'<span className="text-primary font-bold">1 français sur 2</span> interagit avec les QR codes en 2024
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mt-16">
              <Card className="p-10 bg-gradient-to-br from-teal/10 to-background backdrop-blur border-2 border-teal/20 hover:shadow-xl transition-all hover:-translate-y-2 duration-300 group">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-5 bg-teal/20 rounded-3xl group-hover:scale-110 transition-transform">
                    <QrCode className="h-16 w-16 text-teal" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-4">QR Code unique</h3>
                <p className="text-foreground/70 text-lg leading-relaxed">
                  En plus de diffuser vos promotions en ligne, vous générez un QR code unique pour vos supports de proximité : affiches, PLV, presse locale, flyers…
                </p>
              </Card>
              
              <Card className="p-10 bg-gradient-to-br from-primary/10 to-background backdrop-blur border-2 border-primary/20 hover:shadow-xl transition-all hover:-translate-y-2 duration-300 group">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-5 bg-primary/20 rounded-3xl group-hover:scale-110 transition-transform">
                    <Target className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-4">Visibilité multipliée</h3>
                <p className="text-foreground/70 text-lg leading-relaxed">
                  Quand la puissance du digital rencontre l'ancrage local, ça donne une visibilité <span className="font-bold text-primary">multipliée !</span>
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange/5 via-background to-coral/5" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-12 animate-fade-in">
            <h2 className="text-5xl font-bold leading-tight">
              Un seul tableau de bord pour{" "}
              <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">
                toutes vos promos
              </span>
            </h2>
            <p className="text-2xl text-foreground/80 leading-relaxed">
              La force de PromoJour est de <span className="font-semibold text-foreground">réunir en un seul endroit</span> tout votre contenu promotionnel. 
              Créez, gérez et diffusez directement vos promotions sur vos réseaux sociaux.
            </p>
            <Card className="p-12 bg-gradient-to-br from-primary/10 via-orange/10 to-coral/10 backdrop-blur border-2 border-primary/20 hover:shadow-2xl transition-all duration-300">
              <p className="text-4xl font-bold bg-gradient-to-r from-primary via-orange to-coral bg-clip-text text-transparent">
                💰 Divisez vos coûts par 100 !
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow/5 via-background to-orange/5" />
        <div className="absolute inset-0 pattern-dots opacity-20" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-5xl font-bold mb-6">Fonctionnalités complètes</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tout ce dont vous avez besoin pour gérer et diffuser vos promotions efficacement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-8 hover:shadow-2xl transition-all border-2 hover:border-primary/30 hover:-translate-y-2 duration-300 group bg-gradient-to-br from-background to-muted/30 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-4 bg-${feature.color}/10 rounded-2xl group-hover:scale-110 transition-transform border border-${feature.color}/20`}>
                    <feature.icon className={`h-8 w-8 text-${feature.color}`} />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="font-bold text-xl">{feature.title}</h3>
                    <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-5xl font-bold mb-6">Avantages clés</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tout ce dont vous avez besoin pour réussir votre communication locale
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={index} 
                className="p-12 hover:shadow-2xl transition-all border-2 hover:border-primary/30 hover:-translate-y-2 duration-300 group bg-gradient-to-br from-background to-muted/30 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className={`p-6 bg-${benefit.color}/10 rounded-3xl group-hover:scale-110 transition-transform border-2 border-${benefit.color}/20`}>
                    <benefit.icon className={`h-16 w-16 text-${benefit.color}`} />
                  </div>
                  <h3 className="font-bold text-3xl">{benefit.title}</h3>
                  <p className="text-foreground/70 text-lg leading-relaxed">{benefit.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-orange/5 to-teal/10" />
        <div className="container mx-auto px-6 relative z-10">
          <Card className="relative overflow-hidden border-2 border-primary/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-orange/10 to-teal/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "3s" }} />
            
            <div className="relative p-16 text-center space-y-10">
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
                Prêt à révolutionner votre{" "}
                <span className="bg-gradient-to-r from-primary via-orange to-coral bg-clip-text text-transparent">
                  communication locale ?
                </span>
              </h2>
              <p className="text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
                Rejoignez les commerçants qui ont déjà adopté PromoJour et multipliez votre visibilité
              </p>
              <div className="flex flex-wrap gap-6 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")} 
                  className="shadow-2xl hover:shadow-3xl text-xl px-10 py-7 group hover-scale"
                >
                  Commencer gratuitement
                  <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 text-xl px-10 py-7 hover-scale"
                >
                  Demander une démo
                </Button>
              </div>
              <div className="flex items-center justify-center gap-8 pt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Essai gratuit
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Support dédié
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-6">
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
