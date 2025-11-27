import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Bell, Key, Building2, Settings2, Plus, Edit, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePromotionalMechanics } from "@/hooks/use-promotional-mechanics";
import { PromotionalMechanicDialog } from "@/components/PromotionalMechanicDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Settings = () => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mechanicDialogOpen, setMechanicDialogOpen] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mechanicToDelete, setMechanicToDelete] = useState<string | null>(null);
  const [brandingColor, setBrandingColor] = useState("#8B5CF6");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [performanceAlerts, setPerformanceAlerts] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(false);
  
  const { mechanics, createMechanic, updateMechanic, deleteMechanic } = usePromotionalMechanics();

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

  const handleSaveMechanic = (data: any) => {
    if (editingMechanic) {
      updateMechanic({ id: editingMechanic.id, ...data });
    } else {
      createMechanic(data);
    }
    setEditingMechanic(null);
  };

  const handleEditMechanic = (mechanic: any) => {
    setEditingMechanic(mechanic);
    setMechanicDialogOpen(true);
  };

  const handleDeleteClick = (mechanicId: string) => {
    setMechanicToDelete(mechanicId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (mechanicToDelete) {
      deleteMechanic(mechanicToDelete);
      setMechanicToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSaveBranding = async () => {
    try {
      // TODO: Save branding settings to database
      toast.success("Paramètres de branding enregistrés");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleSaveIntegrations = async () => {
    try {
      // TODO: Save integrations settings to database
      toast.success("Paramètres d'intégration enregistrés");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleSaveNotifications = async () => {
    try {
      // TODO: Save notification preferences to database
      toast.success("Préférences de notification enregistrées");
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

      {/* Tabs */}
      <Tabs defaultValue="enseigne" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="enseigne">Mon Enseigne</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="integrations">Intégrations</TabsTrigger>
          <TabsTrigger value="mechanics">Mécaniques</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Mon Enseigne */}
        <TabsContent value="enseigne" className="space-y-6">
          <Card className="glass-card border-border/50">
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
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding" className="space-y-6">
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
              <div className="space-y-2">
                <Label>Couleur du bouton des promotions</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={brandingColor}
                    onChange={(e) => setBrandingColor(e.target.value)}
                    className="w-20 h-12 rounded-xl cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez la couleur qui sera appliquée aux boutons CTA de vos promotions
                  </p>
                </div>
              </div>
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

              <Button
                onClick={handleSaveBranding}
                className="rounded-xl w-full"
              >
                Enregistrer les modifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intégrations */}
        <TabsContent value="integrations" className="space-y-6">
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
                  <p className="font-semibold text-sm">Dropbox</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Stockage de fichiers</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl">Connecter</Button>
              </div>

              <Button
                onClick={handleSaveIntegrations}
                className="rounded-xl w-full"
              >
                Enregistrer les modifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mécaniques Promotionnelles */}
        <TabsContent value="mechanics" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Settings2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Mécaniques promotionnelles</CardTitle>
                    <CardDescription>Gérez les types de promotions disponibles</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setEditingMechanic(null);
                    setMechanicDialogOpen(true);
                  }}
                  className="rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle mécanique
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mechanics.map((mechanic) => (
                  <div
                    key={mechanic.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 hover:shadow-md transition-smooth"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{mechanic.name}</p>
                        <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted">
                          {mechanic.code}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mechanic.fields.length} champ{mechanic.fields.length > 1 ? "s" : ""} défini{mechanic.fields.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMechanic(mechanic)}
                        className="rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(mechanic.id)}
                        className="rounded-lg text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {mechanics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune mécanique promotionnelle configurée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
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
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth">
                <div className="space-y-0.5">
                  <Label className="font-semibold">Alertes de performance</Label>
                  <p className="text-sm text-muted-foreground">Statistiques hebdomadaires</p>
                </div>
                <Switch checked={performanceAlerts} onCheckedChange={setPerformanceAlerts} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/50 hover:shadow-md transition-smooth">
                <div className="space-y-0.5">
                  <Label className="font-semibold">Conseils & astuces</Label>
                  <p className="text-sm text-muted-foreground">Optimisez vos promotions</p>
                </div>
                <Switch checked={tipsEnabled} onCheckedChange={setTipsEnabled} />
              </div>

              <Button
                onClick={handleSaveNotifications}
                className="rounded-xl w-full"
              >
                Enregistrer les modifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PromotionalMechanicDialog
        open={mechanicDialogOpen}
        onOpenChange={setMechanicDialogOpen}
        mechanic={editingMechanic}
        onSave={handleSaveMechanic}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette mécanique promotionnelle ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;