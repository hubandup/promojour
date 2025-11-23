import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, User, Gift, Shield, FileText, Download } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/use-user-data";

const Account = () => {
  const { subscription, loading, createCheckoutSession, openCustomerPortal, tiers } = useSubscription();
  const { toast } = useToast();
  const { profile, organization, isSuperAdmin, userRole, refetch } = useUserData();
  const [storeCount, setStoreCount] = useState(1);
  const [showCentraleConfig, setShowCentraleConfig] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [switchingProfile, setSwitchingProfile] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer' | 'super_admin' | 'store_manager' | "">("");
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchOrganizations();
    }
  }, [isSuperAdmin]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, account_type')
        .order('name');
      
      if (error) throw error;
      setAvailableOrgs(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    if (subscription.subscribed) {
      fetchPaymentMethod();
      fetchInvoices();
    }
  }, [subscription.subscribed]);

  const fetchPaymentMethod = async () => {
    setLoadingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-method');
      if (error) throw error;
      setPaymentMethod(data?.paymentMethod);
    } catch (error) {
      console.error("Error fetching payment method:", error);
    } finally {
      setLoadingPayment(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-invoices');
      if (error) throw error;
      setInvoices(data?.invoices || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos informations.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleSwitchProfile = async () => {
    if (!selectedOrg || !selectedRole) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une organisation et un rôle.",
        variant: "destructive",
      });
      return;
    }

    setSwitchingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Mettre à jour le profil avec la nouvelle organisation
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ organization_id: selectedOrg })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Vérifier si l'utilisateur a déjà un rôle dans cette organisation
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .eq("organization_id", selectedOrg)
        .single();

      if (existingRole) {
        // Mettre à jour le rôle existant
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: selectedRole })
          .eq("user_id", user.id)
          .eq("organization_id", selectedOrg);

        if (roleError) throw roleError;
      } else {
        // Créer un nouveau rôle
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{
            user_id: user.id,
            organization_id: selectedOrg,
            role: selectedRole as any,
          }]);

        if (roleError) throw roleError;
      }

      toast({
        title: "Profil changé",
        description: "Vous avez changé de profil avec succès.",
      });

      // Rafraîchir les données
      await refetch();
      
      // Reset selections
      setSelectedOrg("");
      setSelectedRole("");
    } catch (error) {
      console.error("Error switching profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de changer de profil.",
        variant: "destructive",
      });
    } finally {
      setSwitchingProfile(false);
    }
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
                  <Input 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean" 
                    className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont" 
                    className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={email}
                  disabled
                  className="rounded-xl border-border/50 bg-background/50 opacity-60 cursor-not-allowed" 
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78" 
                  className="rounded-xl border-border/50 bg-background/50 focus:shadow-md transition-smooth" 
                />
              </div>
              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="rounded-xl hover:shadow-md transition-smooth"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </CardContent>
          </Card>

          {/* Super Admin Tools */}
          {isSuperAdmin && (
            <Card className="glass-card border-border/50 border-2 border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-md">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Super Admin Tools
                      <Badge variant="outline" className="bg-primary/10">Admin</Badge>
                    </CardTitle>
                    <CardDescription>Switcher entre les profils et organisations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Shield className="w-4 h-4" />
                    Profil actuel
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Organisation</p>
                      <p className="font-semibold">{organization?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type de compte</p>
                      <Badge variant="secondary">
                        {organization?.account_type === 'free' && 'Free'}
                        {organization?.account_type === 'store' && 'Magasin Pro'}
                        {organization?.account_type === 'central' && 'Centrale'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rôle</p>
                      <Badge variant="outline">
                        {userRole?.role === 'super_admin' && 'Super Admin'}
                        {userRole?.role === 'admin' && 'Admin'}
                        {userRole?.role === 'editor' && 'Éditeur'}
                        {userRole?.role === 'viewer' && 'Lecteur'}
                        {userRole?.role === 'store_manager' && 'Responsable Magasin'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Changer de profil</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Organisation</Label>
                      <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Sélectionner une organisation" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOrgs.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name} ({org.account_type === 'free' ? 'Free' : org.account_type === 'store' ? 'Magasin Pro' : 'Centrale'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Éditeur</SelectItem>
                          <SelectItem value="viewer">Lecteur</SelectItem>
                          <SelectItem value="store_manager">Responsable Magasin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSwitchProfile}
                    disabled={switchingProfile || !selectedOrg || !selectedRole}
                    className="w-full rounded-xl hover:shadow-md transition-smooth"
                  >
                    {switchingProfile ? "Changement en cours..." : "Changer de profil"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Méthode de paiement</h3>
                {loadingPayment ? (
                  <div className="text-sm text-muted-foreground">Chargement...</div>
                ) : subscription.subscribed && paymentMethod ? (
                  <div className="p-5 border border-border/50 rounded-xl flex items-center justify-between bg-card/50 hover:shadow-md transition-smooth">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-10 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {paymentMethod.brand?.toUpperCase() || "CARD"}
                      </div>
                      <div>
                        <p className="font-semibold">•••• {paymentMethod.last4}</p>
                        <p className="text-sm text-muted-foreground">
                          Expire {paymentMethod.exp_month}/{paymentMethod.exp_year}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl"
                      onClick={openCustomerPortal}
                    >
                      Modifier
                    </Button>
                  </div>
                ) : subscription.subscribed ? (
                  <div className="text-sm text-muted-foreground">Aucune méthode de paiement configurée</div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Souscrivez à un abonnement pour gérer vos moyens de paiement
                  </div>
                )}
              </div>

              {subscription.subscribed && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Historique de facturation</h3>
                  {loadingInvoices ? (
                    <div className="text-sm text-muted-foreground">Chargement...</div>
                  ) : invoices.length > 0 ? (
                    <div className="space-y-2">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 bg-card/50 rounded-xl border border-border/50 hover:bg-accent/10 transition-smooth"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {invoice.number || `Facture ${invoice.id.substring(0, 8)}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(invoice.created * 1000).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold">
                                {invoice.amount.toFixed(2)} {invoice.currency}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {invoice.paid ? 'Payée' : 'En attente'}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => window.open(invoice.invoice_pdf || invoice.hosted_invoice_url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-card/50 rounded-xl border border-border/50">
                      <p className="text-sm text-muted-foreground">
                        Aucune facture disponible
                      </p>
                    </div>
                  )}
                </div>
              )}
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
                            className="rounded-xl bg-white/20 text-white hover:bg-white/30 border border-white/40"
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
                            className="rounded-xl bg-white/20 text-white hover:bg-white/30 border border-white/40"
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
                          className="flex-1 rounded-xl hover:shadow-md transition-smooth bg-white/20 text-white hover:bg-white/30 border border-white/40"
                          onClick={() => setShowCentraleConfig(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          className="flex-1 rounded-xl hover:shadow-md transition-smooth bg-white text-primary hover:bg-white/90"
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
                            className="rounded-xl bg-white/20 text-white hover:bg-white/30 border border-white/40"
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
                            className="rounded-xl bg-white/20 text-white hover:bg-white/30 border border-white/40"
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
                          className="flex-1 rounded-xl hover:shadow-md transition-smooth bg-white/20 text-white hover:bg-white/30 border border-white/40"
                          onClick={() => setShowCentraleConfig(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          className="flex-1 rounded-xl hover:shadow-md transition-smooth bg-white text-primary hover:bg-white/90"
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