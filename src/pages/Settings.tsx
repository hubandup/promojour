import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Bell, Key, Building2, Settings2, Plus, Edit, Trash2, User, CreditCard, Shield, FileText, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePromotionalMechanics } from "@/hooks/use-promotional-mechanics";
import { PromotionalMechanicDialog } from "@/components/PromotionalMechanicDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { GoogleMerchantSettings } from "@/components/GoogleMerchantSettings";
import { useStores } from "@/hooks/use-stores";
import { useUserData } from "@/hooks/use-user-data";
import { SocialConnectionsManager } from "@/components/SocialConnectionsManager";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [showGoogleMerchant, setShowGoogleMerchant] = useState(false);
  
  const { mechanics, createMechanic, updateMechanic, deleteMechanic } = usePromotionalMechanics();
  const { stores } = useStores();
  const firstStoreId = stores && stores.length > 0 ? stores[0].id : null;
  const { isStore, isFree, profile, loading: userLoading } = useUserData();
  const isSimplifiedView = isStore || isFree;

  // Store-specific state
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeRecord, setStoreRecord] = useState<any>(null);
  const { subscription } = useSubscription();

  // Store account tab state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [initialFirstName, setInitialFirstName] = useState("");
  const [initialLastName, setInitialLastName] = useState("");
  const [initialPhone, setInitialPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchOrganization();
    fetchUserPreferences();
    if (isSimplifiedView) {
      fetchAccountData();
    }
  }, [isSimplifiedView]);

  // Load store record for store users
  useEffect(() => {
    if (isSimplifiedView && stores && stores.length > 0) {
      const s = stores[0];
      setStoreRecord(s);
      setStoreName(s.name || "");
      setStoreDescription(s.description || "");
    }
  }, [isSimplifiedView, stores]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setInitialFirstName(profile.first_name || "");
      setInitialLastName(profile.last_name || "");
      setInitialPhone(profile.phone || "");
    }
  }, [profile]);

  const fetchAccountData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setEmail(user.email);
  };

  const accountHasChanges = firstName !== initialFirstName || lastName !== initialLastName || phone !== initialPhone || newPassword.length > 0;

  const handleSaveAccount = async () => {
    setIsSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName, phone })
        .eq("id", user.id);
      if (error) throw error;

      if (newPassword.length > 0) {
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) throw pwError;
      }

      setInitialFirstName(firstName);
      setInitialLastName(lastName);
      setInitialPhone(phone);
      setNewPassword("");
      toast.success("Informations mises à jour");
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profileData?.organization_id) return;

      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profileData.organization_id)
        .single();

      if (org) {
        setOrganization(org);
        setOrgName(org.name || "");
        setOrgDescription(org.description || "");
        setBrandingColor((org as any).branding_color || "#8B5CF6");
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

  const handleSaveStore = async () => {
    if (!storeRecord) return;

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          name: storeName,
          description: storeDescription,
        })
        .eq("id", storeRecord.id);

      if (error) throw error;

      // Also update org name to keep in sync
      if (organization) {
        await supabase
          .from("organizations")
          .update({ name: storeName, description: storeDescription })
          .eq("id", organization.id);
        setOrganization({ ...organization, name: storeName, description: storeDescription });
        setOrgName(storeName);
        setOrgDescription(storeDescription);
      }

      setStoreRecord({ ...storeRecord, name: storeName, description: storeDescription });
      toast.success("Magasin mis à jour");
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

  const fetchUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setEmailNotifications(data.email_notifications);
        setPerformanceAlerts(data.performance_alerts);
        setTipsEnabled(data.tips_enabled);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const handleSaveBranding = async () => {
    if (!organization) return;
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ branding_color: brandingColor } as any)
        .eq("id", organization.id);
      if (error) throw error;
      toast.success("Paramètres de branding enregistrés");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleSaveIntegrations = async () => {
    toast.success("Paramètres d'intégration enregistrés");
  };

  const handleSaveNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifications,
          performance_alerts: performanceAlerts,
          tips_enabled: tipsEnabled,
        }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Préférences de notification enregistrées");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const getCurrentPlanName = () => {
    switch (subscription.tier) {
      case "magasin_pro": return "Magasin Pro";
      case "centrale": return "Centrale";
      default: return "Free";
    }
  };

  // Loading guard
  if (userLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Réglages</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Store-specific settings view
  if (isSimplifiedView) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Réglages</h1>
          <p className="text-muted-foreground">Configurez votre magasin</p>
        </div>

        <Tabs defaultValue="magasin" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="magasin">Mon Magasin</TabsTrigger>
            <TabsTrigger value="connexions">Mes Connexions</TabsTrigger>
            <TabsTrigger value="compte">Mon Compte</TabsTrigger>
          </TabsList>

          {/* Mon Magasin */}
          <TabsContent value="magasin" className="space-y-6">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Mon Magasin</CardTitle>
                    <CardDescription>Informations et visuels de votre magasin</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du magasin</Label>
                    <Input
                      value={isStore ? storeName : orgName}
                      onChange={(e) => isStore ? setStoreName(e.target.value) : setOrgName(e.target.value)}
                      className="rounded-xl"
                      placeholder="Ex: Ma Boutique"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={isStore ? storeDescription : orgDescription}
                      onChange={(e) => isStore ? setStoreDescription(e.target.value) : setOrgDescription(e.target.value)}
                      className="rounded-xl"
                      placeholder="Description de votre magasin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    {organization?.logo_url && (
                      <div className="w-32 h-32 rounded-xl overflow-hidden border border-border mb-2">
                        <img src={organization.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploading} className="rounded-xl">
                      {uploading ? "Upload..." : organization?.logo_url ? "Changer le logo" : "Uploader le logo"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Image de couverture</Label>
                    {organization?.cover_image_url && (
                      <div className="w-full h-32 rounded-xl overflow-hidden border border-border mb-2">
                        <img src={organization.cover_image_url} alt="Couverture" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => coverInputRef.current?.click()} disabled={uploading} className="rounded-xl">
                      {uploading ? "Upload..." : organization?.cover_image_url ? "Changer la couverture" : "Uploader la couverture"}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={isStore ? handleSaveStore : handleSaveOrganization} className="rounded-xl">
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mes Connexions */}
          <TabsContent value="connexions" className="space-y-6">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Mes Connexions</CardTitle>
                    <CardDescription>Gérez vos connexions aux réseaux sociaux</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {firstStoreId ? (
                  <SocialConnectionsManager storeId={firstStoreId} />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun magasin trouvé pour gérer les connexions
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mon Compte */}
          <TabsContent value="compte" className="space-y-6">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Mon Compte</CardTitle>
                    <CardDescription>Vos informations personnelles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} disabled className="rounded-xl opacity-60 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Nouveau mot de passe</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" className="rounded-xl" />
                </div>
              </CardContent>
            </Card>

            {/* Plan actuel */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-md">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Plan & Facturation</CardTitle>
                    <CardDescription>Votre abonnement actuel</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Plan actuel :</span>
                  <Badge variant="secondary" className="rounded-xl">{getCurrentPlanName()}</Badge>
                </div>
                {subscription.subscribed && subscription.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    Renouvellement le {new Date(subscription.subscription_end).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveAccount} disabled={!accountHasChanges || isSavingProfile} className="rounded-xl">
                {isSavingProfile ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Default (non-store) settings view
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
                <div className="space-y-2">
                  <Label>Logo de l'enseigne</Label>
                  {organization?.logo_url && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-border mb-2">
                      <img src={organization.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploading} className="rounded-xl">
                    {uploading ? "Upload..." : organization?.logo_url ? "Changer le logo" : "Uploader le logo"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Image de couverture</Label>
                  {organization?.cover_image_url && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border border-border mb-2">
                      <img src={organization.cover_image_url} alt="Couverture" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => coverInputRef.current?.click()} disabled={uploading} className="rounded-xl">
                    {uploading ? "Upload..." : organization?.cover_image_url ? "Changer la couverture" : "Uploader la couverture"}
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveOrganization} className="rounded-xl">
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
                  <Input type="color" value={brandingColor} onChange={(e) => setBrandingColor(e.target.value)} className="w-20 h-12 rounded-xl cursor-pointer" />
                  <p className="text-sm text-muted-foreground">Sélectionnez la couleur qui sera appliquée aux boutons CTA de vos promotions</p>
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

              <Button onClick={handleSaveBranding} className="rounded-xl w-full">
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

              <Button onClick={handleSaveIntegrations} className="rounded-xl w-full">
                Enregistrer les modifications
              </Button>
            </CardContent>
          </Card>

          {/* Google Merchant Center Integration */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 410 410">
                    <path d="M137.5 201c-8.56 0-15.5-6.94-15.5-15.5s6.94-15.5 15.5-15.5 15.5 6.94 15.5 15.5-6.94 15.5-15.5 15.5zm165.364 47.632l-93.6-93.6C205.52 151.288 200.32 149 194.6 149h-72.8a20.728 20.728 0 0 0-20.8 20.8v72.8c0 5.72 2.288 10.92 6.136 14.664l93.496 93.6C204.48 354.608 209.68 357 215.4 357s10.92-2.392 14.664-6.136l72.8-72.8C306.712 274.32 309 269.12 309 263.4c0-5.824-2.392-11.024-6.136-14.768z"/>
                  </svg>
                </div>
                <div>
                  <CardTitle>Google Merchant Center</CardTitle>
                  <CardDescription>Synchronisez vos promotions avec Google Shopping</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {firstStoreId ? (
                <GoogleMerchantSettings storeId={firstStoreId} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Créez d'abord un magasin pour connecter Google Merchant Center</p>
                </div>
              )}
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
                      <Button variant="ghost" size="sm" onClick={() => handleEditMechanic(mechanic)} className="rounded-lg">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(mechanic.id)} className="rounded-lg text-destructive hover:text-destructive">
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

              <Button onClick={handleSaveNotifications} className="rounded-xl w-full">
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
