import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Palette, Bell, Webhook, Key } from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Réglages</h1>
        <p className="text-muted-foreground">Configurez votre application</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Personnalisez l'apparence de vos promotions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Logo personnalisé</Label>
                <p className="text-sm text-muted-foreground">Utilisez votre logo sur les promotions</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Couleurs de marque</Label>
                <p className="text-sm text-muted-foreground">Appliquez votre charte graphique</p>
              </div>
              <Button variant="outline" size="sm">Configurer</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Gérez vos préférences de notification</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications email</Label>
                <p className="text-sm text-muted-foreground">Recevoir des emails de rappel</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertes de performance</Label>
                <p className="text-sm text-muted-foreground">Statistiques hebdomadaires</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Conseils & astuces</Label>
                <p className="text-sm text-muted-foreground">Optimisez vos promotions</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* API & Webhooks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <CardTitle>API & Webhooks</CardTitle>
                <CardDescription>Connectez vos outils externes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Connectez PromoJour avec Zapier, Make ou vos outils favoris
              </p>
              <Button variant="outline" className="w-full">Configurer les webhooks</Button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Key className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Intégrations</CardTitle>
                <CardDescription>Connectez vos outils favoris</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Canva</p>
                <p className="text-xs text-muted-foreground">Design automatique</p>
              </div>
              <Button variant="outline" size="sm">Connecter</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Google Drive</p>
                <p className="text-xs text-muted-foreground">Stockage d'images</p>
              </div>
              <Button variant="outline" size="sm">Connecter</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-sm">Brevo (Email/SMS)</p>
                <p className="text-xs text-muted-foreground">Communication clients</p>
              </div>
              <Button variant="outline" size="sm">Connecter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
