import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Store, Users, TrendingUp, Zap, Instagram, Mail, QrCode, BarChart3 } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

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
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero"></div>
            <span className="text-xl font-bold">PromoJour</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Connexion
            </Button>
            <Button className="gradient-primary text-white shadow-glow" onClick={() => navigate("/auth")}>
              Essai gratuit
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Diffusez vos promotions sur tous vos canaux
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            PromoJour remplace vos catalogues papier et maximise la visibilité locale de vos offres commerciales sur les réseaux sociaux, Google, email et plus encore.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" className="gradient-primary text-white shadow-glow h-12 px-8" onClick={() => navigate("/auth")}>
              Commencer gratuitement
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Magasins actifs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Promotions publiées</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">2M+</div>
              <div className="text-muted-foreground">Vues générées</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-xl text-muted-foreground">
            Une plateforme complète pour gérer et diffuser vos promotions
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="border-2 hover:border-primary/50 transition-smooth hover:shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choisissez votre plan</h2>
            <p className="text-xl text-muted-foreground">
              Commencez gratuitement, évoluez selon vos besoins
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
              <Card key={idx} className={plan.popular ? "border-primary border-2 shadow-xl" : ""}>
                <CardContent className="p-8">
                  {plan.popular && (
                    <div className="gradient-primary text-white text-sm font-semibold py-1 px-3 rounded-full inline-block mb-4">
                      Populaire
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={plan.popular ? "w-full gradient-primary text-white shadow-glow" : "w-full"}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="gradient-hero text-white border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Prêt à booster vos promotions ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez des centaines de commerçants qui font confiance à PromoJour
            </p>
            <Button size="lg" variant="secondary" className="h-12 px-8" onClick={() => navigate("/auth")}>
              Commencer maintenant
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 PromoJour. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
