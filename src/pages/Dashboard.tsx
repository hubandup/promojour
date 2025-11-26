import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Tag, Eye, Users, Plus, Instagram, Facebook, Store as StoreIcon, MousePointerClick } from "lucide-react";
import { CreatePromotionDialog } from "@/components/CreatePromotionDialog";
import { InfoAlert } from "@/components/InfoAlert";
import { useUserData } from "@/hooks/use-user-data";
import { usePromotions } from "@/hooks/use-promotions";
import { useStores } from "@/hooks/use-stores";
import { useSocialConnections } from "@/hooks/use-social-connections";

const Dashboard = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { organization, isCentral, loading: userLoading } = useUserData();
  const { promotions, activePromotions, scheduledPromotions, topPromotions, loading: promosLoading } = usePromotions();
  const { stores, loading: storesLoading } = useStores();
  
  // Get first store for social connections (for single store view)
  const firstStore = stores[0];
  const { connections, connectedCount } = useSocialConnections(firstStore?.id);

  const loading = userLoading || promosLoading || storesLoading;

  // Warning thresholds
  const MIN_ACTIVE_PROMOTIONS = 3;
  const MIN_UPCOMING_PROMOTIONS = 5;
  const showWarning = activePromotions.length < MIN_ACTIVE_PROMOTIONS || scheduledPromotions.length < MIN_UPCOMING_PROMOTIONS;

  // Calculate total views
  const totalViews = promotions.reduce((sum, promo) => sum + promo.views_count, 0);
  const totalClicks = promotions.reduce((sum, promo) => sum + promo.clicks_count, 0);
  const engagementRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

  // Social media stats
  const totalFollowers = connections.reduce((sum, conn) => sum + (conn.followers_count || 0), 0);

  const stats = isCentral ? [
    {
      title: "Magasins",
      value: stores.length.toString(),
      change: `${activePromotions.length} promos actives`,
      icon: StoreIcon,
      color: "text-primary",
    },
    {
      title: "Promotions actives",
      value: activePromotions.length.toString(),
      change: `${scheduledPromotions.length} à venir`,
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      title: "Total des vues",
      value: totalViews.toLocaleString(),
      change: `${totalClicks.toLocaleString()} clics`,
      icon: Eye,
      color: "text-green-500",
    },
    {
      title: "Comptes connectés",
      value: connectedCount.toString(),
      change: "Réseaux sociaux",
      icon: Users,
      color: "text-purple-500",
    },
  ] : [
    {
      title: "Promotions actives",
      value: activePromotions.length.toString(),
      change: `${scheduledPromotions.length} à venir`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Total des vues",
      value: totalViews.toLocaleString(),
      change: `${totalClicks.toLocaleString()} clics`,
      icon: Eye,
      color: "text-blue-500",
    },
    {
      title: "Taux d'engagement",
      value: `${engagementRate}%`,
      change: "Clics/Vues",
      icon: MousePointerClick,
      color: "text-green-500",
    },
    {
      title: "Total abonnés",
      value: totalFollowers.toLocaleString(),
      change: `${connectedCount} réseaux`,
      icon: Users,
      color: "text-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isCentral ? 'Vue centrale - Tous vos magasins' : `Bienvenue ${organization?.name || ''}`}
          </p>
        </div>
        <Button 
          className="gradient-primary text-white shadow-glow"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle promotion
        </Button>
      </div>

      {/* Warning Alert */}
      {showWarning && (
        <InfoAlert
          type="warning"
          message={`${activePromotions.length < MIN_ACTIVE_PROMOTIONS ? `Vous avez moins de ${MIN_ACTIVE_PROMOTIONS} promotions actives. ` : ''}${scheduledPromotions.length < MIN_UPCOMING_PROMOTIONS ? `Vous avez moins de ${MIN_UPCOMING_PROMOTIONS} promotions à venir. ` : ''}Pensez à ajouter de nouvelles promotions pour maintenir votre visibilité.`}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="glass-card hover:shadow-glass transition-smooth border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="text-primary font-semibold">{stat.change}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Promotions */}
        <Card className="lg:col-span-2 glass-card border-border/50">
          <CardHeader>
            <CardTitle>{isCentral ? 'Top 5 promotions globales' : 'Top 5 promotions'}</CardTitle>
            <CardDescription>Les promotions les plus performantes</CardDescription>
          </CardHeader>
          <CardContent>
            {topPromotions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune promotion pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {topPromotions.map((promo, index) => (
                  <div
                    key={promo.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:shadow-md hover:border-primary/20 transition-smooth bg-card/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{promo.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {promo.views_count} vues
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-4 h-4" />
                            {promo.clicks_count} clics
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={
                        promo.status === "active" 
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : promo.status === "scheduled"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                      }
                    >
                      {promo.status === "active" ? "Actif" : 
                       promo.status === "scheduled" ? "Programmé" : 
                       promo.status === "expired" ? "Expiré" : "Brouillon"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Social Media Status */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
              <CardDescription>
                {isCentral ? 'Comptes connectés' : 'Statut des connexions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!firstStore && !isCentral ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Configurez votre premier magasin
                </p>
              ) : (
                <>
                  {connections.find(c => c.platform === 'instagram') ? (
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 transition-smooth hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 flex items-center justify-center">
                          <Instagram className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                          <p className="font-semibold">Instagram</p>
                          <p className="text-sm text-muted-foreground">
                            {connections.find(c => c.platform === 'instagram')?.followers_count || 0} followers
                          </p>
                        </div>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-glow"></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 transition-smooth hover:shadow-md opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 flex items-center justify-center">
                          <Instagram className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                          <p className="font-semibold">Instagram</p>
                          <p className="text-sm text-muted-foreground">Non connecté</p>
                        </div>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                    </div>
                  )}

                  {connections.find(c => c.platform === 'facebook') ? (
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 transition-smooth hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Facebook</p>
                          <p className="text-sm text-muted-foreground">
                            {connections.find(c => c.platform === 'facebook')?.followers_count || 0} followers
                          </p>
                        </div>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-glow"></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card/50 transition-smooth hover:shadow-md opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Facebook</p>
                          <p className="text-sm text-muted-foreground">Non connecté</p>
                        </div>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Tip of the day */}
          <Card className="gradient-primary text-white border-0 shadow-glow">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Astuce du jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-95 leading-relaxed">
                {connectedCount === 0 
                  ? "Connectez vos réseaux sociaux pour diffuser automatiquement vos promotions et maximiser votre visibilité !"
                  : "Publiez vos promotions entre 18h et 20h pour maximiser l'engagement de votre audience !"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreatePromotionDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
};

export default Dashboard;
