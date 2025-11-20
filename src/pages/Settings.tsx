import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette, Bell, Webhook, Key, Building2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();

      if (org) {
        setOrganization(org);
        setOrgName(org.name || "");
        setOrgDescription(org.description || "");
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `organizations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promotion-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('promotion-images')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from("organizations")
        .update({ logo_url: publicUrl })
        .eq("id", organization.id);

      if (error) throw error;

      setOrganization({ ...organization, logo_url: publicUrl });
      toast.success("Logo de l'enseigne uploadé");
    } catch (error) {
      console.error("Erreur upload:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}-cover-${Date.now()}.${fileExt}`;
      const filePath = `organizations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promotion-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('promotion-images')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from("organizations")
        .update({ cover_image_url: publicUrl })
        .eq("id", organization.id);

      if (error) throw error;

      setOrganization({ ...organization, cover_image_url: publicUrl });
      toast.success("Image de couverture uploadée");
    } catch (error) {
      console.error("Erreur upload:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!organization) return;

    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: orgName,
          description: orgDescription,
        })
        .eq("id", organization.id);

      if (error) throw error;

      setOrganization({ ...organization, name: orgName, description: orgDescription });
      toast.success("Organisation mise à jour");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Réglages</h1>
        <p className="text-muted-foreground">Configurez votre application</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization */}
        <Card className="glass-card border-border/50 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Mon Enseigne</CardTitle>
                <CardDescription>Informations et visuels de votre organisation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de l'enseigne</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="rounded-xl"
                  placeholder="Ex: Chausselandia"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  className="rounded-xl"
                  placeholder="Description de votre enseigne"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo de l'enseigne</Label>
                {organization?.logo_url && (
                  <div className="w-32 h-32 rounded-xl overflow-hidden border border-border mb-2">
                    <img
                      src={organization.logo_url}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl"
                >
                  {uploading ? "Upload..." : organization?.logo_url ? "Changer le logo" : "Uploader le logo"}
                </Button>
              </div>

              {/* Cover */}
              <div className="space-y-2">
                <Label>Image de couverture</Label>
                {organization?.cover_image_url && (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-border mb-2">
                    <img
                      src={organization.cover_image_url}
                      alt="Couverture"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl"
                >
                  {uploading ? "Upload..." : organization?.cover_image_url ? "Changer la couverture" : "Uploader la couverture"}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSaveOrganization}
              className="rounded-xl"
            >
              Enregistrer les modifications
            </Button>
          </CardContent>
        </Card>

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