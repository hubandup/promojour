import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Store, Users, TrendingUp, Zap, Instagram, Mail, QrCode, BarChart3, User, Settings, LogOut, ChevronDown } from "lucide-react";
import logoPromoJour from "@/assets/logo-promojour.png";
import { useUserData } from "@/hooks/use-user-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { profile, loading } = useUserData();
  const { toast } = useToast();

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
      navigate("/");
    }
  };

  const features = [
    {
      icon: Store,
      title: "Multi-magasins",
      description: "Gérez toutes vos promotions depuis une seule plateforme"
    },
    {
      icon: Instagram,
      title: "Réseaux sociaux",
      description: "Publication automatique sur Instagram, Facebook et Google Business"
    },
    {
      icon: QrCode,
      title: "QR Codes dynamiques",
      description: "Remplacez vos catalogues papier par des QR codes intelligents"
    },
    {
      icon: Mail,
      title: "Email & SMS",
      description: "Diffusez vos promotions par email et SMS en quelques clics"
    },
    {
      icon: BarChart3,
      title: "Statistiques détaillées",
      description: "Suivez l'impact de chaque promotion en temps réel"
    },
    {
      icon: Zap,
      title: "Automatisation",
      description: "Créez des campagnes qui se publient automatiquement"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "0€",
      period: "/mois",
      features: ["1 magasin", "7 promotions / 7 jours", "Statistiques limitées", "Support communauté"],
      cta: "Commencer gratuitement"
    },
    {
      name: "Pro",
      price: "49€",
      period: "/mois",
      features: ["5 magasins", "Promotions illimitées", "Stats complètes", "Support prioritaire"],
      cta: "Démarrer l'essai gratuit",
      popular: true
    },
    {
      name: "Centrale",
      price: "Sur mesure",
      period: "",
      features: ["Magasins illimités", "Utilisateurs illimités", "API & webhooks", "Account manager dédié"],
      cta: "Nous contacter"
    }
  ];

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Navbar */}
      <nav className="glass-card sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoPromoJour} alt="PromoJour" className="h-11" />
          </div>
          <div className="flex items-center gap-3">
            {!loading && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="font-medium flex items-center gap-2 hover:bg-primary/5"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {profile.first_name?.[0] || profile.last_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {profile.first_name && profile.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : profile.first_name || profile.last_name || "Mon compte"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass-card border-border/50 z-50 bg-background" align="end">
                  <DropdownMenuLabel className="font-medium">
                    Mon compte
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem 
                    onClick={() => navigate("/dashboard")}
                    className="cursor-pointer hover:bg-primary/5"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon compte</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer hover:bg-primary/5"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Paramètres</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="cursor-pointer hover:bg-destructive/10 text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium">
                  Connexion
                </Button>
                <Button className="gradient-primary text-white shadow-glow hover:shadow-xl transition-smooth font-medium" onClick={() => navigate("/auth")}>
                  Essai gratuit
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-32 text-center relative">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-block mb-6 px-6 py-2 glass-card rounded-full">
            <p className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ✨ La plateforme tout-en-un pour vos promotions
            </p>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">
            Diffusez vos promotions sur tous vos canaux
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            PromoJour remplace vos catalogues papier et maximise la visibilité locale de vos offres commerciales sur les réseaux sociaux, Google, email et plus encore.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" className="gradient-primary text-white shadow-glow hover:shadow-xl transition-smooth h-14 px-10 text-lg font-medium rounded-full" onClick={() => navigate("/auth")}>
              Commencer gratuitement
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-medium rounded-full border-2 hover:bg-primary/5">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">500+</div>
              <div className="text-muted-foreground">Commerçants actifs</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">+40%</div>
              <div className="text-muted-foreground">Visibilité moyenne</div>
            </div>
            <div className="text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">10k+</div>
              <div className="text-muted-foreground">Promotions créées</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-6">Une plateforme complète</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Tout ce dont vous avez besoin pour créer, diffuser et analyser vos promotions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card hover:shadow-glass transition-smooth border-border/50 group hover:scale-105">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-bounce">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6">Tarifs simples et transparents</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Choisissez le plan qui correspond à vos besoins, sans engagement</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`glass-card hover:shadow-glass transition-smooth ${plan.popular ? 'border-primary border-2 shadow-glow scale-105 relative' : 'border-border/50'}`}>
                <CardContent className="pt-8 pb-8 px-8">
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="gradient-primary text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg">
                        ⭐ Plus populaire
                      </span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                  <div className="mb-8">
                    <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{plan.price}</span>
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full h-12 text-base font-semibold rounded-xl transition-smooth ${plan.popular ? 'gradient-primary text-white shadow-glow hover:shadow-xl' : 'border-2'}`} variant={plan.popular ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-32 text-center">
        <Card className="max-w-5xl mx-auto gradient-primary text-white border-0 shadow-glow overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          <CardContent className="pt-16 pb-16 px-8 relative z-10">
            <h2 className="text-5xl font-bold mb-6">Prêt à transformer vos promotions ?</h2>
            <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Rejoignez des centaines de commerçants qui ont déjà fait le choix PromoJour
            </p>
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold rounded-full hover:scale-105 transition-bounce bg-white text-primary hover:bg-white/90" onClick={() => navigate("/auth")}>
              Commencer gratuitement →
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 glass-card">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p className="text-base">&copy; 2025 PromoJour. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
