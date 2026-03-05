import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Tag, Eye, MousePointerClick, Facebook, Instagram, Check, Plus, QrCode, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/use-user-data";
import { usePromotions } from "@/hooks/use-promotions";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MyStoreHome = () => {
  const navigate = useNavigate();
  const { organization, loading: userLoading } = useUserData();
  const { promotions, activePromotions, loading: promosLoading } = usePromotions();
  const [store, setStore] = useState<any>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const { connections, loading: connectionsLoading, refetch: refetchConnections } = useSocialConnections(store?.id);
  const { toast } = useToast();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [platformToDisconnect, setPlatformToDisconnect] = useState<'facebook' | 'instagram' | null>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchStore();
    }
  }, [organization?.id]);

  const fetchStore = async () => {
    try {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("organization_id", organization!.id)
        .limit(1)
        .maybeSingle();
      setStore(data);
    } catch (e) {
      console.error("Error fetching store:", e);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!platformToDisconnect || !store?.id) return;
    try {
      const { error } = await supabase
        .from('social_connections')
        .update({ is_connected: false, access_token: null, refresh_token: null })
        .eq('store_id', store.id)
        .eq('platform', platformToDisconnect);
      if (error) throw error;
      toast({
        title: "Déconnexion réussie",
        description: `${platformToDisconnect === 'facebook' ? 'Facebook' : 'Instagram'} a été déconnecté`,
      });
      refetchConnections();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({ title: "Erreur", description: "Impossible de déconnecter le compte", variant: "destructive" });
    } finally {
      setDisconnectDialogOpen(false);
      setPlatformToDisconnect(null);
    }
  };

  const loading = userLoading || promosLoading || storeLoading;

  // Compute KPIs
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const viewsThisMonth = promotions.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const clicksThisMonth = promotions.reduce((sum, p) => sum + (p.clicks_count || 0), 0);

  // Last published promotion
  const publishedPromotions = promotions
    .filter(p => p.status === "active" || p.status === "expired")
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  const lastPromo = publishedPromotions[0] || null;

  const facebookConn = connections.find(c => c.platform === "facebook" && c.is_connected);
  const instagramConn = connections.find(c => c.platform === "instagram" && c.is_connected);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Store className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {store?.name || "Mon Magasin"}
            </h1>
            {store?.is_active !== false ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Actif</Badge>
            ) : (
              <Badge variant="secondary">En pause</Badge>
            )}
          </div>
          {store?.city && (
            <p className="text-muted-foreground text-sm mt-0.5">{store.city}</p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promotions actives</p>
                <p className="text-3xl font-bold text-foreground mt-1">{activePromotions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vues ce mois</p>
                <p className="text-3xl font-bold text-foreground mt-1">{viewsThisMonth.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clics ce mois</p>
                <p className="text-3xl font-bold text-foreground mt-1">{clicksThisMonth.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social Connections */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Réseaux connectés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <Facebook className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">Facebook</p>
                <p className="text-sm text-muted-foreground">
                  {facebookConn ? facebookConn.account_name || "Connecté" : "Non connecté"}
                </p>
              </div>
            </div>
            {facebookConn ? (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { setPlatformToDisconnect('facebook'); setDisconnectDialogOpen(true); }}
              >
                Déconnecter
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => navigate("/settings")}>
                Connecter
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Instagram</p>
                <p className="text-sm text-muted-foreground">
                  {instagramConn ? instagramConn.account_name || "Connecté" : "Non connecté"}
                </p>
              </div>
            </div>
            {instagramConn ? (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { setPlatformToDisconnect('instagram'); setDisconnectDialogOpen(true); }}
              >
                Déconnecter
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => navigate("/settings")}>
                Connecter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Published Promotion */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Dernière promotion publiée</CardTitle>
        </CardHeader>
        <CardContent>
          {lastPromo ? (
            <div
              className="flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-card/50 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(`/promotions/${lastPromo.id}`)}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {lastPromo.image_url ? (
                  <img src={lastPromo.image_url} alt={lastPromo.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{lastPromo.title}</p>
                <p className="text-sm text-muted-foreground">
                  Publiée le {format(new Date(lastPromo.start_date), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground">
                Aucune promotion publiée. Créez votre première promo !
              </p>
              <Button
                className="gradient-primary text-white shadow-glow"
                onClick={() => navigate("/promotions")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer ma première promotion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code download */}
      {store?.qr_code_url && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              const link = document.createElement("a");
              link.href = store.qr_code_url;
              link.download = `qr-code-${store.name}.png`;
              link.click();
            }}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Télécharger mon QR Code
          </Button>
        </div>
      )}
      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir déconnecter ce compte ? Vous devrez vous reconnecter pour publier à nouveau sur cette plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyStoreHome;
