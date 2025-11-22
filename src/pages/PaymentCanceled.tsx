import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import logoPromoJour from "@/assets/logo-promojour.png";

export default function PaymentCanceled() {
  const navigate = useNavigate();

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
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate("/pricing")}>
                Voir les tarifs
              </Button>
              <Button onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Canceled Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-2xl w-full">
          <Card className="border-2 border-border shadow-xl">
            <CardContent className="p-12 text-center space-y-8">
              {/* Canceled Icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <XCircle className="w-16 h-16 text-muted-foreground" />
                </div>
              </div>

              {/* Canceled Message */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold">
                  Paiement annulé
                </h1>
                <p className="text-xl text-muted-foreground">
                  Votre paiement a été annulé. Aucun montant n'a été débité.
                </p>
              </div>

              {/* Reassurance */}
              <div className="p-6 rounded-2xl bg-muted/50 border border-border space-y-3 text-left">
                <h3 className="font-bold">Que s'est-il passé ?</h3>
                <p className="text-sm text-muted-foreground">
                  Vous avez quitté la page de paiement avant de finaliser votre abonnement. 
                  Aucune transaction n'a été effectuée et votre carte n'a pas été débitée.
                </p>
              </div>

              {/* Options */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold">Que souhaitez-vous faire ?</h3>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/pricing")}>
                    <CardContent className="p-6 space-y-3">
                      <CreditCard className="w-8 h-8 text-primary" />
                      <h4 className="font-bold">Réessayer le paiement</h4>
                      <p className="text-sm text-muted-foreground">
                        Retournez sur la page de tarification pour choisir votre formule
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/dashboard")}>
                    <CardContent className="p-6 space-y-3">
                      <ArrowLeft className="w-8 h-8 text-primary" />
                      <h4 className="font-bold">Continuer avec Free</h4>
                      <p className="text-sm text-muted-foreground">
                        Profitez de la formule gratuite en attendant
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/pricing")}
                >
                  Voir les tarifs
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate("/dashboard")}
                >
                  Retour au Dashboard
                </Button>
              </div>

              {/* Support */}
              <p className="text-sm text-muted-foreground pt-4">
                Des questions ? Contactez-nous à{" "}
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
