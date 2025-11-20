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
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Personnalisez l'apparence de vos promotions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth">
              <div className="space-y-0.5">
                <Label className="font-semibold">Logo personnalisé</Label>
                <p className="text-sm text-muted-foreground">Utilisez votre logo sur les promotions</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth">
              <div className="space-y-0.5">
                <Label className="font-semibold">Couleurs de marque</Label>
                <p className="text-sm text-muted-foreground">Appliquez votre charte graphique</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl">Configurer</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-md">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Gérez vos préférences de notification</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth">
              <div className="space-y-0.5">
                <Label className="font-semibold">Notifications email</Label>
                <p className="text-sm text-muted-foreground">Recevoir des emails de rappel</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth">
              <div className="space-y-0.5">
                <Label className="font-semibold">Alertes de performance</Label>
                <p className="text-sm text-muted-foreground">Statistiques hebdomadaires</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth">
              <div className="space-y-0.5">
                <Label className="font-semibold">Conseils & astuces</Label>
                <p className="text-sm text-muted-foreground">Optimisez vos promotions</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* API & Webhooks */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shadow-md">
                <Webhook className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>API & Webhooks</CardTitle>
                <CardDescription>Connectez vos outils externes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-5 bg-gradient-to-br from-muted/50 to-muted rounded-xl border border-border/50">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Connectez PromoJour avec Zapier, Make ou vos outils favoris
              </p>
              <Button variant="outline" className="w-full rounded-xl hover:shadow-md transition-smooth">Configurer les webhooks</Button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Intégrations</CardTitle>
                <CardDescription>Connectez vos outils favoris</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md hover:border-primary/20 transition-smooth">
              <div>
                <p className="font-semibold text-sm">Canva</p>
                <p className="text-xs text-muted-foreground mt-0.5">Design automatique</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl">Connecter</Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md hover:border-primary/20 transition-smooth">
              <div>
                <p className="font-semibold text-sm">Google Drive</p>
                <p className="text-xs text-muted-foreground mt-0.5">Stockage d'images</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl">Connecter</Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md hover:border-primary/20 transition-smooth">
              <div>
                <p className="font-semibold text-sm">Brevo (Email/SMS)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Communication clients</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl">Connecter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;