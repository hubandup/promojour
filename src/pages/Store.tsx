import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, Globe, Instagram, Facebook, QrCode } from "lucide-react";

const Store = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mon Magasin</h1>
        <p className="text-muted-foreground">Gérez les informations de votre magasin</p>
      </div>

      {/* Store Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Informations principales de votre magasin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du magasin</Label>
                <Input placeholder="Mon Commerce" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Votre meilleur magasin de..." className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input placeholder="+33 1 23 45 67 89" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="contact@magasin.fr" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Adresse & Localisation</CardTitle>
              <CardDescription>Informations de localisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Adresse complète</Label>
                <Input placeholder="123 Rue de la Paix" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Code postal</Label>
                  <Input placeholder="75001" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Ville</Label>
                  <Input placeholder="Paris" className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Horaires d'ouverture</CardTitle>
              <CardDescription>Définissez vos horaires hebdomadaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 font-medium text-sm">{day}</div>
                    <Input placeholder="09:00" className="w-28 rounded-xl border-border/50 bg-background/50" />
                    <span className="text-muted-foreground">-</span>
                    <Input placeholder="19:00" className="w-28 rounded-xl border-border/50 bg-background/50" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Logo & Couverture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-xl flex items-center justify-center border border-border/50">
                <span className="text-muted-foreground font-medium">Logo</span>
              </div>
              <Button variant="outline" className="w-full rounded-xl hover:shadow-md transition-smooth">Changer le logo</Button>
              <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted rounded-xl flex items-center justify-center border border-border/50">
                <span className="text-muted-foreground font-medium">Image de couverture</span>
              </div>
              <Button variant="outline" className="w-full rounded-xl hover:shadow-md transition-smooth">Changer l'image</Button>
            </CardContent>
          </Card>

          <Card className="gradient-primary text-white border-0 shadow-glow">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code unique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-white rounded-xl flex items-center justify-center mb-4 shadow-md">
                <QrCode className="w-24 h-24 text-primary" />
              </div>
              <Button variant="secondary" className="w-full rounded-xl hover:shadow-md transition-smooth">
                Télécharger le QR Code
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md transition-smooth">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-pink-500" />
                </div>
                <span className="text-sm font-medium">Non connecté</span>
              </div>
              <div className="flex items-center gap-3 p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md transition-smooth">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Non connecté</span>
              </div>
              <Button variant="outline" className="w-full rounded-xl hover:shadow-md transition-smooth">
                Connecter réseaux
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="gradient-primary text-white shadow-glow rounded-xl">
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
};

export default Store;