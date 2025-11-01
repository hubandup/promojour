import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, Gift, Shield } from "lucide-react";

const Account = () => {
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
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
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
                  <Input placeholder="Jean" />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input placeholder="Dupont" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="jean.dupont@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input placeholder="+33 6 12 34 56 78" />
              </div>
              <Button>Enregistrer les modifications</Button>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Facturation</CardTitle>
                  <CardDescription>Gérez vos informations de paiement</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium">•••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expire 12/25</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Modifier</Button>
              </div>
              <Button variant="outline" className="w-full">Ajouter une carte</Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
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
                <Input type="password" placeholder="Nouveau mot de passe" />
              </div>
              <Button variant="outline">Mettre à jour</Button>
              <div className="pt-4 border-t">
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  Supprimer mon compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Plan */}
          <Card className="gradient-primary text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">Plan actuel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold mb-2">Free</div>
                <Badge variant="secondary" className="mb-4">Gratuit</Badge>
              </div>
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <span>1 magasin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <span>7 promos / 7 jours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <span>Stats limitées</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full">
                Passer à Pro
              </Button>
            </CardContent>
          </Card>

          {/* Referral */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Parrainage</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Invitez vos amis et gagnez 1 mois gratuit pour chaque parrainage !
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Votre code</p>
                <p className="font-mono font-bold">PROMO2025</p>
              </div>
              <Button variant="outline" className="w-full">Copier le lien</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;
