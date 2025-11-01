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
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Informations principales de votre magasin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du magasin</Label>
                <Input placeholder="Mon Commerce" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Votre meilleur magasin de..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input placeholder="+33 1 23 45 67 89" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="contact@magasin.fr" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adresse & Localisation</CardTitle>
              <CardDescription>Informations de localisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Adresse complète</Label>
                <Input placeholder="123 Rue de la Paix" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Code postal</Label>
                  <Input placeholder="75001" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Ville</Label>
                  <Input placeholder="Paris" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horaires d'ouverture</CardTitle>
              <CardDescription>Définissez vos horaires hebdomadaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 font-medium text-sm">{day}</div>
                    <Input placeholder="09:00" className="w-28" />
                    <span className="text-muted-foreground">-</span>
                    <Input placeholder="19:00" className="w-28" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Couverture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Logo</span>
              </div>
              <Button variant="outline" className="w-full">Changer le logo</Button>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Image de couverture</span>
              </div>
              <Button variant="outline" className="w-full">Changer l'image</Button>
            </CardContent>
          </Card>

          <Card className="gradient-primary text-white border-0">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code unique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-white rounded-lg flex items-center justify-center mb-4">
                <QrCode className="w-24 h-24 text-primary" />
              </div>
              <Button variant="secondary" className="w-full">
                Télécharger le QR Code
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Instagram className="w-5 h-5 text-pink-500" />
                <span className="text-sm">Non connecté</span>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Non connecté</span>
              </div>
              <Button variant="outline" className="w-full">
                Connecter réseaux
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="gradient-primary text-white shadow-glow">
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
};

export default Store;
