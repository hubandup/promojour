import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import logoPromoJour from "@/assets/logo-promojour.svg";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { checkSubscription, subscription } = useSubscription();

  useEffect(() => {
    // Refresh subscription status after successful payment
    checkSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Accéder au Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* Success Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-2xl w-full">
          <Card className="border-2 border-primary/20 shadow-2xl">
            <CardContent className="p-12 text-center space-y-8">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold">
                  Paiement réussi !
                </h1>
                <p className="text-xl text-muted-foreground">
                  Votre abonnement a été activé avec succès
                </p>
              </div>

              {/* Subscription Details */}
              <div className="p-6 rounded-2xl bg-muted/50 border border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Formule</span>
                  <span className="font-bold text-lg">
                    {subscription.tier === "magasin_pro" ? "Magasin Pro" : 
                     subscription.tier === "centrale" ? "Centrale" : "Free"}
                  </span>
                </div>
                {subscription.subscription_end && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Prochain renouvellement</span>
                    <span className="font-medium">
                      {new Date(subscription.subscription_end).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
              </div>

              {/* Next Steps */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold">Prochaines étapes</h3>
                <ul className="text-left space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Configurez votre premier magasin dans les paramètres</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Connectez vos réseaux sociaux (Facebook, Instagram, Google)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Créez votre première promotion et diffusez-la</span>
                  </li>
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/dashboard")}
                >
                  Accéder au Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate("/account")}
                >
                  Gérer mon abonnement
                </Button>
              </div>

              {/* Support */}
              <p className="text-sm text-muted-foreground pt-4">
                Besoin d'aide ? Contactez notre support à{" "}
                <a href="mailto:support@promojour.fr" className="text-primary hover:underline">
                  support@promojour.fr
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
