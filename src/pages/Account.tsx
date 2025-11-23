import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, Gift, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

const Account = () => {
  const { subscription, loading, createCheckoutSession, openCustomerPortal, tiers } = useSubscription();
  const { toast } = useToast();
  const [storeCount, setStoreCount] = useState(1);
  const [showCentraleConfig, setShowCentraleConfig] = useState(false);

  const getCurrentPlanName = () => {
    switch (subscription.tier) {
      case "magasin_pro":
        return "Magasin Pro";
      case "centrale":
        return "Centrale";
      default:
        return "Free";
    }
  };

  const handleUpgrade = (priceId: string, quantity?: number) => {
    createCheckoutSession(priceId, quantity);
  };

  const handleCentraleUpgrade = () => {
    handleUpgrade(tiers.centrale.price_id, storeCount);
    setShowCentraleConfig(false);
  };

  const calculateCentralePrice = () => {
    return 180 + (storeCount * 19);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mon Compte</h1>
        <p className="text-muted-foreground">Gérez votre profil et votre abonnement</p>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Profil utilisateur</CardTitle>
                  <CardDescription>Vos informations personnelles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input placeholder="Jean" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input placeholder="Dupont" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="jean.dupont@email.com" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input placeholder="+33 6 12 34 56 78" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
              </div>
              <Button className="rounded-xl hover:shadow-md transition-smooth">Enregistrer les modifications</Button>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-md">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Facturation</CardTitle>
                  <CardDescription>Gérez vos informations de paiement</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 border border-border/50 rounded-xl flex items-center justify-between bg-card/50 hover:shadow-md transition-smooth">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-10 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                    VISA
                  </div>
                  <div>
                    <p className="font-semibold">•••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expire 12/25</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl">Modifier</Button>
              </div>
              <Button variant="outline" className="w-full rounded-xl hover:shadow-md transition-smooth">Ajouter une carte</Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Sécurité & confidentialité</CardTitle>
                  <CardDescription>Protégez votre compte</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Changer le mot de passe</Label>
                <Input type="password" placeholder="Nouveau mot de passe" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
              </div>
              <Button variant="outline" className="rounded-xl hover:shadow-md transition-smooth">Mettre à jour</Button>
              <div className="pt-4 border-t border-border/50">
                <Button variant="outline" className="text-destructive hover:text-destructive rounded-xl hover:shadow-md transition-smooth">
                  Supprimer mon compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Plan */}
          <Card className="gradient-primary text-white border-0 shadow-glow">
            <CardHeader>
              <CardTitle className="text-white">Plan actuel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-sm opacity-90">Chargement...</div>
              ) : (
                <>
                  <div>
                    <div className="text-4xl font-bold mb-2">{getCurrentPlanName()}</div>
                    <Badge variant="secondary" className="mb-4 rounded-xl">
                      {subscription.tier === "free" && "Gratuit"}
                      {subscription.tier === "magasin_pro" && "49€/mois"}
                      {subscription.tier === "centrale" && "180€/mois"}
                    </Badge>
                  </div>
                  <div className="space-y-3 text-sm opacity-95">
                    {subscription.tier === "free" && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>1 magasin</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>7 promos / 7 jours</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>Stats limitées</span>
                        </div>
                      </>
                    )}
                    {subscription.tier === "magasin_pro" && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>5 magasins max</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>Promotions illimitées</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>Stats complètes</span>
                        </div>
                      </>
                    )}
                    {subscription.tier === "centrale" && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>Magasins illimités</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>Utilisateurs illimités</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                          <span>Contrôle total</span>
                        </div>
                      </>
                    )}
                  </div>
                  {subscription.subscribed && subscription.subscription_end && (
                    <p className="text-xs opacity-80">
                      Renouvellement le {new Date(subscription.subscription_end).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  {!subscription.subscribed && !showCentraleConfig && (
                    <div className="space-y-2">
                      <Button 
                        variant="secondary" 
                        className="w-full rounded-xl hover:shadow-md transition-smooth"
                        onClick={() => handleUpgrade(tiers.magasin_pro.price_id)}
                      >
                        Souscrire à Pro - 49€/mois
                      </Button>
                      <Button 
                        className="w-full rounded-xl hover:shadow-md transition-smooth bg-white/20 text-white hover:bg-white/30 border border-white/40"
                        onClick={() => setShowCentraleConfig(true)}
                      >
                        Souscrire à Centrale
                      </Button>
                    </div>
                  )}
                  {!subscription.subscribed && showCentraleConfig && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Nombre de magasins</Label>
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-xl text-white border-white/30 hover:bg-white/10"
                            onClick={() => setStoreCount(Math.max(1, storeCount - 1))}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="flex-1 text-center">
                            <div className="text-3xl font-bold text-white">{storeCount}</div>
                            <div className="text-xs text-white/70">magasin{storeCount > 1 ? 's' : ''}</div>
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-xl text-white border-white/30 hover:bg-white/10"
                            onClick={() => setStoreCount(storeCount + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-white/80 space-y-1 mt-3">
                          <div className="flex justify-between">
                            <span>Base Centrale:</span>
                            <span className="font-semibold">180€/mois</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{storeCount} magasin{storeCount > 1 ? 's' : ''} × 19€:</span>
                            <span className="font-semibold">{storeCount * 19}€/mois</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-white/20 text-base">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold">{calculateCentralePrice()}€/mois</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-xl hover:shadow-md transition-smooth text-white border-white/30 hover:bg-white/10"
                          onClick={() => setShowCentraleConfig(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          variant="secondary" 
                          className="flex-1 rounded-xl hover:shadow-md transition-smooth"
                          onClick={handleCentraleUpgrade}
                        >
                          Confirmer
                        </Button>
                      </div>
                    </div>
                  )}
                  {subscription.subscribed && subscription.tier === "magasin_pro" && !showCentraleConfig && (
                    <div className="space-y-2">
                      <Button 
                        variant="secondary" 
                        className="w-full rounded-xl hover:shadow-md transition-smooth"
                        onClick={() => setShowCentraleConfig(true)}
                      >
                        Passer à Centrale
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full rounded-xl hover:shadow-md transition-smooth text-white border-white/30 hover:bg-white/10"
                        onClick={openCustomerPortal}
                      >
                        Gérer mon abonnement
                      </Button>
                    </div>
                  )}
                  {subscription.subscribed && subscription.tier === "magasin_pro" && showCentraleConfig && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Nombre de magasins</Label>
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-xl text-white border-white/30 hover:bg-white/10"
                            onClick={() => setStoreCount(Math.max(1, storeCount - 1))}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="flex-1 text-center">
                            <div className="text-3xl font-bold text-white">{storeCount}</div>
                            <div className="text-xs text-white/70">magasin{storeCount > 1 ? 's' : ''}</div>
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            className="rounded-xl text-white border-white/30 hover:bg-white/10"
                            onClick={() => setStoreCount(storeCount + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-white/80 space-y-1 mt-3">
                          <div className="flex justify-between">
                            <span>Base Centrale:</span>
                            <span className="font-semibold">180€/mois</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{storeCount} magasin{storeCount > 1 ? 's' : ''} × 19€:</span>
                            <span className="font-semibold">{storeCount * 19}€/mois</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-white/20 text-base">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold">{calculateCentralePrice()}€/mois</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-xl hover:shadow-md transition-smooth text-white border-white/30 hover:bg-white/10"
                          onClick={() => setShowCentraleConfig(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          variant="secondary" 
                          className="flex-1 rounded-xl hover:shadow-md transition-smooth"
                          onClick={handleCentraleUpgrade}
                        >
                          Confirmer
                        </Button>
                      </div>
                    </div>
                  )}
                  {subscription.subscribed && subscription.tier === "centrale" && (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl hover:shadow-md transition-smooth text-white border-white/30 hover:bg-white/10"
                      onClick={openCustomerPortal}
                    >
                      Gérer mon abonnement
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Referral */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Parrainage</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Invitez vos amis et gagnez 1 mois gratuit pour chaque parrainage !
              </p>
              <div className="p-4 bg-gradient-to-br from-muted/50 to-muted rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Votre code</p>
                <p className="font-mono font-bold text-lg">PROMO2025</p>
              </div>
              <Button variant="outline" className="w-full rounded-xl hover:shadow-md transition-smooth">Copier le lien</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;